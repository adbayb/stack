import { turbo } from "../helpers";
import type { CommandFactory } from "../types";

export const createTestCommand: CommandFactory = (program) => {
	program
		.command({
			description: "Test the code execution",
			name: "test",
		})
		.task({
			async handler() {
				await turbo("test");
			},
		});
};
