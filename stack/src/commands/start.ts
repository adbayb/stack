import { helpers } from "termost";

import type { CommandFactory } from "../types";

export const createStartCommand: CommandFactory = (program) => {
	program
		.command({
			name: "start",
			description: "Start the project in production mode",
		})
		.task({
			handler() {
				return helpers.exec("turbo run start", { hasLiveOutput: true });
			},
		});
};
