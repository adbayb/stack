import { resolve } from "node:path";

import globals from "globals";
import { includeIgnoreFile } from "@eslint/compat";

import { CWD } from "../constants.js";

export const config = [
	{
		languageOptions: {
			ecmaVersion: "latest",
			globals: {
				...globals.browser,
				...globals.node,
				...globals.worker,
			},
			parserOptions: {
				ecmaFeatures: {
					jsx: true,
				},
			},
			sourceType: "module",
		},
	},
	includeIgnoreFile(resolve(CWD, ".gitignore")),
];
