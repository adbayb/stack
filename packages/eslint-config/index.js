module.exports = {
	extends: [
		"eslint:recommended",
		"plugin:prettier/recommended",
		"plugin:react/recommended",
		"plugin:react-hooks/recommended",
	],
	plugins: ["import"],
	parserOptions: {
		ecmaVersion: 2020,
		sourceType: "module",
		ecmaFeatures: {
			jsx: true,
		},
	},
	env: {
		browser: true,
		commonjs: true,
		es2020: true,
		jest: true,
		node: true,
		serviceworker: true,
		worker: true,
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
				"@typescript-eslint/explicit-module-boundary-types": "off",
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
		"padding-line-between-statements": [
			"error",
			{
				blankLine: "always",
				prev: [
					"block",
					"block-like",
					"class",
					"directive",
					"expression",
					"const",
					"let",
					"var",
					"import",
					"cjs-import",
					"export",
					"cjs-export",
				],
				next: "*",
			},
			{
				blankLine: "always",
				prev: "*",
				next: "return",
			},
			{
				blankLine: "never",
				prev: ["expression"],
				next: ["expression"],
			},
			{
				blankLine: "never",
				prev: ["const", "let", "var"],
				next: ["const", "let", "var"],
			},
			{
				blankLine: "always",
				prev: ["cjs-import"],
				next: ["*"],
			},
			{
				blankLine: "never",
				prev: ["case"],
				next: ["case", "default"],
			},
			{
				blankLine: "any",
				prev: ["multiline-const", "multiline-let", "multiline-var"],
				next: [
					"multiline-const",
					"multiline-let",
					"multiline-var",
					"const",
					"let",
					"var",
				],
			},
			{
				blankLine: "any",
				prev: ["export"],
				next: ["export"],
			},
			{
				blankLine: "any",
				prev: ["cjs-export"],
				next: ["cjs-export"],
			},
			{
				blankLine: "any",
				prev: ["import"],
				next: ["import", "cjs-import"],
			},
			{
				blankLine: "any",
				prev: ["cjs-import"],
				next: ["cjs-import", "import"],
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
	},
};
