import type { CommandFactory } from "../types";
import { fixFormatting, fixLints, turbo } from "../helpers";

export const createFixCommand: CommandFactory = (program) => {
	program
		.command({
			name: "fix",
			description: "Fix auto-fixable issues",
		})
		.task({
			label: label("Preparing the project"),
			handler() {
				return turbo("build", { hasLiveOutput: false });
			},
		})
		.task({
			label: label("Fixing lints"),
			handler(_, argv) {
				return fixLints(argv.operands);
			},
		})
		.task({
			label: label("Fixing formatting"),
			handler(_, argv) {
				return fixFormatting(argv.operands);
			},
		});
};

const label = (message: string) => `${message} 🚑`;
