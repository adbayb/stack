import { turbo } from "../helpers";
import type { CommandFactory } from "../types";

export const createTestCommand: CommandFactory = (program) => {
	program
		.command({
			name: "test",
			description: "Run the test suite",
		})
		.task({
			async handler() {
				await turbo("test");
			},
		});
};
