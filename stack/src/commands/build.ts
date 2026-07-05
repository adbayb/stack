import { turbo } from "../helpers";
import type { CommandFactory } from "../types";

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
