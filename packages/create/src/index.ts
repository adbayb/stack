#!/usr/bin/env node

import { join } from "node:path";
import { helpers, termost } from "termost";
import { getRepositoryUrl } from "@internal/helpers";

import { PACKAGE_FOLDER, PROJECT_FOLDER, TEMPLATES_FOLDER } from "./constants";
import { copyTemplates, processPkg, setPkgManager } from "./helpers";

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
		label: "Retrieve repository URL",
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
		label: "Process `package.json` files",
		handler() {
			return processPkg();
		},
	})
	.task({
		label: "Set package manager up",
		handler() {
			return setPkgManager();
		},
	})
	.task({
		label: "Install dependencies",
		handler() {
			const dependencies = [
				"@adbayb/eslint-config",
				"@adbayb/prettier-config",
				"@adbayb/ts-config",
				"eslint",
				"prettier",
				"typescript",
			];

			return helpers.exec(
				`pnpm add ${dependencies.join("@latest, ")}@latest --dev`,
			);
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
