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
			name: "check",
			description: "Check code health (static analysis)",
		})
		.option({
			key: "filter",
			name: "filter",
			description: `Filter the compliance check to run (accepted value: ${ONLY_VALUES.join(
				", ",
			)})`,
			defaultValue: undefined,
		})
		.task({
			handler(_, argv) {
				logCheckableFiles(argv.operands);
			},
			skip: ifFilterDefinedAndNotEqualTo("code"),
		})
		.task({
			label: label("Prepare the project"),
			async handler() {
				await turbo("build", {
					excludeExamples: true,
					hasLiveOutput: false,
				});
			},
			skip({ filter }) {
				// No need to build if only commit is checked
				return filter === "commit";
			},
		})
		.task({
			label: label("Check dependency compliance"),
			async handler() {
				await checkDependency();
			},
			skip: ifFilterDefinedAndNotEqualTo("dependency"),
		})
		.task({
			label: label("Check formatting compliance"),
			async handler(_, argv) {
				const filenames = argv.operands;

				await checkFormatting(filenames);
			},
			skip: ifFilterDefinedAndNotEqualTo("formatting"),
		})
		.task({
			label: label("Check code compliance"),
			async handler(_, argv) {
				const filenames = argv.operands;

				await checkCode(filenames);
			},
			skip: ifFilterDefinedAndNotEqualTo("code"),
		})
		.task({
			label: label("Check commit compliance"),
			async handler() {
				await checkCommit();
			},
			skip(context) {
				return context.filter !== "commit";
			},
		});
};

const label = (message: string) => {
	return `${message} 🧐`;
};

const ifFilterDefinedAndNotEqualTo = (filter: Filter) => {
	return (context: CommandContext) => {
		return context.filter !== undefined && context.filter !== filter;
	};
};
