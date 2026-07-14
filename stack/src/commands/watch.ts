import { turbo } from "../helpers";
import type { CommandFactory } from "../types";

export const createWatchCommand: CommandFactory = (program) => {
	program
		.command({
			name: "watch",
			description: "Build and start the project in development mode",
		})
		.task({
			async handler() {
				await turbo("watch");
			},
		});
};
