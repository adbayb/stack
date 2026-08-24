import { termost } from "termost";
import { createBuildCommand } from "./commands/build";
import { createCheckCommand } from "./commands/check";
import { createCleanCommand } from "./commands/clean";
import { createCreateCommand } from "./commands/create";
import { createFixCommand } from "./commands/fix";
import { createInstallCommand } from "./commands/install";
import { createReleaseCommand } from "./commands/release";
import { createStartCommand } from "./commands/start";
import { createTestCommand } from "./commands/test";
import { createWatchCommand } from "./commands/watch";
import { VERSION } from "./constants";
import { logger } from "./helpers";
import type { CommandFactory } from "./types";

const createProgram = (...commandFactories: CommandFactory[]) => {
	const program = termost({
		name: "stack",
		description: "Toolbox to easily scaffold and maintain a project",
		onException() {
			logger.error("Oops, an error occurred.\nKeep calm and carry on with some coffee ☕️.");
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
