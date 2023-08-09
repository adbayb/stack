import { join, parse } from "node:path";
import { helpers } from "termost";
import { cp, readdir, rename } from "node:fs/promises";

import type { CommandFactory } from "../../types";
import { createError, getRepositoryUrl } from "../../helpers";

import { PACKAGE_FOLDER, PROJECT_FOLDER, TEMPLATES_FOLDER } from "./constants";

type CreateCommandContext = {
	pkgName: string;
	pkgDescription: string;
	repositoryUrl: string;
	templateValues: Record<string, string>;
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
			key: "pkgName",
			label: "What's your main package name?",
			skip: () => true,
		})
		.input({
			type: "text",
			key: "pkgDescription",
			label: "What's your main package description?",
			skip: () => true,
		})
		.task({
			label: "Get template values",
			key: "templateValues",
			async handler({ pkgName, pkgDescription, repositoryUrl }) {
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

				return {
					license_year: new Date().getFullYear().toString(),
					node_version: nodeVersion,
					npm_version: npmVersion,
					repo_id: `${repoOwner}/${repoName}`,
					pkg_name: pkgName,
					pkg_description: pkgDescription,
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
			label: "Hydrate templates",
			handler() {
				// .nvmrc => node_version => https://resolve-node.vercel.app/lts
				// package.json => {{ pnpm_version }} => https://registry.npmjs.org/pnpm/latest
				// LICENSE => {{ license_year }}
				// .changeset/config.json => {{ repo_id }}

				return;
			},
		})
		.task({
			label: "Symlink the `README.md` file",
			handler() {
				// @todo: from {{ pkg_name }} to root

				return;
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
				await setPkgManager();
				await helpers.exec("pnpm fix");
				await helpers.exec("pnpm check");
			},
		});
};

export const copyTemplates = async () => {
	// Copy all template files to the target recursively
	await cp(TEMPLATES_FOLDER, PROJECT_FOLDER, { recursive: true });

	/**
	 * `.tmpl` extension removal post processing
	 * Some templates have this extension to allow their publication in the NPM registry
	 * Indeed, by default, some files are always excluded by NPM during the package publish process (eg. `.npmrc` and `.gitignore`)
	 * @see https://docs.npmjs.com/cli/v9/configuring-npm/package-json#files)
	 */
	const files = await readdir(TEMPLATES_FOLDER);

	return Promise.all(
		files.map(async (filename) => {
			const { ext, name } = parse(filename);

			if (ext !== ".tmpl") {
				return Promise.resolve(); // no-op
			}

			return rename(
				join(PROJECT_FOLDER, filename),
				join(PROJECT_FOLDER, name),
			);
		}),
	);
};

export const setPkgManager = () => {
	return helpers.exec("corepack enable");
};
