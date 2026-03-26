import dependPlugin from "eslint-plugin-depend";

import { JAVASCRIPT_LIKE_FILES } from "../constants.js";
import { createConfig } from "../helpers.js";

export const config = createConfig({
	files: JAVASCRIPT_LIKE_FILES,
	plugins: {
		depend: dependPlugin,
	},
	rules: {
		"depend/ban-dependencies": "error",
	},
});
