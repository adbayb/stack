/* eslint-disable import/no-anonymous-default-export */
import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import parser from "astro-eslint-parser";
import deprecation from "eslint-plugin-deprecation";
import _import from "eslint-plugin-import";
import jestFormatting from "eslint-plugin-jest-formatting";
import jsdoc from "eslint-plugin-jsdoc";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import sonarjs from "eslint-plugin-sonarjs";
import sortKeysCustomOrder from "eslint-plugin-sort-keys-custom-order";
import vitest from "eslint-plugin-vitest";
import globals from "globals";
import path, { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
	allConfig: js.configs.all,
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
});

export default [
	...compat.extends(
		"eslint:recommended",
		"plugin:prettier/recommended",
		"plugin:astro/recommended",
	),
	{
		languageOptions: {
			ecmaVersion: 2020,
			globals: {
				...globals.browser,
				...globals.commonjs,
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
		plugins: {
			import: fixupPluginRules(_import),
			jsdoc,
			react,
			"react-hooks": fixupPluginRules(reactHooks),
			sonarjs,
			"sort-keys-custom-order": sortKeysCustomOrder,
		},

		rules: {
			"import/default": "error",
			"import/export": "error",
			"import/first": "error",
			"import/named": "error",
			"import/namespace": "error",
			"import/newline-after-import": "error",
			"import/no-absolute-path": "error",
			"import/no-amd": "error",
			"import/no-anonymous-default-export": "error",
			"import/no-commonjs": "error",
			"import/no-cycle": "error",
			"import/no-default-export": "error",
			"import/no-deprecated": "error",
			"import/no-duplicates": "error",
			"import/no-empty-named-blocks": "error",
			"import/no-extraneous-dependencies": "error",
			"import/no-import-module-exports": "error",
			"import/no-mutable-exports": "error",
			"import/no-named-as-default": "error",
			"import/no-named-as-default-member": "error",
			"import/no-namespace": "error",
			"import/no-relative-packages": "error",
			"import/no-self-import": "error",
			"import/no-unassigned-import": "error",

			"import/no-unresolved": [
				"error",
				{
					commonjs: true,
				},
			],

			"import/no-unused-modules": "error",

			"import/no-useless-path-segments": [
				"error",
				{
					commonjs: true,
					noUselessIndex: true,
				},
			],

			"import/no-webpack-loader-syntax": "error",

			"import/order": [
				"error",
				{
					alphabetize: {
						caseInsensitive: false,
						order: "asc",
						orderImportKind: "desc",
					},

					groups: [
						["builtin", "external"],
						"internal",
						"unknown",
						"parent",
						["sibling", "index"],
					],

					"newlines-between": "always",
				},
			],
			"jsdoc/check-access": "error",
			"jsdoc/check-alignment": "error",
			"jsdoc/check-examples": "off",
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
				"off",
				{
					contexts: [
						"TSTypeAliasDeclaration",
						"TSInterfaceDeclaration",
						"TSMethodSignature",
						"TSPropertySignature",
					],

					publicOnly: true,

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
			"no-alert": "error",
			"no-return-await": "error",
			"no-var": "error",
			"object-shorthand": ["error", "always"],

			"padding-line-between-statements": [
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

			"prefer-arrow-callback": [
				"error",
				{
					allowNamedFunctions: true,
				},
			],

			"prefer-const": "error",
			"prefer-template": "error",
			"react-hooks/exhaustive-deps": "warn",
			"react-hooks/rules-of-hooks": "error",

			"react/display-name": "error",
			"react/jsx-boolean-value": "error",
			"react/jsx-fragments": "error",
			"react/jsx-key": "error",
			"react/jsx-no-useless-fragment": "warn",
			"react/jsx-pascal-case": "error",
			"react/jsx-sort-props": "error",
			"react/jsx-uses-react": "error",
			"react/jsx-uses-vars": "error",
			"react/no-children-prop": "error",
			"react/no-danger": "error",
			"react/no-deprecated": "error",
			"react/no-direct-mutation-state": "error",
			"react/no-is-mounted": "error",
			"react/no-render-return-value": "error",
			"react/no-string-refs": "error",
			"react/no-unescaped-entities": "error",
			"react/prefer-stateless-function": "error",
			"react/self-closing-comp": "error",
			"sonarjs/cognitive-complexity": "error",
			"sonarjs/elseif-without-else": "error",
			"sonarjs/max-switch-cases": "error",
			"sonarjs/no-all-duplicated-branches": "error",
			"sonarjs/no-collapsible-if": "error",
			"sonarjs/no-collection-size-mischeck": "error",

			"sonarjs/no-duplicate-string": [
				"error",
				{
					threshold: 5,
				},
			],

			"sonarjs/no-duplicated-branches": "error",
			"sonarjs/no-element-overwrite": "error",
			"sonarjs/no-extra-arguments": "error",
			"sonarjs/no-gratuitous-expressions": "error",
			"sonarjs/no-identical-conditions": "error",
			"sonarjs/no-identical-expressions": "error",
			"sonarjs/no-identical-functions": "error",
			"sonarjs/no-inverted-boolean-check": "error",
			"sonarjs/no-one-iteration-loop": "error",
			"sonarjs/no-redundant-boolean": "error",
			"sonarjs/no-redundant-jump": "error",
			"sonarjs/no-same-line-conditional": "error",
			"sonarjs/no-small-switch": "error",
			"sonarjs/no-unused-collection": "error",
			"sonarjs/no-use-of-empty-return-value": "error",
			"sonarjs/no-useless-catch": "error",
			"sonarjs/non-existent-operator": "error",
			"sonarjs/prefer-immediate-return": "error",
			"sonarjs/prefer-object-literal": "error",
			"sonarjs/prefer-single-boolean-return": "error",
			"sonarjs/prefer-while": "error",

			"sort-imports": [
				"error",
				{
					ignoreDeclarationSort: true,
				},
			],

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

			"sort-vars": "error",
		},

		settings: {
			"import/resolver": {
				node: true,
				typescript: true,
			},

			react: {
				version: "detect",
			},
		},
	},
	...fixupConfigRules(
		compat.extends(
			"plugin:@typescript-eslint/eslint-recommended",
			"plugin:import/typescript",
		),
	).map((config) => ({
		...config,
		files: ["**/*.ts?(x)"],
	})),
	{
		files: ["**/*.ts?(x)"],

		languageOptions: {
			ecmaVersion: 5,
			parser: tsParser,

			parserOptions: {
				project: ["./tsconfig.json"],
				tsconfigRootDir: process.cwd(),
			},
			sourceType: "script",
		},

		plugins: {
			"@typescript-eslint": fixupPluginRules(typescriptEslint),
			// deprecation,
		},

		rules: {
			"@typescript-eslint/adjacent-overload-signatures": "error",

			"@typescript-eslint/array-type": [
				"error",
				{
					default: "array",
					readonly: "array",
				},
			],

			"@typescript-eslint/await-thenable": "error",

			"@typescript-eslint/ban-ts-comment": [
				"error",
				{
					minimumDescriptionLength: 3,
					"ts-check": false,
					"ts-expect-error": "allow-with-description",
					"ts-ignore": "allow-with-description",
					"ts-nocheck": "allow-with-description",
				},
			],

			"@typescript-eslint/class-literal-property-style": [
				"error",
				"fields",
			],
			"@typescript-eslint/class-methods-use-this": "error",
			"@typescript-eslint/consistent-generic-constructors": [
				"error",
				"constructor",
			],
			"@typescript-eslint/consistent-indexed-object-style": [
				"error",
				"record",
			],

			"@typescript-eslint/consistent-type-assertions": [
				"error",
				{
					assertionStyle: "as",
					objectLiteralTypeAssertions: "allow-as-parameter",
				},
			],

			"@typescript-eslint/consistent-type-definitions": ["error", "type"],

			"@typescript-eslint/consistent-type-exports": [
				"error",
				{
					fixMixedExportsWithInlineTypeSpecifier: false,
				},
			],

			"@typescript-eslint/consistent-type-imports": [
				"error",
				{
					disallowTypeAnnotations: true,
					fixStyle: "separate-type-imports",
					prefer: "type-imports",
				},
			],
			"@typescript-eslint/default-param-last": "error",
			"@typescript-eslint/dot-notation": "error",

			"@typescript-eslint/explicit-member-accessibility": [
				"error",
				{
					accessibility: "explicit",
				},
			],

			"@typescript-eslint/method-signature-style": ["error", "property"],
			"@typescript-eslint/no-array-constructor": "error",
			"@typescript-eslint/no-base-to-string": "error",
			"@typescript-eslint/no-confusing-non-null-assertion": "error",
			"@typescript-eslint/no-confusing-void-expression": "error",
			"@typescript-eslint/no-dupe-class-members": "error",
			"@typescript-eslint/no-duplicate-enum-values": "error",
			"@typescript-eslint/no-duplicate-type-constituents": "error",
			"@typescript-eslint/no-dynamic-delete": "error",
			"@typescript-eslint/no-empty-function": "error",
			"@typescript-eslint/no-empty-interface": "error",
			"@typescript-eslint/no-empty-object-type": "error",

			"@typescript-eslint/no-explicit-any": [
				"error",
				{
					fixToUnknown: true,
					ignoreRestArgs: false,
				},
			],

			"@typescript-eslint/no-extra-non-null-assertion": "error",
			"@typescript-eslint/no-extraneous-class": "error",
			"@typescript-eslint/no-floating-promises": "error",
			"@typescript-eslint/no-for-in-array": "error",
			"@typescript-eslint/no-implied-eval": "error",
			"@typescript-eslint/no-import-type-side-effects": "error",
			"@typescript-eslint/no-inferrable-types": "error",
			"@typescript-eslint/no-invalid-this": "error",
			"@typescript-eslint/no-invalid-void-type": "error",
			"@typescript-eslint/no-loop-func": "error",
			"@typescript-eslint/no-loss-of-precision": "error",
			"@typescript-eslint/no-meaningless-void-operator": "error",
			"@typescript-eslint/no-misused-new": "error",
			"@typescript-eslint/no-misused-promises": "error",
			"@typescript-eslint/no-mixed-enums": "error",
			"@typescript-eslint/no-namespace": "error",
			"@typescript-eslint/no-non-null-asserted-nullish-coalescing":
				"error",
			"@typescript-eslint/no-non-null-asserted-optional-chain": "error",
			"@typescript-eslint/no-non-null-assertion": "error",
			"@typescript-eslint/no-redeclare": "error",
			"@typescript-eslint/no-shadow": "error",
			"@typescript-eslint/no-this-alias": "error",
			"@typescript-eslint/no-unnecessary-boolean-literal-compare":
				"error",
			"@typescript-eslint/no-unnecessary-condition": "error",
			"@typescript-eslint/no-unnecessary-qualifier": "error",
			"@typescript-eslint/no-unnecessary-type-arguments": "error",
			"@typescript-eslint/no-unnecessary-type-assertion": "error",
			"@typescript-eslint/no-unnecessary-type-constraint": "error",
			"@typescript-eslint/no-unsafe-argument": "error",
			"@typescript-eslint/no-unsafe-assignment": "error",
			"@typescript-eslint/no-unsafe-call": "error",
			"@typescript-eslint/no-unsafe-declaration-merging": "error",
			"@typescript-eslint/no-unsafe-enum-comparison": "error",
			"@typescript-eslint/no-unsafe-function-type": "error",
			"@typescript-eslint/no-unsafe-member-access": "error",
			"@typescript-eslint/no-unsafe-return": "error",
			"@typescript-eslint/no-unused-expressions": "error",

			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					ignoreRestSiblings: true,
				},
			],
			"@typescript-eslint/no-useless-constructor": "error",
			"@typescript-eslint/no-useless-empty-export": "error",
			"@typescript-eslint/no-var-requires": "error",
			"@typescript-eslint/no-wrapper-object-types": "error",
			"@typescript-eslint/only-throw-error": "error",
			"@typescript-eslint/prefer-as-const": "error",
			"@typescript-eslint/prefer-for-of": "error",
			"@typescript-eslint/prefer-function-type": "error",
			"@typescript-eslint/prefer-includes": "error",
			"@typescript-eslint/prefer-literal-enum-member": "error",
			"@typescript-eslint/prefer-namespace-keyword": "error",
			"@typescript-eslint/prefer-nullish-coalescing": "error",
			"@typescript-eslint/prefer-optional-chain": "error",
			"@typescript-eslint/prefer-readonly": "error",
			"@typescript-eslint/prefer-regexp-exec": "error",
			"@typescript-eslint/prefer-return-this-type": "error",
			"@typescript-eslint/prefer-string-starts-ends-with": "error",
			"@typescript-eslint/prefer-ts-expect-error": "error",
			"@typescript-eslint/promise-function-async": "error",
			"@typescript-eslint/require-await": "error",
			"@typescript-eslint/restrict-plus-operands": "error",
			"@typescript-eslint/restrict-template-expressions": "error",
			"@typescript-eslint/return-await": "error",
			"@typescript-eslint/sort-type-constituents": "error",
			"@typescript-eslint/switch-exhaustiveness-check": "error",
			"@typescript-eslint/triple-slash-reference": "error",
			"@typescript-eslint/unbound-method": "error",
			"@typescript-eslint/unified-signatures": "error",
			"class-methods-use-this": "off",
			"default-param-last": "off",
			"dot-notation": "off",
			// "deprecation/deprecation": "error",
			"import/consistent-type-specifier-style": [
				"error",
				"prefer-top-level",
			],
			"no-array-constructor": "off",
			"no-dupe-class-members": "off",
			"no-empty-function": "off",
			"no-implied-eval": "off",
			"no-invalid-this": "off",
			"no-loop-func": "off",
			"no-loss-of-precision": "off",
			"no-redeclare": "off",
			"no-return-await": "off",
			"no-shadow": "off",
			"no-throw-literal": "off",
			"no-unused-expressions": "off",
			"no-unused-vars": "off",

			"no-useless-constructor": "off",
			"require-await": "off",
		},
	},
	{
		files: ["**/*.test.?(c|m)[jt]s?(x)"],

		plugins: {
			"jest-formatting": jestFormatting,
			vitest,
		},

		rules: {
			"jest-formatting/padding-around-all": "error",

			"vitest/consistent-test-it": [
				"error",
				{
					fn: "test",
					withinDescribe: "test",
				},
			],

			"vitest/expect-expect": "error",

			"vitest/max-nested-describe": [
				"error",
				{
					max: 1,
				},
			],

			"vitest/no-alias-methods": "error",
			"vitest/no-commented-out-tests": "error",
			"vitest/no-conditional-expect": "error",
			"vitest/no-conditional-in-test": "error",
			"vitest/no-conditional-tests": "error",
			"vitest/no-disabled-tests": "error",
			"vitest/no-done-callback": "error",
			"vitest/no-duplicate-hooks": "error",
			"vitest/no-focused-tests": "error",
			"vitest/no-identical-title": "error",
			"vitest/no-import-node-test": "error",
			"vitest/no-mocks-import": "error",
			"vitest/no-standalone-expect": "error",
			"vitest/no-test-return-statement": "error",
			"vitest/prefer-called-with": "error",
			"vitest/prefer-comparison-matcher": "error",
			"vitest/prefer-each": "error",
			"vitest/prefer-equality-matcher": "error",
			"vitest/prefer-hooks-in-order": "error",
			"vitest/prefer-hooks-on-top": "error",
			"vitest/prefer-lowercase-title": "error",
			"vitest/prefer-mock-promise-shorthand": "error",
			"vitest/prefer-strict-equal": "error",
			"vitest/prefer-to-be": "error",
			"vitest/prefer-to-be-object": "error",
			"vitest/prefer-to-contain": "error",
			"vitest/prefer-to-have-length": "error",
			"vitest/prefer-todo": "error",
			"vitest/require-hook": "error",
			"vitest/require-local-test-context-for-concurrent-snapshots":
				"error",
			"vitest/require-to-throw-message": "error",
			"vitest/require-top-level-describe": "error",
			"vitest/valid-describe-callback": "error",
			"vitest/valid-expect": "error",

			"vitest/valid-title": [
				"error",
				{
					mustMatch: {
						test: ["^should "],
					},
				},
			],
		},
	},
	{
		files: [
			"examples/**",
			"website/**",
			"**/*.config.ts",
			"**/?(*.)stories.ts?(x)",
			"**/test.ts?(x)",
			"scripts/**",
		],

		rules: {
			"import/no-default-export": "off",
			"sonarjs/no-duplicate-string": "off",
		},
	},
	{
		files: ["**/*.astro"],

		languageOptions: {
			ecmaVersion: 5,
			parser,

			parserOptions: {
				extraFileExtensions: [".astro"],
				parser: "@typescript-eslint/parser",
			},
			sourceType: "script",
		},
	},
	{
		files: ["**/*.c[j|t]s"],

		rules: {
			"import/no-commonjs": "off",
		},
	},
	...compat.extends("plugin:mdx/recommended").map((config) => ({
		...config,
		files: ["**/*.md?(x)"],
	})),
	{
		files: ["**/*.md?(x)"],

		settings: {
			"mdx/code-blocks": "off",
		},
	},
];
