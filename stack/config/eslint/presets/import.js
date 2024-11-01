import importPlugin from "eslint-plugin-import-x";

import { JAVASCRIPT_LIKE_FILES } from "../constants.js";

export const config = [
	importPlugin.flatConfigs.typescript,
	{
		files: JAVASCRIPT_LIKE_FILES,
		plugins: {
			"import-x": importPlugin,
		},
		rules: {
			"import-x/consistent-type-specifier-style": ["error", "prefer-top-level"],
			"import-x/export": "error",
			"import-x/first": "error",
			"import-x/newline-after-import": "error",
			"import-x/no-absolute-path": "error",
			"import-x/no-amd": "error",
			"import-x/no-anonymous-default-export": "error",
			"import-x/no-commonjs": "error",
			"import-x/no-cycle": "error",
			"import-x/no-default-export": "error",
			"import-x/no-deprecated": "error",
			"import-x/no-duplicates": "error",
			"import-x/no-empty-named-blocks": "error",
			"import-x/no-extraneous-dependencies": "error",
			"import-x/no-import-module-exports": "error",
			"import-x/no-mutable-exports": "error",
			"import-x/no-named-default": "error",
			"import-x/no-namespace": "error",
			"import-x/no-relative-packages": "error",
			"import-x/no-self-import": "error",
			"import-x/no-unassigned-import": "error",
			"import-x/no-unused-modules": "error",
			"import-x/no-useless-path-segments": [
				"error",
				{
					commonjs: true,
					noUselessIndex: true,
				},
			],
			"import-x/no-webpack-loader-syntax": "error",
			"import-x/order": [
				"error",
				{
					"alphabetize": {
						caseInsensitive: false,
						order: "desc",
						orderImportKind: "desc",
					},
					"groups": [
						"builtin",
						"external",
						"internal",
						["parent", "sibling", "index"],
						"object",
						"unknown",
					],
					"newlines-between": "always",
				},
			],
			"import-x/unambiguous": "error",
		},
		settings: {
			"import-x/resolver": {
				node: true,
				typescript: true,
			},
		},
	},
];
