import type { CommandFactory } from "../../types";
import { hasDependency, logCheckableFiles, turbo } from "../../helpers";
import { checkTypes } from "./checkTypes";
import { checkPackages } from "./checkPackages";
import { checkLinter } from "./checkLinter";
import { checkCommit } from "./checkCommit";

const ONLY_VALUES = ["commit", "linter", "packages", "types"] as const;

type Only = (typeof ONLY_VALUES)[number];

type CommandContext = {
	only: Only | undefined;
};

export const createCheckCommand: CommandFactory = (program) => {
	program
		.command<CommandContext>({
			name: "check",
			description: "Check code health (static analysis)",
		})
		.option({
			key: "only",
			name: "only",
			description: `Run only one specified task (accepted value: ${ONLY_VALUES.join(
				", ",
			)})`,
			defaultValue: undefined,
		})
		.task({
			handler(_, argv) {
				logCheckableFiles(argv.operands);
			},
			skip: ifOnlyDefinedAndNotEqualTo("linter"),
		})
		.task({
			label: label("Prepare the project"),
			async handler() {
				await turbo("build", {
					excludeExamples: true,
					hasLiveOutput: false,
				});
			},
			skip({ only }) {
				return only === "commit"; // No need to build if only commit is checked
			},
		})
		.task({
			label: label("Check package guidelines"),
			async handler() {
				await checkPackages();
			},
			skip: ifOnlyDefinedAndNotEqualTo("packages"),
		})
		.task({
			label: label("Check linter rules"),
			async handler(_, argv) {
				const filenames = argv.operands;

				await checkLinter(filenames);
			},
			skip: ifOnlyDefinedAndNotEqualTo("linter"),
		})
		.task({
			label: label("Check types"),
			async handler() {
				await checkTypes();
			},
			skip(context, argv) {
				return (
					ifOnlyDefinedAndNotEqualTo("types")(context) ||
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
			label: label("Check commit"),
			async handler() {
				await checkCommit();
			},
			skip({ only }) {
				return only !== "commit";
			},
		});
};

const label = (message: string) => `${message} 🧐`;

const ifOnlyDefinedAndNotEqualTo =
	(only: Only) => (context: CommandContext) => {
		return context.only !== undefined && context.only !== only;
	};
