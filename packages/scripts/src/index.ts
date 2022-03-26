#!/usr/bin/env node

import { setup } from "@adbayb/terminal-kit";

setup();

const command = process.argv[2] || "";

// @todo: set postinstall script on package.json to set pre-commit and commit hooks
// @todo: add eslint, prettier, lint-staged, commitlint as dependencies (not exposed externally)
// @todo: add typescript as peerDependencies optional since tsconfig is anyway exposed externally (for ide intellisense)

import(`./commands/${command}`)
	.then((module) => module.main())
	.catch((error) => {
		if (error.code === "MODULE_NOT_FOUND") {
			throw new ReferenceError(`Command "${command}" not found`);
		} else {
			throw error;
		}
	});
