import { resolve } from "node:path";

import globals from "globals";
import { includeIgnoreFile } from "@eslint/compat";

import { createConfig } from "../helpers.js";
import { CWD, JAVASCRIPT_FILES, JAVASCRIPT_LIKE_FILES } from "../constants.js";

export const config = createConfig(
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
	{
		/*
		 * Specific ESLint rules for javascript-only files (as they're already handled for TypeScript files by the transpiler):
		 * This rule list is taken from https://typescript-eslint.io/users/configs/#recommended
		 */
		files: JAVASCRIPT_FILES,
		rules: {
			"constructor-super": "error", // ts(2335) & ts(2377)
			"getter-return": "error", // ts(2378)
			"no-const-assign": "error", // ts(2588)
			"no-dupe-args": "error", // ts(2300)
			"no-dupe-class-members": "error", // ts(2393) & ts(2300)
			"no-dupe-keys": "error", // ts(1117)
			"no-func-assign": "error", // ts(2630)
			"no-import-assign": "error", // ts(2632) & ts(2540)
			"no-new-native-nonconstructor": "error", // ts(7009)
			"no-obj-calls": "error", // ts(2349)
			"no-redeclare": "error", // ts(2451)
			"no-setter-return": "error", // ts(2408)
			"no-this-before-super": "error", // ts(2376) & ts(17009)
			"no-undef": "error", // ts(2304) & ts(2552)
			"no-unreachable": "error", // ts(7027)
			"no-unsafe-negation": "error", // ts(2365) & ts(2322) & ts(2358)
		},
	},
	{
		// ESLint rules for JavaScript + TypeScript files:
		files: JAVASCRIPT_LIKE_FILES,
		rules: {
			"eqeqeq": "error",
			"for-direction": "error",
			"max-params": ["error", { max: 4 }],
			"no-alert": "error",
			"no-async-promise-executor": "error",
			"no-case-declarations": "error",
			"no-class-assign": "error",
			"no-compare-neg-zero": "error",
			"no-cond-assign": "error",
			"no-constant-binary-expression": "error",
			"no-constant-condition": "error",
			"no-control-regex": "error",
			"no-debugger": "error",
			"no-delete-var": "error",
			"no-dupe-else-if": "error",
			"no-duplicate-case": "error",
			"no-empty": "error",
			"no-empty-character-class": "error",
			"no-empty-pattern": "error",
			"no-empty-static-block": "error",
			"no-ex-assign": "error",
			"no-extend-native": "error",
			"no-extra-boolean-cast": "error",
			"no-fallthrough": "error",
			"no-global-assign": "error",
			"no-invalid-regexp": "error",
			"no-irregular-whitespace": "error",
			"no-lonely-if": "error",
			"no-loss-of-precision": "error",
			"no-misleading-character-class": "error",
			"no-nonoctal-decimal-escape": "error",
			"no-octal": "error",
			"no-prototype-builtins": "error",
			"no-regex-spaces": "error",
			"no-restricted-syntax": [
				"error",
				/*
				 * https://medium.com/@hbarcelos/why-i-banned-null-from-my-js-code-and-why-you-should-too-13df90323cfa
				 * https://www.youtube.com/watch?v=PSGEjv3Tqo0&t=561s
				 */
				{
					message: "Use `undefined` instead of `null`.",
					selector: "VariableDeclarator > Literal[raw='null']",
				},
				{
					message: "Use `undefined` instead of `null`.",
					selector: "AssignmentExpression > Literal[raw='null']",
				},
			],
			"no-self-assign": "error",
			"no-shadow-restricted-names": "error",
			"no-sparse-arrays": "error",
			"no-template-curly-in-string": "error",
			"no-unexpected-multiline": "error",
			"no-unsafe-finally": "error",
			"no-unsafe-optional-chaining": "error",
			"no-unused-labels": "error",
			"no-unused-private-class-members": "error",
			"no-useless-backreference": "error",
			"no-useless-call": "error",
			"no-useless-catch": "error",
			"no-useless-escape": "error",
			"no-var": "error",
			"no-with": "error",
			"object-shorthand": ["error", "always"],
			"prefer-arrow-callback": ["error", { allowNamedFunctions: true }],
			"prefer-const": "error",
			"prefer-object-spread": "error",
			"prefer-rest-params": "error",
			"prefer-spread": "error",
			"prefer-template": "error",
			"require-yield": "error",
			"sort-imports": ["error", { ignoreDeclarationSort: true }],
			"sort-vars": "error",
			"use-isnan": "error",
			"valid-typeof": "error",
		},
	},
);
