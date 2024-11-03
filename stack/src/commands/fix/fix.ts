import type { CommandFactory } from "../../types";
import { turbo } from "../../helpers";
import { fixLinter } from "./fixLinter";
import { fixFormatting } from "./fixFormatting";

export const createFixCommand: CommandFactory = (program) => {
	program
		.command({
			name: "fix",
			description: "Fix auto-fixable issues",
		})
		.task({
			label: label("Prepare the project"),
			async handler() {
				await turbo("build", { hasLiveOutput: false });
			},
		})
		.task({
			label: label("Fix linter issues"),
			async handler(_, argv) {
				await fixLinter(argv.operands);
			},
		})
		.task({
			label: label("Fix formatting issues"),
			async handler(_, argv) {
				await fixFormatting(argv.operands);
			},
		});
};

const label = (message: string) => `${message} 🚑`;
