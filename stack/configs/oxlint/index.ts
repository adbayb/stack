import e18ePlugin from "@e18e/eslint-plugin";
import { configs as perfectionistPlugin } from "eslint-plugin-perfectionist";
import type { OxlintConfig } from "oxlint";
import { defineConfig } from "oxlint";

const JAVASCRIPT_EXTENSIONS = ["js", "jsx", "cjs", "mjs", "mjsx"];
const TYPESCRIPT_EXTENSIONS = ["ts", "tsx", "cts", "mts", "mtsx"];
const JAVASCRIPT_LIKE_EXTENSIONS = [...JAVASCRIPT_EXTENSIONS, ...TYPESCRIPT_EXTENSIONS];
const JAVASCRIPT_LIKE_EXTENSIONS_AS_STRING = JAVASCRIPT_LIKE_EXTENSIONS.join(",");

const TEST_LIKE_FILES = [
	`**/{test,test-d}.{${JAVASCRIPT_LIKE_EXTENSIONS_AS_STRING}}`,
	`**/*.{test,test-d}.{${JAVASCRIPT_LIKE_EXTENSIONS_AS_STRING}}`,
];

const config = defineConfig({
	categories: {
		correctness: "error",
		nursery: "error",
		pedantic: "error",
		perf: "error",
		restriction: "error",
		style: "error",
		suspicious: "error",
	},
	jsPlugins: ["@e18e/eslint-plugin", "@stylistic/eslint-plugin", "eslint-plugin-perfectionist"],
	options: {
		denyWarnings: true,
		reportUnusedDisableDirectives: "error",
		respectEslintDisableDirectives: false,
		typeAware: true,
		typeCheck: true,
	},
	overrides: [
		{
			files: TEST_LIKE_FILES,
			plugins: ["vitest"],
		},
		{
			files: [
				...TEST_LIKE_FILES,
				"**/.config/**",
				"**/.configs/**",
				"**/config/**",
				"**/configs/**",
				"**/examples/**",
				"**/scripts/**",
				"**/tools/**",
				`**/config.{${JAVASCRIPT_LIKE_EXTENSIONS_AS_STRING}}`,
				`**/configs.{${JAVASCRIPT_LIKE_EXTENSIONS_AS_STRING}}`,
				`**/*.config.{${JAVASCRIPT_LIKE_EXTENSIONS_AS_STRING}}`,
				`**/*.configs.{${JAVASCRIPT_LIKE_EXTENSIONS_AS_STRING}}`,
				`**/stories.{${JAVASCRIPT_LIKE_EXTENSIONS_AS_STRING}}`,
				`**/*.stories.{${JAVASCRIPT_LIKE_EXTENSIONS_AS_STRING}}`,
			],
			rules: {
				"import/no-anonymous-default-export": "off",
				"import/no-default-export": "off",
			},
		},
	],
	plugins: [
		"eslint",
		"import",
		"jsdoc",
		"jsx-a11y",
		"node",
		"oxc",
		"promise",
		"react",
		"react-perf",
		"typescript",
		"unicorn",
	],
	rules: {
		...e18ePlugin.configs.recommended.rules,
		...perfectionistPlugin["recommended-natural"].rules,
		"@stylistic/jsx-pascal-case": "error",
		"@stylistic/jsx-self-closing-comp": "error",
		"@stylistic/lines-between-class-members": "error",
		"@stylistic/multiline-comment-style": "error",
		"@stylistic/padding-line-between-statements": [
			"error",
			// Default: separate everything.
			{
				blankLine: "always",
				next: "*",
				prev: "*",
			},
			// Keep single-line variable declarations together
			{
				blankLine: "never",
				next: ["singleline-const", "singleline-let", "singleline-var"],
				prev: ["singleline-const", "singleline-let", "singleline-var"],
			},
			// Keep single-line exports together
			{
				blankLine: "never",
				next: ["singleline-export"],
				prev: ["singleline-export"],
			},
			{
				blankLine: "never",
				next: ["cjs-export"],
				prev: ["cjs-export"],
			},
			// Keep statements together
			{
				blankLine: "never",
				next: ["singleline-expression"],
				prev: ["singleline-expression"],
			},
			// Keep imports together.
			{
				blankLine: "never",
				next: ["import"],
				prev: ["import"],
			},
			{
				blankLine: "never",
				next: ["cjs-import"],
				prev: ["cjs-import"],
			},
			// Keep directives together
			{
				blankLine: "never",
				next: "directive",
				prev: "directive",
			},
			// Keep switch labels together
			{
				blankLine: "never",
				next: ["case", "default"],
				prev: ["case", "default"],
			},
			{
				blankLine: "never",
				next: "*",
				prev: ["case", "default"],
			},
		],
		"@stylistic/quotes": [
			"error",
			"double",
			{ allowTemplateLiterals: "avoidEscape", avoidEscape: true },
		],
		"@stylistic/spaced-comment": "error",
		"array-callback-return": ["error", { allowImplicit: true }],
		"arrow-body-style": ["error", "always"],
		"id-length": "off",
		"import/exports-last": "off",
		"import/group-exports": "off",
		"import/max-dependencies": "off",
		"import/no-dynamic-require": "off",
		"import/no-named-export": "off",
		"import/no-nodejs-modules": "off",
		"import/no-relative-parent-imports": "off",
		"import/prefer-default-export": "off",
		"jsdoc/require-param-type": "off",
		"jsdoc/require-property-type": "off",
		"jsdoc/require-returns-type": "off",
		"max-classes-per-file": "off",
		"max-lines": "off",
		"max-lines-per-function": "off",
		"max-statements": "off",
		"nextjs/google-font-display": "error",
		"nextjs/google-font-preconnect": "error",
		"nextjs/no-sync-scripts": "error",
		"nextjs/no-unwanted-polyfillio": "error",
		"no-async-await": "off",
		"no-console": "off",
		"no-continue": "off",
		"no-duplicate-imports": ["error", { allowSeparateTypeImports: true }],
		"no-inline-comments": "off",
		"no-magic-numbers": "off",
		"no-optional-chaining": "off",
		"no-rest-spread-properties": "off",
		"no-ternary": "off",
		"no-undef": "off",
		"no-undefined": "off",
		"no-use-before-define": "off",
		"no-void": "off",
		"no-warning-comments": "off",
		"node/no-sync": "off",
		"perfectionist/sort-imports": "off", // Already supported by Oxfmt
		"perfectionist/sort-named-imports": "off", // Already supported by eslint/sort-imports
		"prefer-named-capture-group": "off",
		"prefer-readonly-parameter-types": "off",
		"react/jsx-max-depth": "off",
		"sort-imports": ["error", { ignoreDeclarationSort: true }],
		"strict-boolean-expressions": "off",
		"typescript/consistent-return": "off",
		"typescript/consistent-type-definitions": ["error", "type"],
		"typescript/explicit-function-return-type": "off",
		"typescript/explicit-module-boundary-types": "off",
		"typescript/no-unsafe-type-assertion": "off",
		"unicorn/filename-case": "off",
		"unicorn/import-style": "off",
	},
});

export const createConfig = (
	input: Required<Pick<OxlintConfig, "ignorePatterns">>,
): OxlintConfig => {
	return {
		...config,
		...input,
	};
};

export default config;
