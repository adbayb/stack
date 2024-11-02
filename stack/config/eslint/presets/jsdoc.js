import jsdocPlugin from "eslint-plugin-jsdoc";

import { JAVASCRIPT_LIKE_EXTENSIONS } from "../constants.js";

export const config = [
	{
		files: JAVASCRIPT_LIKE_EXTENSIONS,
		plugins: {
			jsdoc: jsdocPlugin,
		},
		rules: {
			"jsdoc/check-access": "error",
			"jsdoc/check-alignment": "error",
			"jsdoc/check-examples": "off", // To enable once ESLint >= 8.x is supported
			"jsdoc/check-indentation": "error",
			"jsdoc/check-line-alignment": "error",
			"jsdoc/check-param-names": "error",
			"jsdoc/check-property-names": "error",
			"jsdoc/check-syntax": "error",
			"jsdoc/check-tag-names": "error",
			"jsdoc/check-types": "error",
			"jsdoc/check-values": "error",
			"jsdoc/empty-tags": "error",
			"jsdoc/implements-on-classes": "error",
			"jsdoc/multiline-blocks": "error",
			"jsdoc/no-bad-blocks": "error",
			"jsdoc/no-blank-block-descriptions": "error",
			"jsdoc/no-defaults": "error",
			"jsdoc/no-multi-asterisks": "error",
			"jsdoc/no-types": "error",
			"jsdoc/require-asterisk-prefix": "error",
			"jsdoc/require-description": "error",
			"jsdoc/require-description-complete-sentence": "error",
			"jsdoc/require-example": "error",
			"jsdoc/require-hyphen-before-param-description": "error",
			"jsdoc/require-jsdoc": [
				// To enable once the rule can be configured to require JSDoc for exported functions at package level (only at module level right now)
				"off",
				{
					contexts: [
						"TSTypeAliasDeclaration",
						"TSInterfaceDeclaration",
						"TSMethodSignature",
						"TSPropertySignature",
					],
					publicOnly: {
						ancestorsOnly: true,
						cjs: true,
						esm: true,
					},
					require: {
						ArrowFunctionExpression: true,
						ClassDeclaration: true,
						ClassExpression: true,
						FunctionDeclaration: true,
						FunctionExpression: true,
						MethodDefinition: true,
					},
				},
			],
			"jsdoc/require-param": "error",
			"jsdoc/require-param-description": "error",
			"jsdoc/require-param-name": "error",
			"jsdoc/require-property": "error",
			"jsdoc/require-property-description": "error",
			"jsdoc/require-property-name": "error",
			"jsdoc/require-returns": "error",
			"jsdoc/require-returns-check": "error",
			"jsdoc/require-returns-description": "error",
			"jsdoc/require-throws": "error",
			"jsdoc/require-yields": "error",
			"jsdoc/require-yields-check": "error",
			"jsdoc/sort-tags": "error",
			"jsdoc/tag-lines": "error",
			"jsdoc/valid-types": "error",
		},
	},
];
