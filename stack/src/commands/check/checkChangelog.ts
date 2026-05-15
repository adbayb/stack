import { helpers } from "termost";

import { createError } from "../../helpers";

export const checkChangelog = async () => {
	try {
		return await helpers.exec("changeset status --since=origin/main");
	} catch {
		throw createError(
			"changeset",
			[
				"Some packages have been changed but no changelogs were found.",
				"Run `pnpm stack release --log` to log your change(s).",
				"If the change doesn't require a changelog, you can run `pnpm stack release --empty-log`.",
			].join("\n"),
		);
	}
};
