import { CommandFactory } from "../types";
import { lintRules, lintTypes } from "../helpers";

export const createVerifyCommand: CommandFactory = (program) => {
	program
		.command({
			name: "verify",
			description: "Verify the project health",
		})
		.task({
			label: "Checking linter rules 🧐",
			handler(_, argv) {
				return lintRules(argv.operands);
			},
		})
		.task({
			label: "Checking types 🧐",
			skip() {
				return !require.resolve("typescript");
			},
			handler(_, argv) {
				return lintTypes(argv.operands);
			},
		});
};
