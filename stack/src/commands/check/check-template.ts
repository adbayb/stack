import { createError, getStackCommand, logger } from "../../helpers";
import { TemplateSourceError, getPendingTemplateChanges } from "../../template";

/**
 * Fail when template changes from the installed `@adbayb/stack` version are not merged yet. Warn
 * and skip when the template sources cannot be reached (offline, no `origin` remote).
 */
export const checkTemplate = async () => {
	let changes: Awaited<ReturnType<typeof getPendingTemplateChanges>>;

	try {
		changes = await getPendingTemplateChanges();
	} catch (error) {
		if (error instanceof TemplateSourceError) {
			logger.warn(
				`Template compliance skipped: its sources cannot be reached.\n${error.message}`,
			);

			return;
		}

		throw error;
	}

	if (changes.length > 0) {
		throw createError(
			"stack check",
			`Template changes are pending in:\n   ${changes
				.map(({ path }) => {
					return path;
				})
				.join("\n   ")}\nRun \`${getStackCommand("migrate")}\` and review the result.`,
		);
	}
};
