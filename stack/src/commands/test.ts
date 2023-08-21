import { turbo } from "../helpers";
import type { CommandFactory } from "../types";

export const createTestCommand: CommandFactory = (program) => {
	program
		.command({
			name: "test",
			description: "Test the code execution",
		})
		.task({
			handler() {
				return turbo("test");
			},
		});
};
