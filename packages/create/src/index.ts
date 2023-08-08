#!/usr/bin/env node

import { join } from "node:path";
import { helpers, termost } from "termost";
import { getRepositoryUrl } from "@internal/helpers";

import { PACKAGE_FOLDER, PROJECT_FOLDER, TEMPLATES_FOLDER } from "./constants";
import { copyTemplates, createPkgFile, setPkgManager } from "./helpers";

type ProgramContext = {
	repositoryUrl: string;
};

const program = termost<ProgramContext>({
	name: "@adbayb/create",
	description: "Toolbox to easily scaffold a JavaScript/TypeScript project",
});

const TEST_FOLDER = join(__dirname, "../dist");

program
	.task({
		key: "repositoryUrl",
		label: "Get critical context",
		handler() {
			// @todo: get dynamically all needed variables including latest lts node version, pnpm version, extract shorthand repo id, ...
			return getRepositoryUrl();
		},
	})
	.task({
		label: "Apply templates",
		handler() {
			return copyTemplates();
		},
	})
	.task({
		label: "Generate `package.json` files",
		handler() {
			return createPkgFile();
		},
	})
	.task({
		label: "Set up the package manager",
		handler() {
			return setPkgManager();
		},
	})
	.task({
		label: "Replace template placeholders",
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
				"@adbayb/scripts",
				"@changesets/changelog-github",
				"@changesets/cli",
				"@commitlint/cli",
				"@commitlint/config-conventional",
				"eslint",
				"prettier",
				"turbo",
				"typescript",
			];

			console.log(dependencies);

			/*for (const dep of dependencies) {
				await helpers.exec(`pnpm add ${dep}@latest --save-dev`);
			}*/
		},
	})
	.task({
		label: "Run quality checks",
		async handler() {
			helpers.exec("pnpm fix");
			helpers.exec("pnpm check");
		},
	})
	.task({
		handler(context) {
			helpers.message(`Repository path: ${context.repositoryUrl}`);
			helpers.message(`Test path: ${TEST_FOLDER}`);
			helpers.message(`Project path: ${PROJECT_FOLDER}`);
			helpers.message(`Package path: ${PACKAGE_FOLDER}`);
			helpers.message(`Templates path: ${TEMPLATES_FOLDER}`);
		},
	});
