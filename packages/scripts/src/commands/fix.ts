import { CommandFactory } from "../types";
import { fixFormatting, fixLint } from "../helpers";

export const createFixCommand: CommandFactory = (program) => {
	program
		.command({
			name: "fix",
			description: "Fix all auto-fixable issues",
		})
		.task({
			label: "Fixing linter rules 🚑",
			handler(_, argv) {
				return fixLint(argv.operands);
			},
		})
		.task({
			label: "Fixing formatting 🚑",
			handler(_, argv) {
				return fixFormatting(argv.operands);
			},
		});
};
