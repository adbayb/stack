import { helpers } from "termost";

import { createError } from "../../helpers";

export const checkTypes = async () => {
	try {
		return await helpers.exec("pnpm --parallel exec tsc --noEmit");
	} catch (error) {
		throw createError("tsc", error as Error);
	}
};