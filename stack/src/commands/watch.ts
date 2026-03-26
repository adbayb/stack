import type { CommandFactory } from "../types";

import { turbo } from "../helpers";

export const createWatchCommand: CommandFactory = (program) => {
	program
		.command({
			description: "Build and start the project in development mode",
			name: "watch",
		})
		.task({
			async handler() {
				await turbo("watch");
			},
		});
};
