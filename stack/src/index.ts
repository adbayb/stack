import { termost } from "termost";

import type { CommandFactory } from "./types";
import { botMessage } from "./helpers";
import { VERSION } from "./constants";
import { createWatchCommand } from "./commands/watch";
import { createTestCommand } from "./commands/test";
import { createStartCommand } from "./commands/start";
import { createReleaseCommand } from "./commands/release";
import { createInstallCommand } from "./commands/install";
import { createFixCommand } from "./commands/fix";
import { createCreateCommand } from "./commands/create";
import { createCleanCommand } from "./commands/clean";
import { createCheckCommand } from "./commands/check";
import { createBuildCommand } from "./commands/build";

const createProgram = (...commandFactories: CommandFactory[]) => {
	const program = termost({
		name: "stack",
		description: "Toolbox to easily scaffold and maintain a project",
		onException() {
			botMessage({
				title: "Oops, an error occurred",
				description: "Keep calm and carry on with some coffee ☕️",
				type: "error",
			});
		},
		version: VERSION,
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
	createTestCommand,
	createReleaseCommand,
);
