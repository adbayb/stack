import { exec } from "termost";
import { getStackCommand, logger, toShellArgument } from "../helpers";
import { bumpStack, updateTemplate } from "../template";
import type { TemplateChange } from "../template";
import type { CommandFactory } from "../types";

type CommandContext = {
	changes: TemplateChange[];
	from: string | undefined;
	previousVersion: string | undefined;
};

/**
 * Bump `@adbayb/stack` to its latest version and merge its template changes into the project.
 *
 * @param program - The termost program to register the command onto.
 */
export const createUpdateCommand: CommandFactory = (program) => {
	program
		.command<CommandContext>({
			name: "update",
			description: "Bump `@adbayb/stack` to latest and merge its template changes",
		})
		.option({
			key: "from",
			name: "from",
			description:
				"The `@adbayb/stack` version the project was last updated with (default: the version before the bump, otherwise the remote default branch version)",
			defaultValue: undefined,
		})
		.task({
			key: "previousVersion",
			label: label("Bump `@adbayb/stack`"),
			async handler() {
				return bumpStack();
			},
		})
		.task({
			label: label("Merge template changes with the bumped version"),
			async handler({ from, previousVersion = "" }) {
				// The running binary still holds the previous template: hand over to the bumped one.
				await exec(
					getStackCommand(`update --from ${toShellArgument(from ?? previousVersion)}`),
					{ hasLiveOutput: true },
				);
			},
			skip({ previousVersion }) {
				return previousVersion === undefined;
			},
		})
		.task({
			key: "changes",
			label: label("Merge template changes"),
			async handler({ from }) {
				return updateTemplate({ fromVersion: from, isDryRun: false });
			},
			skip({ previousVersion }) {
				return previousVersion !== undefined;
			},
		})
		.task({
			handler({ changes }) {
				if (changes.length === 0) {
					logger.success("The project is up to date with its template.");

					return;
				}

				logger.info(
					`Updated files:\n   ${changes
						.map(({ content, hasConflict, path }) => {
							return `${path}${content === undefined ? " (removed)" : ""}${hasConflict ? " (conflict)" : ""}`;
						})
						.join("\n   ")}`,
				);

				if (
					changes.some(({ hasConflict }) => {
						return hasConflict;
					})
				) {
					logger.warn(
						"Resolve the conflict markers, keeping local edits where they are intentional.",
					);
				}
			},
			skip({ previousVersion }) {
				return previousVersion !== undefined;
			},
		});
};

const label = (message: string) => {
	return `${message} ⬆️`;
};
