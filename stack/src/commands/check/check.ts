import type { CommandFactory } from "../../types";
import { hasDependency, logCheckableFiles, turbo } from "../../helpers";
import { checkType } from "./checkType";
import { checkDependency } from "./checkDependency";
import { checkCommit } from "./checkCommit";
import { checkCode } from "./checkCode";

const ONLY_VALUES = ["commit", "code", "dependency", "type"] as const;

type Filter = (typeof ONLY_VALUES)[number];

type CommandContext = {
	filter: Filter | undefined;
};

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
				return filter === "commit"; // No need to build if only commit is checked
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
			label: label("Check code compliance"),
			async handler(_, argv) {
				const filenames = argv.operands;

				await checkCode(filenames);
			},
			skip: ifFilterDefinedAndNotEqualTo("code"),
		})
		.task({
			label: label("Check type compliance"),
			async handler() {
				await checkType();
			},
			skip(context, argv) {
				return (
					ifFilterDefinedAndNotEqualTo("type")(context) ||
					!hasDependency("typescript") ||
					/**
					 * For now, skip type-checking if some files are passed down.
					 * @see https://github.com/microsoft/TypeScript/issues/27379
					 */
					argv.operands.length > 0
				);
			},
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

const label = (message: string) => `${message} 🧐`;

const ifFilterDefinedAndNotEqualTo =
	(filter: Filter) => (context: CommandContext) => {
		return context.filter !== undefined && context.filter !== filter;
	};
