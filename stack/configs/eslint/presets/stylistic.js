import stylistic from "@stylistic/eslint-plugin";

import { JAVASCRIPT_LIKE_EXTENSIONS } from "../constants.js";

export const config = [
	{
		files: JAVASCRIPT_LIKE_EXTENSIONS,
		plugins: {
			"@stylistic": stylistic,
		},
		rules: {
			"@stylistic/jsx-pascal-case": "error",
			"@stylistic/jsx-self-closing-comp": "error",
			"@stylistic/jsx-sort-props": "error",
			"@stylistic/lines-between-class-members": ["error", "always"],
			"@stylistic/multiline-comment-style": ["error", "starred-block"],
			"@stylistic/padding-line-between-statements": [
				"error",
				{
					blankLine: "always",
					next: "*",
					prev: "*",
				},
				{
					blankLine: "never",
					next: ["const", "let", "var"],
					prev: ["const", "let", "var"],
				},
				{
					blankLine: "never",
					next: ["case", "default"],
					prev: ["case", "default"],
				},
				{
					blankLine: "always",
					next: ["const", "let", "var"],
					prev: ["multiline-const", "multiline-let", "multiline-var"],
				},
				{
					blankLine: "always",
					next: ["multiline-const", "multiline-let", "multiline-var"],
					prev: ["const", "let", "var"],
				},
				{
					blankLine: "any",
					next: ["expression"],
					prev: ["expression"],
				},
				{
					blankLine: "any",
					next: ["const", "let", "var"],
					prev: ["cjs-import"],
				},
				{
					blankLine: "any",
					next: ["cjs-import", "import"],
					prev: ["cjs-import", "import"],
				},
				{
					blankLine: "any",
					next: ["cjs-export", "export"],
					prev: ["cjs-export", "export"],
				},
			],
			"@stylistic/quotes": [
				"error",
				"double",
				{ allowTemplateLiterals: false, avoidEscape: true },
			],
			"@stylistic/spaced-comment": [
				"error",
				"always",
				{ block: { balanced: true } },
			],
		},
	},
];
