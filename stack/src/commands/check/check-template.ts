import { createError, getStackCommand } from "../../helpers";
import { migrateTemplate } from "../../template";

/** Fail when template changes from the installed `@adbayb/stack` version are not merged yet. */
export const checkTemplate = async () => {
	const changes = await migrateTemplate({ isDryRun: true });

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
