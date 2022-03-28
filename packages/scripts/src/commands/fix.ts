import { CommandFactory } from "../types";
import { fixRules } from "../helpers";

export const createFixCommand: CommandFactory = (program) => {
	program
		.command({
			name: "fix",
			description: "Fix all auto-fixable issues",
		})
		.task({
			label: "Fixing lint rules 🚑",
			handler(_, argv) {
				return fixRules(argv.operands);
			},
		});
};
