module.exports = {
	root: true,
	env: {
		browser: true,
		commonjs: true,
		es6: true,
		jest: true,
		node: true,
	},
	parserOptions: {
		ecmaVersion: 2018,
		sourceType: "module",
		ecmaFeatures: {
			jsx: true,
		},
	},
	settings: {
		"import/resolver": {
			node: {
				extensions: [".js", ".jsx", ".ts", ".tsx"],
			},
		},
		react: {
			version: "detect",
		},
	},
	extends: ["eslint:recommended", "plugin:prettier/recommended"],
	plugins: ["import", "react", "react-hooks", "sonarjs"],
	overrides: [
		{
			files: ["**/*.ts?(x)"],
			parser: "@typescript-eslint/parser",
			extends: [
				// @note: following line disables recommended eslint rules already checked by TS:
				"plugin:@typescript-eslint/eslint-recommended",
			],
			plugins: ["@typescript-eslint"],
			rules: {
				"@typescript-eslint/adjacent-overload-signatures": "error",
				"@typescript-eslint/ban-ts-comment": "error",
				"@typescript-eslint/ban-types": "error",
				"no-array-constructor": "off",
				"@typescript-eslint/no-array-constructor": "error",
				"@typescript-eslint/no-empty-interface": "error",
				"@typescript-eslint/no-explicit-any": "warn",
				"@typescript-eslint/no-extra-non-null-assertion": "error",
				"no-extra-semi": "off",
				"@typescript-eslint/no-extra-semi": "error",
				"@typescript-eslint/no-inferrable-types": "error",
				"@typescript-eslint/no-misused-new": "error",
				"@typescript-eslint/no-namespace": "error",
				"@typescript-eslint/no-non-null-asserted-optional-chain":
					"error",
				"@typescript-eslint/no-non-null-assertion": "warn",
				"@typescript-eslint/no-this-alias": "error",
				"no-unused-vars": "off",
				"@typescript-eslint/no-unused-vars": [
					"error",
					{ ignoreRestSiblings: true },
				],
				"@typescript-eslint/no-var-requires": "error",
				"@typescript-eslint/prefer-as-const": "error",
				"@typescript-eslint/prefer-namespace-keyword": "error",
				"@typescript-eslint/triple-slash-reference": "error",
			},
		},
		{
			files: ["**/stories.[jt]s?(x)"],
			rules: {
				"no-alert": "off",
				"react/display-name": "off",
			},
		},
	],
	rules: {
		// #region eslint
		"no-alert": "error",
		"no-var": "error",
		"object-shorthand": ["error", "always"],
		"padding-line-between-statements": [
			"error",
			{
				blankLine: "always",
				prev: "*",
				next: "*",
			},
			{
				blankLine: "always",
				prev: "*",
				next: ["cjs-export", "export"],
			},
			{
				blankLine: "always",
				prev: ["cjs-export", "export"],
				next: "*",
			},
			{
				blankLine: "never",
				prev: ["const", "let", "var"],
				next: ["const", "let", "var"],
			},
			{
				blankLine: "never",
				prev: ["case", "default"],
				next: ["case", "default"],
			},
			{
				blankLine: "any",
				prev: ["expression"],
				next: ["expression"],
			},
			{
				blankLine: "any",
				prev: ["multiline-const", "multiline-let", "multiline-var"],
				next: ["const", "let", "var"],
			},
			{
				blankLine: "any",
				prev: ["const", "let", "var"],
				next: ["multiline-const", "multiline-let", "multiline-var"],
			},
			{
				blankLine: "any",
				prev: ["cjs-import"],
				next: ["const", "let", "var"],
			},
			{
				blankLine: "any",
				prev: ["cjs-import", "import"],
				next: ["cjs-import", "import"],
			},
			{
				blankLine: "any",
				prev: ["cjs-export", "export"],
				next: ["cjs-export", "export"],
			},
		],
		"prefer-const": "error",
		"sort-imports": ["error", { ignoreDeclarationSort: true }],
		// #endregion
		// #region import
		"import/export": "error",
		"import/default": "error",
		"import/first": "error",
		"import/named": "error",
		"import/namespace": "error",
		"import/newline-after-import": "error",
		"import/no-absolute-path": "error",
		"import/no-amd": "error",
		"import/no-cycle": "error",
		"import/no-default-export": "error",
		"import/no-duplicates": "error",
		"import/no-mutable-exports": "error",
		"import/no-named-as-default": "error",
		"import/no-named-as-default-member": "error",
		"import/no-self-import": "error",
		"import/no-useless-path-segments": [
			"error",
			{
				noUselessIndex: true,
				commonjs: true,
			},
		],
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
		// #endregion
		// #region react
		"react/display-name": "error",
		"react/jsx-boolean-value": "error",
		"react/jsx-fragments": "error",
		"react/jsx-key": "error",
		"react/jsx-no-useless-fragment": "warn",
		"react/jsx-pascal-case": "error",
		"react/jsx-uses-react": "error",
		"react/jsx-uses-vars": "error",
		"react/no-children-prop": "error",
		"react/no-danger": "error",
		"react/no-deprecated": "error",
		"react/no-direct-mutation-state": "error",
		"react/no-is-mounted": "error",
		"react/no-render-return-value": "error",
		"react/no-string-refs": "error",
		"react/no-unescaped-entities": "error",
		"react/prefer-stateless-function": "error",
		// #endregion react
		// #region react-hooks
		"react-hooks/rules-of-hooks": "error",
		"react-hooks/exhaustive-deps": "warn",
		// #endregion react-hooks
		// #region sonarjs
		"sonarjs/cognitive-complexity": "error",
		"sonarjs/max-switch-cases": "error",
		"sonarjs/no-all-duplicated-branches": "error",
		"sonarjs/no-collapsible-if": "error",
		"sonarjs/no-collection-size-mischeck": "error",
		"sonarjs/no-duplicate-string": "warn",
		"sonarjs/no-duplicated-branches": "error",
		"sonarjs/no-element-overwrite": "error",
		"sonarjs/no-extra-arguments": "error",
		"sonarjs/no-identical-conditions": "error",
		"sonarjs/no-identical-functions": "error",
		"sonarjs/no-identical-expressions": "error",
		"sonarjs/no-inverted-boolean-check": "error",
		"sonarjs/no-one-iteration-loop": "error",
		"sonarjs/no-redundant-boolean": "error",
		"sonarjs/no-same-line-conditional": "error",
		"sonarjs/no-small-switch": "error",
		"sonarjs/no-unused-collection": "error",
		"sonarjs/no-use-of-empty-return-value": "error",
		"sonarjs/no-useless-catch": "error",
		"sonarjs/prefer-immediate-return": "error",
		"sonarjs/prefer-object-literal": "error",
		"sonarjs/prefer-single-boolean-return": "error",
		"sonarjs/prefer-while": "error",
		// #endregion
	},
};
