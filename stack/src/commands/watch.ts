import type { CommandFactory } from "../types";
import { turbo } from "../helpers";

export const createWatchCommand: CommandFactory = (program) => {
	program
		.command({
			name: "watch",
			description: "Build and start the project in development mode",
		})
		.task({
			handler() {
				return turbo("watch");
			},
		});
};
