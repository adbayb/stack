import type { CommandFactory } from "../types";
import {
	build,
	checkCommit,
	checkLints,
	checkTypes,
	fixFormatting,
	fixLints,
} from "../helpers";

const onlyValues = ["commit", "lint", "test", "type"] as const;

type Only = (typeof onlyValues)[number];

type CommandContext = {
	fix: boolean;
	only: Only | undefined;
};

export const createCheckCommand: CommandFactory = (program) => {
	program
		.command<CommandContext>({
			name: "check",
			description: "Check code health",
		})
		.option({
			key: "only",
			name: "only",
			description: `Run only one specified task (accepted value: ${onlyValues.join(
				", ",
			)})`,
			defaultValue: undefined,
		})
		.option({
			key: "fix",
			name: "fix",
			description: "Fix all auto-fixable lints",
			defaultValue: false,
		})
		.task({
			label: label("Preparing the project"),
			handler() {
				return build({ hasLiveOutput: false });
			},
		})
		.task({
			label(context) {
				return label(
					`Checking ${context.fix ? "and fixing" : ""} lints`,
				);
			},
			skip: ifDefinedAndNotEqualTo("lint"),
			async handler(context, argv) {
				const filenames = argv.operands;
				const lint = context.fix ? fixLints : checkLints;

				if (context.fix) {
					await fixFormatting(filenames);
				}

				return lint(filenames);
			},
		})
		.task({
			label: label("Checking types"),
			skip(context, argv) {
				return (
					ifDefinedAndNotEqualTo("type")(context) ||
					!require.resolve("typescript") ||
					// @note: for now disallow type checking with specified files
					// @see: https://github.com/microsoft/TypeScript/issues/27379
					argv.operands.length > 0
				);
			},
			handler(_, argv) {
				return checkTypes(argv.operands);
			},
		})
		.task({
			label: label("Checking commit"),
			skip({ only }) {
				return only !== "commit";
			},
			handler() {
				return checkCommit();
			},
		});
};

const label = (message: string) => `${message} 🧐`;

const ifDefinedAndNotEqualTo = (only: Only) => (context: CommandContext) => {
	return context.only !== undefined && context.only !== only;
};
