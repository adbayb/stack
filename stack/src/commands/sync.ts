import { logger } from "../helpers";
import { syncTemplate } from "../template";
import type { TemplateChange } from "../template";
import type { CommandFactory } from "../types";

type CommandContext = {
	changes: TemplateChange[];
	from: string | undefined;
};

/**
 * Merge template changes from the installed `@adbayb/stack` version into the project.
 *
 * @param program - The termost program to register the command onto.
 */
export const createSyncCommand: CommandFactory = (program) => {
	program
		.command<CommandContext>({
			name: "sync",
			description: "Merge template changes from the installed `@adbayb/stack` version",
		})
		.option({
			key: "from",
			name: "from",
			description:
				"The `@adbayb/stack` version the project was last synced with (default: the remote default branch version)",
			defaultValue: undefined,
		})
		.task({
			key: "changes",
			label: "Merge template changes 🔄",
			async handler({ from }) {
				return syncTemplate({ fromVersion: from, isDryRun: false });
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
		});
};
