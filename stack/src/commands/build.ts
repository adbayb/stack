import { turbo } from "../helpers";
import type { CommandFactory } from "../types";

export const createBuildCommand: CommandFactory = (program) => {
	program
		.command({
			name: "build",
			description: "Build the project in production mode",
		})
		.task({
			async handler() {
				await turbo("build");
			},
		});
};
