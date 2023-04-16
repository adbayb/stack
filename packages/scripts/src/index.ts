#!/usr/bin/env node

import { termost } from "termost";

import { createCheckCommand } from "./commands/check";
import { createCleanCommand } from "./commands/clean";
import { createFixCommand } from "./commands/fix";
import { createSetupCommand } from "./commands/setup";
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
	createCheckCommand,
	createCleanCommand,
	createFixCommand,
	createSetupCommand,
);
