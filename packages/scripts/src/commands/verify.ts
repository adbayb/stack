import { CommandFactory } from "../types";
import { verifyCommit, verifyLint, verifyTypes } from "../helpers";

const onlyValues = ["commit", "lint", "type"] as const;

type VerifyContext = {
	only: typeof onlyValues[number] | undefined;
};

export const createVerifyCommand: CommandFactory = (program) => {
	program
		.command<VerifyContext>({
			name: "verify",
			description: "Verify the project health",
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
			label: "Checking linter rules 🧐",
			skip({ only }) {
				return only !== "lint" && only !== undefined;
			},
			handler(_, argv) {
				return verifyLint(argv.operands);
			},
		})
		.task({
			label: "Checking types 🧐",
			skip({ only }, argv) {
				return (
					(only !== "type" && only !== undefined) ||
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
			label: "Checking commit 🧐",
			skip({ only }) {
				return only !== "commit";
			},
			handler() {
				return verifyCommit();
			},
		});
};
