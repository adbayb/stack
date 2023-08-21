import type { CommandFactory } from "../types";
import { turbo } from "../helpers";

export const createStartCommand: CommandFactory = (program) => {
	program
		.command({
			name: "start",
			description: "Start the project in production mode",
		})
		.task({
			handler() {
				return turbo("start");
			},
		});
};
