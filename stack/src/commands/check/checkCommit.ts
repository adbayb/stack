import { helpers } from "termost";
import { createError } from "../../helpers";

export const checkCommit = async () => {
	try {
		return await helpers.exec('commitlint --extends "@commitlint/config-conventional" --edit');
	} catch (error) {
		throw createError("commitlint", error instanceof Error ? error : new Error(String(error)));
	}
};
