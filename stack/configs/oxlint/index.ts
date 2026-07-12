import { defineConfig } from "oxlint";

export default defineConfig({
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
		"vitest",
	],
	// TODO: add jsPlugins for perfectionist and padding-line-between-statements + add React rules (such as set-state-in-effect) from React X https://github.com/oxc-project/oxc/issues/1022
	categories: {
		correctness: "error",
		pedantic: "error",
		perf: "error",
		suspicious: "error",
		nursery: "error",
	},
	rules: {
		"no-undef": "off",
		"prefer-readonly-parameter-types": "off",
		"strict-boolean-expressions": "off",
		"max-lines": "off",
		"max-lines-per-function": "off",
		"max-classes-per-file": "off",
		"import/max-dependencies": "off",
		"react/jsx-max-depth": "off",
		"jsdoc/require-param-type": "off",
		"jsdoc/require-property-type": "off",
		"jsdoc/require-returns-type": "off",
		"no-warning-comments": "off",
		"array-callback-return": ["error", { allowImplicit: true }],
		"typescript/consistent-return": "off",
		"typescript/no-unsafe-type-assertion": "off",
		// TODO: disable typescript/no-unsafe-type-assertion and check previous code to reinsert as assertion
	},
	options: {
		denyWarnings: true,
		reportUnusedDisableDirectives: "error",
		respectEslintDisableDirectives: false,
		typeAware: true,
		typeCheck: true,
	},
});
