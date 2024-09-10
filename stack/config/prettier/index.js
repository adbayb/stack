/* eslint-disable import/no-default-export, import/no-anonymous-default-export */
/**
 * @type {import("prettier").Config}
 */
export default {
	arrowParens: "always",
	bracketSpacing: true,
	endOfLine: "lf",
	overrides: [
		{
			files: "*.astro",
			options: {
				parser: "astro",
			},
		},
	],
	// plugins: [require.resolve("prettier-plugin-astro")],
	printWidth: 80,
	semi: true,
	singleAttributePerLine: true,
	singleQuote: false,
	trailingComma: "all",
	useTabs: true,
};
