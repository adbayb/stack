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
	categories: {
		correctness: "error",
		perf: "error",
		suspicious: "error",
	},
	options: {
		denyWarnings: true,
		reportUnusedDisableDirectives: "error",
		respectEslintDisableDirectives: false,
		typeAware: true,
		typeCheck: true,
	},
});
