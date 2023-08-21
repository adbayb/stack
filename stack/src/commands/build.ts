import { helpers } from "termost";

import type { CommandFactory } from "../types";

export const createBuildCommand: CommandFactory = (program) => {
	program
		.command({
			name: "build",
			description: "Build the project in production mode",
		})
		.task({
			handler() {
				return helpers.exec("turbo run build", { hasLiveOutput: true });
			},
		});
};
