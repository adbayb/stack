import { defineConfig } from "oxlint";

const JAVASCRIPT_EXTENSIONS = ["js", "jsx", "cjs", "mjs", "mjsx"];
const TYPESCRIPT_EXTENSIONS = ["ts", "tsx", "cts", "mts", "mtsx"];
const JAVASCRIPT_LIKE_EXTENSIONS = [...JAVASCRIPT_EXTENSIONS, ...TYPESCRIPT_EXTENSIONS];
const JAVASCRIPT_LIKE_EXTENSIONS_AS_STRING = JAVASCRIPT_LIKE_EXTENSIONS.join(",");

const TEST_LIKE_FILES = [
	`**/{test,test-d}.{${JAVASCRIPT_LIKE_EXTENSIONS_AS_STRING}}`,
	`**/*.{test,test-d}.{${JAVASCRIPT_LIKE_EXTENSIONS_AS_STRING}}`,
];

const RELAXED_LIKE_FILES = [
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
];

export default defineConfig({
	categories: {
		correctness: "error",
		nursery: "error",
		pedantic: "error",
		perf: "error",
		restriction: "error",
		style: "error",
		suspicious: "error",
	},
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
				...RELAXED_LIKE_FILES,
				`*.config(s)?.{${JAVASCRIPT_LIKE_EXTENSIONS_AS_STRING}}`,
			],
			rules: {
				"import/no-anonymous-default-export": "off",
				"import/no-default-export": "off",
			},
		},
	],
	// TODO: add jsPlugins for perfectionist and padding-line-between-statements + add React rules (such as set-state-in-effect) from React X https://github.com/oxc-project/oxc/issues/1022 + potentially https://github.com/es-tooling/eslint-plugin-depend/blob/main/docs/rules/ban-dependencies.md
	plugins: [
		// TODO: check perfectionist sorting here
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
		"no-continue": "off",
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
