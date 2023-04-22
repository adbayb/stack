#!/usr/bin/env node

import { join } from "node:path";
import { helpers, termost } from "termost";
import { getRepositoryUrl } from "@internal/helpers";

import { PACKAGE_FOLDER, PROJECT_FOLDER, TEMPLATES_FOLDER } from "./constants";

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
		async handler() {
			return await getRepositoryUrl();
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
