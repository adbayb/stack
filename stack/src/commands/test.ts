import type { CommandFactory } from "../types";

import { turbo } from "../helpers";

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
