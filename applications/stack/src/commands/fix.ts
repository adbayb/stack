import { fixFormatting, fixLints, turbo } from "../helpers";
import type { CommandFactory } from "../types";

export const createFixCommand: CommandFactory = (program) => {
	program
		.command({
			name: "fix",
			description: "Fix auto-fixable issues",
		})
		.task({
			label: label("Preparing the project"),
			async handler() {
				await turbo("build", { hasLiveOutput: false });
			},
		})
		.task({
			label: label("Fixing lints"),
			async handler(_, argv) {
				await fixLints(argv.operands);
			},
		})
		.task({
			label: label("Fixing formatting"),
			async handler(_, argv) {
				await fixFormatting(argv.operands);
			},
		});
};

const label = (message: string) => `${message} 🚑`;
