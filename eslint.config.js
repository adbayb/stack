import baseConfig from "@adbayb/stack/eslint";

export default [
	...baseConfig,
	{
		files: ["**/templates/**"],
		rules: {
			"@typescript-eslint/no-unsafe-call": "off",
			"@typescript-eslint/no-unsafe-member-access": "off",
			"sonarjs/no-implicit-dependencies": "off",
		},
	},
];
