import type { CommandFactory } from "../types";
import {
	checkCommit,
	checkLints,
	checkTypes,
	hasDependency,
	turbo,
} from "../helpers";

const onlyValues = ["commit", "lint", "type"] as const;

type Only = (typeof onlyValues)[number];

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
			description: `Run only one specified task (accepted value: ${onlyValues.join(
				", ",
			)})`,
			defaultValue: undefined,
		})
		.task({
			label: label("Preparing the project"),
			async handler() {
				await turbo("build", { hasLiveOutput: false });
			},
			skip({ only }) {
				return only === "commit"; // No need to build if only commitlint is run
			},
		})
		.task({
			label: label("Checking linters"),
			async handler(_, argv) {
				const filenames = argv.operands;

				await checkLints(filenames);
			},
			skip: ifOnlyDefinedAndNotEqualTo("lint"),
		})
		.task({
			label: label("Checking types"),
			async handler() {
				await checkTypes();
			},
			skip(context, argv) {
				return (
					ifOnlyDefinedAndNotEqualTo("type")(context) ||
					!hasDependency("typescript") ||
					// For now, skip type-checking if some files are passed down
					// @see: https://github.com/microsoft/TypeScript/issues/27379
					argv.operands.length > 0
				);
			},
		})
		.task({
			label: label("Checking commit"),
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
