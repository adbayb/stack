import tseslint from "typescript-eslint";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

export const config = [
	{
		files: ["**/*.{js,jsx,cjs,mjs}"],
		...tseslint.configs.disableTypeChecked,
	},
	{
		// Relaxed rules for example-like folder, and [config-, story-, and test]-like files
		files: [
			"**/.config/**",
			"**/config/**",
			"**/examples/**",
			"**/scripts/**",
			"**/website/**",
			"**/config.{js,ts,cjs,cts,mjs,mts}",
			"**/*.config.{js,ts,cjs,cts,mjs,mts}",
			"**/stories.{js,ts,jsx,tsx,cjs,cts,mjs,mts}",
			"**/*.stories.{js,ts,jsx,tsx,cjs,cts,mjs,mts}",
			"**/test.{js,ts,jsx,tsx,cjs,cts,mjs,mts}",
			"**/*.test.{js,ts,jsx,tsx,cjs,cts,mjs,mts}",
		],
		rules: {
			"import-x/no-anonymous-default-export": "off",
			"import-x/no-default-export": "off",
			"sonarjs/sonar-no-magic-numbers": "off",
		},
	},
	eslintPluginPrettierRecommended,
];
