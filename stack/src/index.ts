#!/usr/bin/env node

import { termost } from "termost";

import { createBuildCommand } from "./commands/build";
import { createCreateCommand } from "./commands/create";
import { createCheckCommand } from "./commands/check";
import { createCleanCommand } from "./commands/clean";
import { createFixCommand } from "./commands/fix";
import { createInstallCommand } from "./commands/install";
import { createReleaseCommand } from "./commands/release";
import { createStartCommand } from "./commands/start";
import { createWatchCommand } from "./commands/watch";
import type { CommandFactory } from "./types";

const createProgram = (...commandFactories: Array<CommandFactory>) => {
	const program = termost({
		name: "stack",
		description: "Toolbox to easily scaffold and maintain a project",
	});

	for (const commandBuilder of commandFactories) {
		commandBuilder(program);
	}
};

createProgram(
	createCreateCommand,
	createInstallCommand,
	createCleanCommand,
	createCheckCommand,
	createFixCommand,
	createStartCommand,
	createBuildCommand,
	createWatchCommand,
	createReleaseCommand,
);
