import { logCheckableFiles, turbo } from "../../helpers";
import type { CommandFactory } from "../../types";
import { fixCode } from "./fixCode";
import { fixFormatting } from "./fixFormatting";

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
				await fixFormatting(argv.operands);
			},
			label: label("Fix formatting issues"),
		})
		.task({
			async handler(_, argv) {
				await fixCode(argv.operands);
			},
			label: label("Fix code issues"),
		});
};

const label = (message: string) => `${message} 🚑`;
