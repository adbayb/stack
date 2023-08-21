import { helpers } from "termost";

import type { CommandFactory } from "../types";

export const createWatchCommand: CommandFactory = (program) => {
	program
		.command({
			name: "watch",
			description: "Build and start the project in development mode",
		})
		.task({
			handler() {
				return helpers.exec("turbo run watch", { hasLiveOutput: true });
			},
		});
};
