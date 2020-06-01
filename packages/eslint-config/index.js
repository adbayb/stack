module.exports = {
	extends: ["eslint:recommended", "plugin:prettier/recommended"],
	plugins: ["import", "react", "react-hooks"],
	parserOptions: {
		ecmaVersion: 2020,
		sourceType: "module",
		ecmaFeatures: {
			jsx: true,
		},
	},
	settings: {
		react: {
			version: "detect",
		},
	},
	overrides: [
		{
			files: ["**/*.{ts,tsx}"],
			parser: "@typescript-eslint/parser",
			extends: [
				"plugin:@typescript-eslint/recommended",
				"prettier/@typescript-eslint",
			],
			parserOptions: {
				warnOnUnsupportedTypeScriptVersion: true,
			},
			rules: {
				"@typescript-eslint/explicit-function-return-type": "off",
				"@typescript-eslint/no-empty-interface": "off",
				"@typescript-eslint/no-non-null-assertion": "off",
				// @note: for preact h primitive
				"@typescript-eslint/no-unused-vars": [
					"error",
					{ args: "none", varsIgnorePattern: "^h$" },
				],
			},
		},
	],
	rules: {
		"dot-notation": "error",
		"import/extensions": [
			"error",
			"ignorePackages",
			{ js: "never", jsx: "never", ts: "never", tsx: "never" },
		],

		"import/no-default-export": "error",
		"import/order": [
			"error",
			{
				"newlines-between": "never",
				groups: [
					["builtin", "external"],
					"internal",
					"unknown",
					"parent",
					["sibling", "index"],
				],
			},
		],
		"lines-between-class-members": [
			"error",
			"always",
			{ exceptAfterSingleLine: true },
		],
		"no-underscore-dangle": "error",
		"no-unused-vars": [
			"error",
			{
				ignoreRestSiblings: true,
			},
		],
		"prefer-destructuring": [
			"error",
			{
				AssignmentExpression: {
					array: true,
					object: false,
				},
			},
		],
		"sort-imports": ["error", { ignoreDeclarationSort: true }],
		"react/jsx-uses-vars": "error",
	},
};
