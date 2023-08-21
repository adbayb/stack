import type { CommandFactory } from "../types";
import { turbo } from "../helpers";

export const createBuildCommand: CommandFactory = (program) => {
	program
		.command({
			name: "build",
			description: "Build the project in production mode",
		})
		.task({
			handler() {
				return turbo("build");
			},
		});
};
