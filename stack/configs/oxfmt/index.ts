import type { OxfmtConfig } from "oxfmt";
import { defineConfig } from "oxfmt";

const config = defineConfig({
	arrowParens: "always",
	bracketSameLine: false,
	bracketSpacing: true,
	embeddedLanguageFormatting: "auto",
	endOfLine: "lf",
	htmlWhitespaceSensitivity: "css",
	ignorePatterns: [],
	insertFinalNewline: true,
	jsdoc: true,
	jsxSingleQuote: false,
	objectWrap: "preserve",
	printWidth: 100,
	proseWrap: "preserve",
	quoteProps: "consistent",
	semi: true,
	singleAttributePerLine: true,
	singleQuote: false,
	sortImports: {
		newlinesBetween: false,
	},
	sortPackageJson: true,
	tabWidth: 4,
	trailingComma: "all",
	useTabs: true,
	vueIndentScriptAndStyle: false,
});

export const createConfig = (input: Required<Pick<OxfmtConfig, "overrides">>): OxfmtConfig => {
	return {
		...config,
		...input,
	};
};

export default config;
