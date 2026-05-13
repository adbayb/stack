import { helpers } from "termost";

import { createError } from "../../helpers";

export const checkChangelog = async () => {
	try {
		return await helpers.exec("changeset status --since=origin/main");
	} catch (error) {
		throw createError("changeset", error as Error);
	}
};
