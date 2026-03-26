import type { CommandFactory } from "../../types";

import { logCheckableFiles, turbo } from "../../helpers";
import { fixFormatting } from "./fixFormatting";
import { fixLinter } from "./fixLinter";

export const createFixCommand: CommandFactory = (program) => {
	program
		.command({
			description: "Fix auto-fixable issues",
			name: "fix",
		})
		.task({
			handler(_, argv) {
				logCheckableFiles(argv.operands);
			},
		})
		.task({
			async handler() {
				await turbo("build", {
					excludeExamples: true,
					hasLiveOutput: false,
				});
			},
			label: label("Prepare the project"),
		})
		.task({
			async handler(_, argv) {
				await fixLinter(argv.operands);
			},
			label: label("Fix linter issues"),
		})
		.task({
			async handler(_, argv) {
				await fixFormatting(argv.operands);
			},
			label: label("Fix formatting issues"),
		});
};

const label = (message: string) => `${message} 🚑`;
