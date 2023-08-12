import { resolve } from "node:path";
import { helpers } from "termost";
import { readFileSync, renameSync, writeFileSync } from "node:fs";

import type { CommandFactory } from "../types";
import {
	createError,
	getRepositoryUrl,
	request,
	resolveFromProjectDirectory,
	resolveFromStackDirectory,
} from "../helpers";
import defaultTemplateConfig from "../../templates/default/config.json";

type CreateCommandContext = {
	pkgName: string;
	pkgDescription: string;
	repositoryUrl: string;
	templateInput: Record<string, string>;
};

/**
 * TODO:
 * - Symlink the pkg README file to the repository root
 * - Test the package create with npm init in real condition (npm link?)
 */
export const createCreateCommand: CommandFactory = (program) => {
	program
		.command<CreateCommandContext>({
			name: "create",
			description: "Scaffold a new project",
		})
		.task({
			label: "Check pre-requisites",
			key: "repositoryUrl",
			async handler() {
				try {
					// This step is used as well to persist the repository url value:
					return await getRepositoryUrl();
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
			label: "Initialize the context",
			key: "templateInput",
			async handler({ pkgDescription, repositoryUrl }) {
				const nodeVersion = await request.get(
					"https://resolve-node.vercel.app/lts",
					"text",
				);

				const npmVersion = (
					await request.get(
						"https://registry.npmjs.org/pnpm/latest",
						"json",
					)
				).version as string;

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
			label: "Apply the default template",
			async handler({ templateInput }) {
				await extractTemplate();

				// Hydrate template expressions with context values:
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
			async handler(context) {
				const localDevDependencies = ["quickbundle"];

				const globalDevDependencies = [
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

				try {
					for (const dependency of globalDevDependencies) {
						await helpers.exec(
							`pnpm add ${dependency}@latest --save-dev --ignore-workspace-root-check`,
						);
					}

					for (const dependency of localDevDependencies) {
						await helpers.exec(
							`pnpm add ${dependency}@latest --save-dev --filter ${context.pkgName}`,
						);
					}
				} catch (error) {
					throw createError("pnpm", error);
				}
			},
		})
		.task({
			label: "Clean up",
			async handler() {
				try {
					await setPkgManager();
					await helpers.exec("pnpm fix");
					await helpers.exec("pnpm check");
				} catch (error) {
					throw createError("clean", error);
				}
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
	const evaluate = (expression: string) => {
		return expression.replace(/{{(.*?)}}/g, (_, key) => input[key] || "");
	};

	return {
		hydrate() {
			for (const filename of config.files) {
				const filepath = resolveFromProjectDirectory(filename);
				const content = readFileSync(filepath, "utf-8");

				writeFileSync(filepath, evaluate(content));
			}
		},
		async rename() {
			try {
				for (const pathname of config.folders) {
					renameSync(
						resolveFromProjectDirectory(pathname),
						resolveFromProjectDirectory(evaluate(pathname)),
					);
				}
			} catch {
				// Silent error in case of stack re-creation
			}
		},
	};
};

const extractTemplate = async () => {
	const compressedFilePath = resolve(
		resolveFromStackDirectory("./templates"),
		"./default/content.tar.gz",
	);

	const destinationPath = resolveFromProjectDirectory("./");

	return helpers.exec(
		`tar -xzf ${compressedFilePath} -C ${destinationPath} --strip-components=1`,
	);
};

const setPkgManager = () => {
	return helpers.exec("corepack enable");
};