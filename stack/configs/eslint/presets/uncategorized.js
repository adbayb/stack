import sortKeysCustomOrderPlugin from "eslint-plugin-sort-keys-custom-order";
import dependPlugin from "eslint-plugin-depend";
import { FlatCompat } from "@eslint/eslintrc";

import { JAVASCRIPT_LIKE_EXTENSIONS } from "../constants.js";

export const config = [
	{
		files: JAVASCRIPT_LIKE_EXTENSIONS,
		plugins: {
			"depend": dependPlugin,
			"sort-keys-custom-order": sortKeysCustomOrderPlugin,
		},
		rules: {
			"depend/ban-dependencies": "error",
			"sort-keys-custom-order/object-keys": [
				"error",
				{
					orderedKeys: ["id", "key", "name", "title", "label", "description"],
				},
			],
			"sort-keys-custom-order/type-keys": [
				"error",
				{
					orderedKeys: ["id", "key", "name", "title", "label", "description"],
				},
			],
		},
	},
	...new FlatCompat().extends("plugin:mdx/recommended").map((mdxConfig) => ({
		...mdxConfig,
		files: ["**/*.{md,mdx}"],
		settings: {
			"mdx/code-blocks": true,
		},
	})),
];
