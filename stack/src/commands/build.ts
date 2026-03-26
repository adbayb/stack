import type { CommandFactory } from "../types";

import { turbo } from "../helpers";

export const createBuildCommand: CommandFactory = (program) => {
	program
		.command({
			description: "Build the project in production mode",
			name: "build",
		})
		.task({
			async handler() {
				await turbo("build");
			},
		});
};
