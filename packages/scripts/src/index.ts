#!/usr/bin/env node

import { termost } from "termost";

import { createCleanCommand } from "./commands/clean";
import { createFixCommand } from "./commands/fix";
import { createSetupCommand } from "./commands/setup";
import { createVerifyCommand } from "./commands/verify";
import type { CommandFactory } from "./types";

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
	createCleanCommand,
	createFixCommand,
	createSetupCommand,
	createVerifyCommand
);
