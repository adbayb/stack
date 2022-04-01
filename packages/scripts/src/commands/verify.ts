import { CommandFactory } from "../types";
import {
	fixFormatting,
	fixLints,
	verifyCommit,
	verifyLints,
	verifyTests,
	verifyTypes,
} from "../helpers";

const onlyValues = ["commit", "lint", "test", "type"] as const;

type Only = typeof onlyValues[number];

type VerifyContext = {
	fix: boolean;
	only: Only | undefined;
};

export const createVerifyCommand: CommandFactory = (program) => {
	program
		.command<VerifyContext>({
			name: "verify",
			description: "Verify source code health",
		})
		.option({
			key: "only",
			name: "only",
			description: `Run a specific check (accepted value: ${onlyValues.join(
				", "
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
			label(context) {
				return `Checking ${context.fix ? "and fixing" : ""} lints 🧐`;
			},
			skip: ifDefinedAndNotEqualTo("lint"),
			async handler(context, argv) {
				const filenames = argv.operands;
				const lint = context.fix ? fixLints : verifyLints;

				if (context.fix) {
					await fixFormatting(filenames);
				}

				return lint(filenames);
			},
		})
		.task({
			label: "Checking types 🧐",
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
				return verifyTypes(argv.operands);
			},
		})
		.task({
			label: "Checking tests 🧐",
			skip: ifDefinedAndNotEqualTo("test"),
			handler(_, argv) {
				return verifyTests(argv.operands);
			},
		})
		.task({
			label: "Checking commit 🧐",
			skip({ only }) {
				return only !== "commit";
			},
			handler() {
				return verifyCommit();
			},
		});
};

const ifDefinedAndNotEqualTo = (only: Only) => (context: VerifyContext) => {
	return context.only !== undefined && context.only !== only;
};
