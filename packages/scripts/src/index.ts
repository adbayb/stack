#!/usr/bin/env node

import { termost } from "termost";
import { createBuildCommand } from "./commands/build";
import { createCleanCommand } from "./commands/clean";
import { createFixCommand } from "./commands/fix";
import { createSetupCommand } from "./commands/setup";
import { createVerifyCommand } from "./commands/verify";
import { createWatchCommand } from "./commands/watch";
import { CommandFactory } from "./types";

const createProgram = (...commandFactories: Array<CommandFactory>) => {
	const program = termost({
		name: "scripts",
		description: "Toolbox to easily manage a JavaScript/TypeScript project",
		// @todo: to fix
		version: "",
	});

	for (const commandBuilder of commandFactories) {
		commandBuilder(program);
	}
};

// @todo: bootstrap command to set all requirements such as git hooks...?
// @todo: release command

createProgram(
	createBuildCommand,
	createCleanCommand,
	createFixCommand,
	createSetupCommand,
	createVerifyCommand,
	createWatchCommand
);
