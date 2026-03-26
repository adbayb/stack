import type { CommandFactory } from "../types";

import { turbo } from "../helpers";

export const createStartCommand: CommandFactory = (program) => {
	program
		.command({
			description: "Start the project in production mode",
			name: "start",
		})
		.task({
			async handler() {
				await turbo("start");
			},
		});
};
