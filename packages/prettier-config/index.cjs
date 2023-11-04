/**
 * @type {import("prettier").Config}
 */
module.exports = {
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
	plugins: [require.resolve("prettier-plugin-astro")],
	printWidth: 80,
	semi: true,
	singleAttributePerLine: true,
	singleQuote: false,
	trailingComma: "all",
	useTabs: true,
};
