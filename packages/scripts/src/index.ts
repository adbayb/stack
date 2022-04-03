#!/usr/bin/env node

import { termost } from "termost";
import { createBuildCommand } from "./commands/build";
import { createCleanCommand } from "./commands/clean";
import { createFixCommand } from "./commands/fix";
import { createReleaseCommand } from "./commands/release";
import { createServeCommand } from "./commands/serve";
import { createSetupCommand } from "./commands/setup";
import { createVerifyCommand } from "./commands/verify";
import { createWatchCommand } from "./commands/watch";
import { CommandFactory } from "./types";

const createProgram = (...commandFactories: Array<CommandFactory>) => {
	const program = termost({
		name: "scripts",
		description: "Toolbox to easily manage a JavaScript/TypeScript project",
	});

	for (const commandBuilder of commandFactories) {
		commandBuilder(program);
	}
};

createProgram(
	createBuildCommand,
	createCleanCommand,
	createFixCommand,
	createReleaseCommand,
	createServeCommand,
	createSetupCommand,
	createVerifyCommand,
	createWatchCommand
);
