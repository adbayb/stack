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
		label: "Set the package manager up",
		handler() {
			return setPkgManager();
		},
	})
	.task({
		label: "Install dependencies",
		async handler() {
			const dependencies = [
				"@adbayb/eslint-config",
				"@adbayb/prettier-config",
				"@adbayb/ts-config",
				"eslint",
				"prettier",
				"turbo",
				"typescript",
			];

			for (const dep of dependencies) {
				await helpers.exec(`pnpm add ${dep}@latest --save-dev`);
			}
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
