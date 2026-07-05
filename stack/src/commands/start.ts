import { turbo } from "../helpers";
import type { CommandFactory } from "../types";

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
