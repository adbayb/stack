import sortKeysCustomOrderPlugin from "eslint-plugin-sort-keys-custom-order";
import dependPlugin from "eslint-plugin-depend";

import { createConfig } from "../helpers.js";
import { JAVASCRIPT_LIKE_FILES } from "../constants.js";

export const config = createConfig({
	files: JAVASCRIPT_LIKE_FILES,
	plugins: {
		"depend": dependPlugin,
		"sort-keys-custom-order": sortKeysCustomOrderPlugin,
	},
	rules: {
		"depend/ban-dependencies": "error",
		"sort-keys-custom-order/object-keys": [
			"error",
			{
				orderedKeys: [
					"id",
					"key",
					"name",
					"title",
					"label",
					"description",
				],
			},
		],
		"sort-keys-custom-order/type-keys": [
			"error",
			{
				orderedKeys: [
					"id",
					"key",
					"name",
					"title",
					"label",
					"description",
				],
			},
		],
	},
});
