#!/usr/bin/env node

import { termost } from "termost";

import { createCheckCommand } from "./commands/check";
import { createCleanCommand } from "./commands/clean";
import { createFixCommand } from "./commands/fix";
import { createInstallCommand } from "./commands/install";
import type { CommandFactory } from "./types";
import { createCreateCommand } from "./commands/create";

const createProgram = (...commandFactories: Array<CommandFactory>) => {
	const program = termost({
		name: "stack",
		description:
			"Toolbox to easily scaffold and manage a JavaScript/TypeScript project",
	});

	for (const commandBuilder of commandFactories) {
		commandBuilder(program);
	}
};

createProgram(
	createCreateCommand,
	createCheckCommand,
	createCleanCommand,
	createFixCommand,
	createInstallCommand,
);
