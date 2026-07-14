import { logCheckableFiles, turbo } from "../../helpers";
import type { CommandFactory } from "../../types";
import { fixCode } from "./fixCode";
import { fixFormatting } from "./fixFormatting";

export const createFixCommand: CommandFactory = (program) => {
	program
		.command({
			name: "fix",
			description: "Fix auto-fixable issues",
		})
		.task({
			handler(_, argv) {
				logCheckableFiles(argv.operands);
			},
		})
		.task({
			label: label("Prepare the project"),
			async handler() {
				await turbo("build", {
					excludeExamples: true,
					hasLiveOutput: false,
				});
			},
		})
		.task({
			label: label("Fix formatting issues"),
			async handler(_, argv) {
				await fixFormatting(argv.operands);
			},
		})
		.task({
			label: label("Fix code issues"),
			async handler(_, argv) {
				await fixCode(argv.operands);
			},
		});
};

const label = (message: string) => {
	return `${message} 🚑`;
};
