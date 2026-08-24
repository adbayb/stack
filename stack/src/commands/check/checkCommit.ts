import { exec } from "termost";
import { createError } from "../../helpers";

export const checkCommit = async () => {
	try {
		return await exec('commitlint --extends "@commitlint/config-conventional" --edit');
	} catch (error) {
		throw createError("commitlint", error instanceof Error ? error : new Error(String(error)));
	}
};
