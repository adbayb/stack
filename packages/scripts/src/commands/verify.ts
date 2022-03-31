import { CommandFactory } from "../types";
import {
	verifyCommit,
	verifyLints,
	verifyTests,
	verifyTypes,
} from "../helpers";

const onlyValues = ["commit", "lint", "test", "type"] as const;

type Only = typeof onlyValues[number];

type VerifyContext = {
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
		.task({
			label: "Checking lints 🧐",
			skip: ifDefinedAndNotEqualTo("lint"),
			handler(_, argv) {
				return verifyLints(argv.operands);
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
