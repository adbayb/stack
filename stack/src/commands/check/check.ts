import { logCheckableFiles, turbo } from "../../helpers";
import type { CommandFactory } from "../../types";
import { checkCode } from "./checkCode";
import { checkCommit } from "./checkCommit";
import { checkDependency } from "./checkDependency";
import { checkFormatting } from "./checkFormatting";

const ONLY_VALUES = ["commit", "code", "dependency", "formatting"] as const;

type CommandContext = {
	filter: Filter | undefined;
};

type Filter = (typeof ONLY_VALUES)[number];

export const createCheckCommand: CommandFactory = (program) => {
	program
		.command<CommandContext>({
			description: "Check code health (static analysis)",
			name: "check",
		})
		.option({
			defaultValue: undefined,
			description: `Filter the compliance check to run (accepted value: ${ONLY_VALUES.join(
				", ",
			)})`,
			key: "filter",
			name: "filter",
		})
		.task({
			handler(_, argv) {
				logCheckableFiles(argv.operands);
			},
			skip: ifFilterDefinedAndNotEqualTo("code"),
		})
		.task({
			async handler() {
				await turbo("build", {
					excludeExamples: true,
					hasLiveOutput: false,
				});
			},
			label: label("Prepare the project"),
			skip({ filter }) {
				return filter === "commit"; // No need to build if only commit is checked
			},
		})
		.task({
			async handler() {
				await checkDependency();
			},
			label: label("Check dependency compliance"),
			skip: ifFilterDefinedAndNotEqualTo("dependency"),
		})
		.task({
			async handler(_, argv) {
				const filenames = argv.operands;

				await checkFormatting(filenames);
			},
			label: label("Check formatting compliance"),
			skip: ifFilterDefinedAndNotEqualTo("formatting"),
		})
		.task({
			async handler(_, argv) {
				const filenames = argv.operands;

				await checkCode(filenames);
			},
			label: label("Check code compliance"),
			skip: ifFilterDefinedAndNotEqualTo("code"),
		})
		.task({
			async handler() {
				await checkCommit();
			},
			label: label("Check commit compliance"),
			skip(context) {
				return context.filter !== "commit";
			},
		});
};

const label = (message: string) => `${message} 🧐`;

const ifFilterDefinedAndNotEqualTo = (filter: Filter) => (context: CommandContext) => {
	return context.filter !== undefined && context.filter !== filter;
};
