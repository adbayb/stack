import { resolve } from "node:path";
import { helpers } from "termost";
import { cp } from "node:fs/promises";
import { readFileSync, renameSync, writeFileSync } from "node:fs";

import type { CommandFactory } from "../../types";
import { createError, getRepositoryUrl } from "../../helpers";
import defaultTemplateConfig from "../../../templates/default/config.json";

import { PACKAGE_FOLDER, PROJECT_FOLDER, TEMPLATES_FOLDER } from "./constants";

type CreateCommandContext = {
	pkgName: string;
	pkgDescription: string;
	repositoryUrl: string;
	templateInput: Record<string, string>;
};

export const createCreateCommand: CommandFactory = (program) => {
	program
		.command<CreateCommandContext>({
			name: "create",
			description: "Scaffold a new project",
		})
		.task({
			label: "Check pre-requisites",
			key: "repositoryUrl",
			handler() {
				try {
					// This step is used as well to persist the repository url value:
					return getRepositoryUrl();
				} catch (error) {
					throw createError(
						"git",
						`The project must be a \`git\` repository with an origin already setup. Have you tried to run \`git init && git remote add origin git@github.com:OWNER/REPOSITORY.git && git add -A && git commit -m "chore: initial commit" && git push -u origin main\`?\n${error}`,
					);
				}
			},
		})
		.input({
			type: "text",
			key: "pkgDescription",
			label: "How would you describe your project?",
		})
		.task({
			label: "Get template values",
			key: "templateInput",
			async handler({ pkgDescription, repositoryUrl }) {
				// @todo: resilient fetch
				const nodeVersion = await (
					await fetch("https://resolve-node.vercel.app/lts")
				).text();

				const npmVersion = (
					await (
						await fetch("https://registry.npmjs.org/pnpm/latest")
					).json()
				).version;

				const { repoOwner, repoName } =
					repositoryUrl.match(
						repositoryUrl.startsWith("git")
							? /^git@.*:(?<repoOwner>.*)\/(?<repoName>.*)\.git$/
							: /^https?:\/\/.*\/(?<repoOwner>.*)\/(?<repoName>.*)\.git$/,
					)?.groups ?? {};

				if (!repoOwner || !repoName) {
					throw createError(
						"git",
						"The owner and repository name can not be extracted. Please make sure to follow either `/^git@.*:(?<repoOwner>.*)/(?<repoName>.*).git$/` or `/^https?://.*/(?<repoOwner>.*)/(?<repoName>.*).git$/` pattern.",
					);
				}

				const id = `${repoOwner}/${repoName}`;

				return {
					license_year: new Date().getFullYear().toString(),
					node_version: nodeVersion,
					npm_version: npmVersion,
					repo_id: id,
					pkg_description: pkgDescription,
					pkg_name: repoName,
					pkg_folder: repoName,
				};
			},
		})
		.task({
			label: "Copy templates",
			handler() {
				return copyTemplates();
			},
		})
		.task({
			label: "Evaluate templates",
			handler({ templateInput }) {
				const engine = createTemplateEngine(
					defaultTemplateConfig,
					templateInput,
				);

				engine.hydrate();
				engine.rename();
			},
		})
		.task({
			label: "Install dependencies",
			async handler() {
				const dependencies = [
					"@adbayb/eslint-config",
					"@adbayb/prettier-config",
					"@adbayb/ts-config",
					"@adbayb/stack",
					"@changesets/changelog-github",
					"@changesets/cli",
					"@commitlint/cli",
					"@commitlint/config-conventional",
					"eslint",
					"prettier",
					"turbo",
					"typescript",
				];

				dependencies;

				// @todo: install dependencies for {{ pkg_folder }} (including typescript and quickbundle)

				/*for (const dep of dependencies) {
					await helpers.exec(`pnpm add ${dep}@latest --save-dev`);
				}*/
			},
		})
		.task({
			handler(context) {
				helpers.message(JSON.stringify(context, null, 4));
				helpers.message(`Repository path: ${context.repositoryUrl}`);
				helpers.message(`Project path: ${PROJECT_FOLDER}`);
				helpers.message(`Package path: ${PACKAGE_FOLDER}`);
				helpers.message(`Templates path: ${TEMPLATES_FOLDER}`);
			},
		})
		.task({
			label: "Clean up",
			async handler() {
				// @todo: symlink readme file
				await setPkgManager();
				await helpers.exec("pnpm fix");
				await helpers.exec("pnpm check");
			},
		});
};

/**
 * A simple template engine to evaluate dynamic expressions and apply side effets (such as hydrating a content with values from an input object) on impacted template files
 * @param config Configuration object listing template files/folders that need expression evaluation
 * @param input Input object mapping the template expression key with its corresponding value
 */
const createTemplateEngine = (
	config: Record<"files" | "folders", Array<string>>,
	input: CreateCommandContext["templateInput"],
) => {
	const resolveFromRootDir = (filename: string) =>
		resolve(PROJECT_FOLDER, filename);

	const evaluate = (expression: string) => {
		return expression.replace(/{{(.*?)}}/g, (_, key) => input[key] || "");
	};

	return {
		hydrate() {
			for (const filename of config.files) {
				const filepath = resolveFromRootDir(filename);
				const content = readFileSync(filepath, "utf-8");

				writeFileSync(filepath, evaluate(content));
			}
		},
		rename() {
			try {
				for (const pathname of config.folders) {
					renameSync(
						resolveFromRootDir(pathname),
						resolveFromRootDir(evaluate(pathname)),
					);
				}
			} catch {
				// Silent error in case of stack re-creation
			}
		},
	};
};

// TODO gzip via zlib.createUnzip() instead (no more tmpl file) => templates/default.tar.gz (it can welcome later other specialized template)
export const copyTemplates = () => {
	// Copy all template files to the target recursively
	return cp(TEMPLATES_FOLDER, PROJECT_FOLDER, { recursive: true });
};

export const setPkgManager = () => {
	return helpers.exec("corepack enable");
};
