/* eslint-disable sort-keys-custom-order/object-keys */
import { includeIgnoreFile } from "@eslint/compat";
import { FlatCompat } from "@eslint/eslintrc";
import vitestPlugin from "@vitest/eslint-plugin";
import importPlugin from "eslint-plugin-import";
import jestFormattingPlugin from "eslint-plugin-jest-formatting";
import jsdocPlugin from "eslint-plugin-jsdoc";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import sonarjsPlugin from "eslint-plugin-sonarjs";
import sortKeysCustomOrderPlugin from "eslint-plugin-sort-keys-custom-order";
import globals from "globals";
import { resolve } from "node:path";
import { cwd } from "node:process";
import tseslint from "typescript-eslint";

const CWD = cwd();

export default tseslint.config(
	{
		languageOptions: {
			ecmaVersion: "latest",
			globals: {
				...globals.browser,
				...globals.node,
				...globals.worker,
			},
			parserOptions: {
				ecmaFeatures: {
					jsx: true,
				},
			},
			sourceType: "module",
		},
	},
	includeIgnoreFile(resolve(CWD, ".gitignore")),
	importPlugin.flatConfigs.typescript,
	{
		files: ["**/*.{js,ts,jsx,tsx,cjs,cts,mjs,mts}"],
		plugins: {
			import: importPlugin,
			jsdoc: jsdocPlugin,
			sonarjs: sonarjsPlugin,
			"sort-keys-custom-order": sortKeysCustomOrderPlugin,
		},
		settings: {
			"import/resolver": {
				node: true,
				typescript: true,
			},
		},
		rules: {
			//#region eslint
			"constructor-super": "error",
			"for-direction": "error",
			"getter-return": "error",
			"no-alert": "error",
			"no-async-promise-executor": "error",
			"no-case-declarations": "error",
			"no-class-assign": "error",
			"no-compare-neg-zero": "error",
			"no-cond-assign": "error",
			"no-const-assign": "error",
			"no-constant-binary-expression": "error",
			"no-constant-condition": "error",
			"no-control-regex": "error",
			"no-debugger": "error",
			"no-delete-var": "error",
			"no-dupe-args": "error",
			"no-dupe-class-members": "error",
			"no-dupe-else-if": "error",
			"no-dupe-keys": "error",
			"no-duplicate-case": "error",
			"no-empty": "error",
			"no-empty-character-class": "error",
			"no-empty-pattern": "error",
			"no-empty-static-block": "error",
			"no-ex-assign": "error",
			"no-extra-boolean-cast": "error",
			"no-fallthrough": "error",
			"no-func-assign": "error",
			"no-global-assign": "error",
			"no-import-assign": "error",
			"no-invalid-regexp": "error",
			"no-irregular-whitespace": "error",
			"no-loss-of-precision": "error",
			"no-misleading-character-class": "error",
			"no-new-native-nonconstructor": "error",
			"no-nonoctal-decimal-escape": "error",
			"no-obj-calls": "error",
			"no-octal": "error",
			"no-prototype-builtins": "error",
			"no-redeclare": "error",
			"no-regex-spaces": "error",
			"no-return-await": "error",
			"no-self-assign": "error",
			"no-setter-return": "error",
			"no-shadow-restricted-names": "error",
			"no-sparse-arrays": "error",
			"no-this-before-super": "error",
			"no-undef": "error",
			"no-unexpected-multiline": "error",
			"no-unreachable": "error",
			"no-unsafe-finally": "error",
			"no-unsafe-negation": "error",
			"no-unsafe-optional-chaining": "error",
			"no-unused-labels": "error",
			"no-unused-private-class-members": "error",
			"no-unused-vars": "error",
			"no-useless-backreference": "error",
			"no-useless-catch": "error",
			"no-useless-escape": "error",
			"no-var": "error",
			"no-with": "error",
			"object-shorthand": ["error", "always"],
			"padding-line-between-statements": [
				"error",
				{
					blankLine: "always",
					next: "*",
					prev: "*",
				},
				{
					blankLine: "never",
					next: ["const", "let", "var"],
					prev: ["const", "let", "var"],
				},
				{
					blankLine: "never",
					next: ["case", "default"],
					prev: ["case", "default"],
				},
				{
					blankLine: "always",
					next: ["const", "let", "var"],
					prev: ["multiline-const", "multiline-let", "multiline-var"],
				},
				{
					blankLine: "always",
					next: ["multiline-const", "multiline-let", "multiline-var"],
					prev: ["const", "let", "var"],
				},
				{
					blankLine: "any",
					next: ["expression"],
					prev: ["expression"],
				},
				{
					blankLine: "any",
					next: ["const", "let", "var"],
					prev: ["cjs-import"],
				},
				{
					blankLine: "any",
					next: ["cjs-import", "import"],
					prev: ["cjs-import", "import"],
				},
				{
					blankLine: "any",
					next: ["cjs-export", "export"],
					prev: ["cjs-export", "export"],
				},
			],
			"prefer-arrow-callback": ["error", { allowNamedFunctions: true }],
			"prefer-const": "error",
			"prefer-template": "error",
			"require-yield": "error",
			//#endregion
			//#region import
			"import/consistent-type-specifier-style": [
				"error",
				"prefer-top-level",
			],
			"import/export": "error",
			"import/first": "error",
			"import/newline-after-import": "error",
			"import/no-absolute-path": "error",
			"import/no-amd": "error",
			"import/no-commonjs": "error",
			"import/no-cycle": "error",
			"import/no-default-export": "error",
			"import/no-deprecated": "error",
			"import/no-duplicates": "error",
			"import/no-empty-named-blocks": "error",
			"import/no-extraneous-dependencies": "error",
			"import/no-import-module-exports": "error",
			"import/no-mutable-exports": "error",
			"import/no-named-as-default": "error",
			"import/no-namespace": "error",
			"import/no-relative-packages": "error",
			"import/no-self-import": "error",
			"import/no-unassigned-import": "error",
			"import/no-unused-modules": "error",
			"import/no-useless-path-segments": [
				"error",
				{
					commonjs: true,
					noUselessIndex: true,
				},
			],
			"import/no-webpack-loader-syntax": "error",
			"import/order": [
				"error",
				{
					alphabetize: {
						caseInsensitive: false,
						order: "asc",
						orderImportKind: "desc",
					},
					groups: [
						["builtin", "external"],
						"internal",
						"unknown",
						"parent",
						["sibling", "index"],
					],
					"newlines-between": "always",
				},
			],
			//#endregion
			//#region jsdoc
			"jsdoc/check-access": "error",
			"jsdoc/check-alignment": "error",
			"jsdoc/check-examples": "off", // To enable once ESLint >= 8.x is supported
			"jsdoc/check-indentation": "error",
			"jsdoc/check-line-alignment": "error",
			"jsdoc/check-param-names": "error",
			"jsdoc/check-property-names": "error",
			"jsdoc/check-syntax": "error",
			"jsdoc/check-tag-names": "error",
			"jsdoc/check-types": "error",
			"jsdoc/check-values": "error",
			"jsdoc/empty-tags": "error",
			"jsdoc/implements-on-classes": "error",
			"jsdoc/multiline-blocks": "error",
			"jsdoc/no-bad-blocks": "error",
			"jsdoc/no-blank-block-descriptions": "error",
			"jsdoc/no-defaults": "error",
			"jsdoc/no-multi-asterisks": "error",
			"jsdoc/no-types": "error",
			"jsdoc/require-asterisk-prefix": "error",
			"jsdoc/require-description": "error",
			"jsdoc/require-description-complete-sentence": "error",
			"jsdoc/require-example": "error",
			"jsdoc/require-hyphen-before-param-description": "error",
			"jsdoc/require-jsdoc": [
				// To enable once the rule can be configured to require JSDoc for exported functions at package level (only at module level right now)
				"off",
				{
					contexts: [
						"TSTypeAliasDeclaration",
						"TSInterfaceDeclaration",
						"TSMethodSignature",
						"TSPropertySignature",
					],
					publicOnly: true,
					require: {
						ArrowFunctionExpression: true,
						ClassDeclaration: true,
						ClassExpression: true,
						FunctionDeclaration: true,
						FunctionExpression: true,
						MethodDefinition: true,
					},
				},
			],
			"jsdoc/require-param": "error",
			"jsdoc/require-param-description": "error",
			"jsdoc/require-param-name": "error",
			"jsdoc/require-property": "error",
			"jsdoc/require-property-description": "error",
			"jsdoc/require-property-name": "error",
			"jsdoc/require-returns": "error",
			"jsdoc/require-returns-check": "error",
			"jsdoc/require-returns-description": "error",
			"jsdoc/require-throws": "error",
			"jsdoc/require-yields": "error",
			"jsdoc/require-yields-check": "error",
			"jsdoc/sort-tags": "error",
			"jsdoc/tag-lines": "error",
			"jsdoc/valid-types": "error",
			//#endregion
			//#region sonarjs
			"sonarjs/anchor-precedence": "error",
			"sonarjs/argument-type": "error",
			"sonarjs/arguments-order": "error",
			"sonarjs/array-callback-without-return": "error",
			"sort-imports": ["error", { ignoreDeclarationSort: true }],
			"sort-vars": "error",
			"sonarjs/assertions-in-tests": "error",
			"use-isnan": "error",
			"valid-typeof": "error",
			"sonarjs/aws-apigateway-public-api": "error",
			"sonarjs/aws-ec2-rds-dms-public": "error",
			"sonarjs/aws-ec2-unencrypted-ebs-volume": "error",
			"sonarjs/aws-efs-unencrypted": "error",
			"sonarjs/aws-iam-all-privileges": "error",
			"sonarjs/aws-iam-privilege-escalation": "error",
			"sonarjs/aws-iam-public-access": "error",
			"sonarjs/aws-opensearchservice-domain": "error",
			"sonarjs/aws-rds-unencrypted-databases": "error",
			"sonarjs/aws-restricted-ip-admin-access": "error",
			"sonarjs/aws-s3-bucket-granted-access": "error",
			"sonarjs/aws-s3-bucket-insecure-http": "error",
			"sonarjs/aws-s3-bucket-public-access": "error",
			"sonarjs/aws-s3-bucket-versioning": "error",
			"sonarjs/aws-sagemaker-unencrypted-notebook": "error",
			"sonarjs/aws-sns-unencrypted-topics": "error",
			"sonarjs/aws-sqs-unencrypted-queue": "error",
			"sonarjs/bitwise-operators": "error",
			"sonarjs/call-argument-line": "error",
			"sonarjs/certificate-transparency": "error",
			"sonarjs/chai-determinate-assertion": "error",
			"sonarjs/class-name": "error",
			"sonarjs/code-eval": "error",
			"sonarjs/cognitive-complexity": ["error", 15],
			"sonarjs/comma-or-logical-or-case": "error",
			"sonarjs/concise-regex": "error",
			"sonarjs/confidential-information-logging": "error",
			"sonarjs/constructor-for-side-effects": "error",
			"sonarjs/content-length": "error",
			"sonarjs/content-security-policy": "error",
			"sonarjs/cookie-no-httponly": "error",
			"sonarjs/cors": "error",
			"sonarjs/csrf": "error",
			"sonarjs/deprecation": "error",
			"sonarjs/different-types-comparison": "error",
			"sonarjs/disabled-auto-escaping": "error",
			"sonarjs/disabled-resource-integrity": "error",
			"sonarjs/disabled-timeout": "error",
			"sonarjs/duplicates-in-character-class": "error",
			"sonarjs/empty-string-repetition": "error",
			"sonarjs/encryption-secure-mode": "error",
			"sonarjs/existing-groups": "error",
			"sonarjs/file-permissions": "error",
			"sonarjs/file-uploads": "error",
			"sonarjs/fixme-tag": "error",
			"sonarjs/for-loop-increment-sign": "error",
			"sonarjs/frame-ancestors": "error",
			"sonarjs/function-inside-loop": "error",
			"sonarjs/function-return-type": "error",
			"sonarjs/future-reserved-words": "error",
			"sonarjs/generator-without-yield": "error",
			"sonarjs/hashing": "error",
			"sonarjs/hidden-files": "error",
			"sonarjs/hook-use-state": "error",
			"sonarjs/in-operator-type-error": "error",
			"sonarjs/inconsistent-function-call": "error",
			"sonarjs/index-of-compare-to-positive-number": "error",
			"sonarjs/insecure-cookie": "error",
			"sonarjs/insecure-jwt-token": "error",
			"sonarjs/inverted-assertion-arguments": "error",
			"sonarjs/jsx-key": "error",
			"sonarjs/jsx-no-constructed-context-values": "error",
			"sonarjs/label-position": "error",
			"sonarjs/link-with-target-blank": "error",
			"sonarjs/max-switch-cases": "error",
			"sonarjs/misplaced-loop-counter": "error",
			"sonarjs/mouse-events-a11y": "error",
			"sonarjs/new-operator-misuse": "error",
			"sonarjs/no-all-duplicated-branches": "error",
			"sonarjs/no-alphabetical-sort": "error",
			"sonarjs/no-angular-bypass-sanitization": "error",
			"sonarjs/no-array-delete": "error",
			"sonarjs/no-array-index-key": "error",
			"sonarjs/no-associative-arrays": "error",
			"sonarjs/no-async-constructor": "error",
			"sonarjs/no-case-label-in-switch": "error",
			"sonarjs/no-clear-text-protocols": "error",
			"sonarjs/no-code-after-done": "error",
			"sonarjs/no-collection-size-mischeck": "error",
			"sonarjs/no-commented-code": "error",
			"sonarjs/no-dead-store": "error",
			"sonarjs/no-delete-var": "error",
			"sonarjs/no-deprecated-react": "error",
			"sonarjs/no-duplicate-in-composite": "error",
			"sonarjs/no-duplicated-branches": "error",
			"sonarjs/no-element-overwrite": "error",
			"sonarjs/no-empty-after-reluctant": "error",
			"sonarjs/no-empty-alternatives": "error",
			"sonarjs/no-empty-collection": "error",
			"sonarjs/no-empty-group": "error",
			"sonarjs/no-empty-test-file": "error",
			"sonarjs/no-equals-in-for-termination": "error",
			"sonarjs/no-exclusive-tests": "error",
			"sonarjs/no-extra-arguments": "error",
			"sonarjs/no-global-this": "error",
			"sonarjs/no-globals-shadowing": "error",
			"sonarjs/no-gratuitous-expressions": "error",
			"sonarjs/no-hardcoded-credentials": "error",
			"sonarjs/no-hardcoded-ip": "error",
			"sonarjs/no-hook-setter-in-body": "error",
			"sonarjs/no-identical-conditions": "error",
			"sonarjs/no-identical-expressions": "error",
			"sonarjs/no-identical-functions": "error",
			"sonarjs/no-ignored-exceptions": "error",
			"sonarjs/no-ignored-return": "error",
			"sonarjs/no-implicit-global": "error",
			"sonarjs/no-in-misuse": "error",
			"sonarjs/no-incomplete-assertions": "error",
			"sonarjs/no-internal-api-use": "error",
			"sonarjs/no-intrusive-permissions": "error",
			"sonarjs/no-invalid-await": "error",
			"sonarjs/no-invariant-returns": "error",
			"sonarjs/no-inverted-boolean-check": "error",
			"sonarjs/no-ip-forward": "error",
			"sonarjs/no-labels": "error",
			"sonarjs/no-literal-call": "error",
			"sonarjs/no-mime-sniff": "error",
			"sonarjs/no-misleading-array-reverse": "error",
			"sonarjs/no-mixed-content": "error",
			"sonarjs/no-nested-assignment": "error",
			"sonarjs/no-nested-conditional": "error",
			"sonarjs/no-nested-functions": "error",
			"sonarjs/no-nested-template-literals": "error",
			"sonarjs/no-one-iteration-loop": "error",
			"sonarjs/no-os-command-from-path": "error",
			"sonarjs/no-parameter-reassignment": "error",
			"sonarjs/no-primitive-wrappers": "error",
			"sonarjs/no-redundant-assignments": "error",
			"sonarjs/no-redundant-boolean": "error",
			"sonarjs/no-redundant-jump": "error",
			"sonarjs/no-redundant-optional": "error",
			"sonarjs/no-referrer-policy": "error",
			"sonarjs/no-same-argument-assert": "error",
			"sonarjs/no-same-line-conditional": "error",
			"sonarjs/no-selector-parameter": "error",
			"sonarjs/no-skipped-test": "error",
			"sonarjs/no-small-switch": "error",
			"sonarjs/no-table-as-layout": "error",
			"sonarjs/no-try-promise": "error",
			"sonarjs/no-undefined-argument": "error",
			"sonarjs/no-unenclosed-multiline-block": "error",
			"sonarjs/no-uniq-key": "error",
			"sonarjs/no-unsafe": "error",
			"sonarjs/no-unsafe-unzip": "error",
			"sonarjs/no-unstable-nested-components": "error",
			"sonarjs/no-unthrown-error": "error",
			"sonarjs/no-unused-collection": "error",
			"sonarjs/no-use-of-empty-return-value": "error",
			"sonarjs/no-useless-catch": "error",
			"sonarjs/no-useless-increment": "error",
			"sonarjs/no-useless-intersection": "error",
			"sonarjs/no-useless-react-setstate": "error",
			"sonarjs/no-vue-bypass-sanitization": "error",
			"sonarjs/no-weak-cipher": "error",
			"sonarjs/no-weak-keys": "error",
			"sonarjs/non-existent-operator": "error",
			"sonarjs/null-dereference": "error",
			"sonarjs/object-alt-content": "error",
			"sonarjs/os-command": "error",
			"sonarjs/post-message": "error",
			"sonarjs/prefer-default-last": "error",
			"sonarjs/prefer-promise-shorthand": "error",
			"sonarjs/prefer-single-boolean-return": "error",
			"sonarjs/prefer-type-guard": "error",
			"sonarjs/prefer-while": "error",
			"sonarjs/production-debug": "error",
			"sonarjs/pseudo-random": "error",
			"sonarjs/public-static-readonly": "error",
			"sonarjs/publicly-writable-directories": "error",
			"sonarjs/reduce-initial-value": "error",
			"sonarjs/redundant-type-aliases": "error",
			"sonarjs/regex-complexity": "error",
			"sonarjs/session-regeneration": "error",
			"sonarjs/single-char-in-character-classes": "error",
			"sonarjs/single-character-alternation": "error",
			"sonarjs/sonar-block-scoped-var": "error",
			"sonarjs/sonar-jsx-no-leaked-render": "error",
			"sonarjs/sonar-no-control-regex": "error",
			"sonarjs/sonar-no-empty-character-class": "error",
			"sonarjs/sonar-no-fallthrough": "error",
			"sonarjs/sonar-no-invalid-regexp": "error",
			"sonarjs/sonar-no-misleading-character-class": "error",
			"sonarjs/sonar-no-regex-spaces": "error",
			"sonarjs/sonar-no-unused-class-component-methods": "error",
			"sonarjs/sonar-no-unused-vars": "error",
			"sonarjs/sonar-prefer-optional-chain": "error",
			"sonarjs/sonar-prefer-read-only-props": "error",
			"sonarjs/sonar-prefer-regexp-exec": "error",
			"sonarjs/sql-queries": "error",
			"sonarjs/stable-tests": "error",
			"sonarjs/stateful-regex": "error",
			"sonarjs/strict-transport-security": "error",
			"sonarjs/super-invocation": "error",
			"sonarjs/table-header": "error",
			"sonarjs/table-header-reference": "error",
			"sonarjs/test-check-exception": "error",
			"sonarjs/todo-tag": "error",
			"sonarjs/unused-import": "error",
			"sonarjs/sonar-max-params": "error",
			"sonarjs/unused-named-groups": "error",
			"sonarjs/unverified-certificate": "error",
			"sonarjs/alt-text": "error",
			"sonarjs/unverified-hostname": "error",
			"sonarjs/updated-const-var": "error",
			"sonarjs/no-empty-function": "error",
			"sonarjs/updated-loop-counter": "error",
			"sonarjs/use-type-alias": "error",
			"sonarjs/default-param-last": "error",
			"sonarjs/void-use": "error",
			"sonarjs/weak-ssl": "error",
			"sonarjs/new-cap": "error",
			"sonarjs/x-powered-by": "error",
			"sonarjs/xml-parser-xxe": "error",
			"sonarjs/no-infinite-loop": "error",
			"sonarjs/no-unused-private-class-members": "error",
			"sonarjs/media-has-caption": "error",
			"sonarjs/no-unreachable": "error",
			"sonarjs/no-accessor-field-mismatch": "error",
			"sonarjs/sonar-no-dupe-keys": "error",
			"sonarjs/no-redeclare": "error",
			"sonarjs/html-has-lang": "error",
			"sonarjs/no-throw-literal": "error",
			"sonarjs/no-var": "error",
			"sonarjs/no-base-to-string": "error",
			"sonarjs/use-isnan": "error",
			"sonarjs/no-misused-promises": "error",
			"sonarjs/no-redundant-type-constituents": "error",
			"sonarjs/prefer-enum-initializers": "error",
			"sonarjs/prefer-for-of": "error",
			"sonarjs/no-extend-native": "error",
			"sonarjs/prefer-function-type": "error",
			"sonarjs/no-useless-constructor": "error",
			"sonarjs/no-lonely-if": "error",
			"sonarjs/prefer-namespace-keyword": "error",
			"sonarjs/no-useless-call": "error",
			"sonarjs/jsx-no-useless-fragment": "error",
			"sonarjs/unnecessary-character-escapes": "error",
			"sonarjs/prefer-nullish-coalescing": "error",
			"sonarjs/anchor-has-content": "error",
			"sonarjs/prefer-string-starts-ends-with": "error",
			"sonarjs/no-self-compare": "error",
			"sonarjs/anchor-is-valid": "error",
			"sonarjs/no-find-dom-node": "error",
			"sonarjs/prefer-object-spread": "error",
			"sonarjs/label-has-associated-control": "error",
			"sonarjs/no-self-import": "error",
			"sonarjs/prefer-spread": "error",
			"sonarjs/no-unknown-property": "error",
			"sonarjs/no-unused-expressions": "error",
			"sonarjs/rules-of-hooks": "error",
			//#endregion
			//#region sort-keys-custom-order
			"sort-keys-custom-order/object-keys": [
				"error",
				{
					orderedKeys: [
						"id",
						"key",
						"name",
						"title",
						"label",
						"description",
					],
				},
			],
			"sort-keys-custom-order/type-keys": [
				"error",
				{
					orderedKeys: [
						"id",
						"key",
						"name",
						"title",
						"label",
						"description",
					],
				},
			],
			//#endregion
		},
	},
	{
		files: ["**/*.{jsx,tsx}"],
		plugins: {
			react: reactPlugin,
			"react-hooks": reactHooksPlugin,
		},
		settings: {
			react: {
				version: "detect",
			},
		},
		rules: {
			"react/display-name": "error",
			"react/jsx-boolean-value": "error",
			"react/jsx-fragments": "error",
			"react/jsx-key": "error",
			"react/jsx-no-useless-fragment": "warn",
			"react/jsx-pascal-case": "error",
			"react/jsx-sort-props": "error",
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
			"react/self-closing-comp": "error",
			"react-hooks/rules-of-hooks": "error",
			"react-hooks/exhaustive-deps": "warn",
		},
	},
	{
		files: [
			"**/test.{js,ts,jsx,tsx,cjs,cts,mjs,mts}",
			"**/*.test.{js,ts,jsx,tsx,cjs,cts,mjs,mts}",
		],
		plugins: {
			"jest-formatting": jestFormattingPlugin,
			vitest: vitestPlugin,
		},
		rules: {
			"jest-formatting/padding-around-all": "error",
			"vitest/consistent-test-it": [
				"error",
				{ fn: "test", withinDescribe: "test" },
			],
			"vitest/expect-expect": "error",
			"vitest/max-nested-describe": ["error", { max: 1 }],
			"vitest/no-alias-methods": "error",
			"vitest/no-commented-out-tests": "error",
			"vitest/no-conditional-expect": "error",
			"vitest/no-conditional-in-test": "error",
			"vitest/no-conditional-tests": "error",
			"vitest/no-disabled-tests": "error",
			"vitest/no-done-callback": "error",
			"vitest/no-duplicate-hooks": "error",
			"vitest/no-focused-tests": "error",
			"vitest/no-identical-title": "error",
			"vitest/no-import-node-test": "error",
			"vitest/no-mocks-import": "error",
			"vitest/no-standalone-expect": "error",
			"vitest/no-test-return-statement": "error",
			"vitest/prefer-called-with": "error",
			"vitest/prefer-comparison-matcher": "error",
			"vitest/prefer-each": "error",
			"vitest/prefer-equality-matcher": "error",
			"vitest/prefer-hooks-in-order": "error",
			"vitest/prefer-hooks-on-top": "error",
			"vitest/prefer-lowercase-title": "error",
			"vitest/prefer-mock-promise-shorthand": "error",
			"vitest/prefer-strict-equal": "error",
			"vitest/prefer-to-be": "error",
			"vitest/prefer-to-be-object": "error",
			"vitest/prefer-to-contain": "error",
			"vitest/prefer-to-have-length": "error",
			"vitest/prefer-todo": "error",
			"vitest/require-hook": "error",
			"vitest/require-local-test-context-for-concurrent-snapshots":
				"error",
			"vitest/require-to-throw-message": "error",
			"vitest/require-top-level-describe": "error",
			"vitest/valid-describe-callback": "error",
			"vitest/valid-expect": "error",
			"vitest/valid-title": [
				"error",
				{ mustMatch: { test: ["^should "] } },
			],
		},
	},
	{
		files: ["**/*.{ts,tsx,cts,mts}"],
		languageOptions: {
			parser: tseslint.parser,
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
		plugins: {
			"@typescript-eslint": tseslint.plugin,
		},
		rules: {
			"@typescript-eslint/adjacent-overload-signatures": "error",
			// https://www.totaltypescript.com/array-types-in-typescript
			"@typescript-eslint/array-type": [
				"error",
				{ default: "array", readonly: "array" },
			],
			"@typescript-eslint/await-thenable": "error",
			"@typescript-eslint/ban-ts-comment": [
				"error",
				{
					minimumDescriptionLength: 3,
					"ts-check": false,
					"ts-expect-error": "allow-with-description",
					"ts-ignore": "allow-with-description",
					"ts-nocheck": "allow-with-description",
				},
			],
			"@typescript-eslint/class-literal-property-style": [
				"error",
				"fields",
			],
			"@typescript-eslint/consistent-generic-constructors": [
				"error",
				"constructor",
			],
			"@typescript-eslint/consistent-indexed-object-style": [
				"error",
				"record",
			],
			"@typescript-eslint/consistent-type-assertions": [
				"error",
				{
					assertionStyle: "as",
					objectLiteralTypeAssertions: "allow-as-parameter",
				},
			],
			// https://www.totaltypescript.com/type-vs-interface-which-should-you-use
			"@typescript-eslint/consistent-type-definitions": ["error", "type"],
			"@typescript-eslint/consistent-type-exports": [
				"error",
				{ fixMixedExportsWithInlineTypeSpecifier: false },
			],
			"@typescript-eslint/consistent-type-imports": [
				"error",
				{
					disallowTypeAnnotations: true,
					fixStyle: "separate-type-imports",
					prefer: "type-imports",
				},
			],
			"@typescript-eslint/explicit-member-accessibility": [
				"error",
				{ accessibility: "explicit" },
			],
			"@typescript-eslint/method-signature-style": ["error", "property"],
			"@typescript-eslint/no-base-to-string": "error",
			"@typescript-eslint/no-confusing-non-null-assertion": "error",
			"@typescript-eslint/no-confusing-void-expression": "error",
			"@typescript-eslint/no-duplicate-enum-values": "error",
			"@typescript-eslint/no-duplicate-type-constituents": "error",
			"@typescript-eslint/no-dynamic-delete": "error",
			"@typescript-eslint/no-empty-interface": "error",
			"@typescript-eslint/no-explicit-any": [
				"error",
				{ fixToUnknown: true, ignoreRestArgs: false },
			],
			"@typescript-eslint/no-extra-non-null-assertion": "error",
			"@typescript-eslint/no-extraneous-class": "error",
			"@typescript-eslint/no-floating-promises": "error",
			"@typescript-eslint/no-for-in-array": "error",
			"@typescript-eslint/no-import-type-side-effects": "error",
			"@typescript-eslint/no-inferrable-types": "error",
			"@typescript-eslint/no-invalid-void-type": "error",
			"@typescript-eslint/no-meaningless-void-operator": "error",
			"@typescript-eslint/no-misused-new": "error",
			"@typescript-eslint/no-misused-promises": "error",
			"@typescript-eslint/no-mixed-enums": "error",
			"@typescript-eslint/no-namespace": "error",
			"@typescript-eslint/no-non-null-asserted-nullish-coalescing":
				"error",
			"@typescript-eslint/no-non-null-asserted-optional-chain": "error",
			"@typescript-eslint/no-non-null-assertion": "error",
			"@typescript-eslint/no-require-imports": "error",
			"@typescript-eslint/no-this-alias": "error",
			"@typescript-eslint/no-unnecessary-boolean-literal-compare":
				"error",
			"@typescript-eslint/no-unnecessary-condition": "error",
			"@typescript-eslint/no-unnecessary-qualifier": "error",
			"@typescript-eslint/no-unnecessary-type-arguments": "error",
			"@typescript-eslint/no-unnecessary-type-assertion": "error",
			"@typescript-eslint/no-unnecessary-type-constraint": "error",
			"@typescript-eslint/no-unsafe-argument": "error",
			"@typescript-eslint/no-unsafe-assignment": "error",
			"@typescript-eslint/no-unsafe-call": "error",
			"@typescript-eslint/no-unsafe-declaration-merging": "error",
			"@typescript-eslint/no-unsafe-enum-comparison": "error",
			"@typescript-eslint/no-unsafe-function-type": "error",
			"@typescript-eslint/no-unsafe-member-access": "error",
			"@typescript-eslint/no-unsafe-return": "error",
			"@typescript-eslint/no-useless-empty-export": "error",
			"@typescript-eslint/no-wrapper-object-types": "error",
			"@typescript-eslint/prefer-as-const": "error",
			"@typescript-eslint/prefer-for-of": "error",
			"@typescript-eslint/prefer-function-type": "error",
			"@typescript-eslint/prefer-includes": "error",
			"@typescript-eslint/prefer-literal-enum-member": "error",
			"@typescript-eslint/prefer-namespace-keyword": "error",
			"@typescript-eslint/prefer-nullish-coalescing": "error",
			"@typescript-eslint/prefer-optional-chain": "error",
			"@typescript-eslint/prefer-readonly": "error",
			"@typescript-eslint/prefer-regexp-exec": "error",
			"@typescript-eslint/prefer-return-this-type": "error",
			"@typescript-eslint/prefer-string-starts-ends-with": "error",
			"@typescript-eslint/class-methods-use-this": "error",
			"@typescript-eslint/prefer-ts-expect-error": "error",
			"@typescript-eslint/promise-function-async": "error",
			"@typescript-eslint/default-param-last": "error",
			"@typescript-eslint/restrict-plus-operands": "error",
			"@typescript-eslint/restrict-template-expressions": "error",
			"@typescript-eslint/dot-notation": "error",
			"@typescript-eslint/sort-type-constituents": "error",
			"@typescript-eslint/switch-exhaustiveness-check": "error",
			"@typescript-eslint/no-array-constructor": "error",
			"@typescript-eslint/triple-slash-reference": "error",
			"@typescript-eslint/unbound-method": "error",
			"@typescript-eslint/no-dupe-class-members": "error",
			"@typescript-eslint/unified-signatures": "error",
			"class-methods-use-this": "off",
			"@typescript-eslint/no-empty-function": "error",
			"default-param-last": "off",
			"@typescript-eslint/no-empty-object-type": "error",
			"dot-notation": "off",
			"@typescript-eslint/no-implied-eval": "error",
			"no-array-constructor": "off",
			"@typescript-eslint/no-invalid-this": "error",
			"no-dupe-class-members": "off",
			"@typescript-eslint/no-deprecated": "error",
			"no-empty-function": "off",
			"@typescript-eslint/no-loop-func": "error",
			"@typescript-eslint/no-loss-of-precision": "error",
			"no-implied-eval": "off",
			"@typescript-eslint/no-redeclare": "error",
			"no-invalid-this": "off",
			"@typescript-eslint/no-shadow": "error",
			"no-loop-func": "off",
			"@typescript-eslint/return-await": "error",
			"@typescript-eslint/only-throw-error": "error",
			"no-loss-of-precision": "off",
			"@typescript-eslint/require-await": "error",
			"no-redeclare": "off",
			"@typescript-eslint/no-unused-expressions": "error",
			"no-return-await": "off",
			"no-shadow": "off",
			"@typescript-eslint/no-unused-vars": [
				"error",
				{ ignoreRestSiblings: true },
			],
			"@typescript-eslint/no-useless-constructor": "error",
			"no-throw-literal": "off",
			"no-unused-expressions": "off",
			"no-unused-vars": "off",
			"no-useless-constructor": "off",
			"require-await": "off",
		},
	},
	...new FlatCompat().extends("plugin:mdx/recommended").map((config) => ({
		...config,
		files: ["**/*.{md,mdx}"],
		settings: {
			"mdx/code-blocks": true,
		},
	})),
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
			"import/no-default-export": "off",
		},
	},
	eslintPluginPrettierRecommended,
);
