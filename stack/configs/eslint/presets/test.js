import jestFormattingPlugin from "eslint-plugin-jest-formatting";
import vitestPlugin from "@vitest/eslint-plugin";

export const config = [
	{
		files: [
			"**/test.{js,ts,jsx,tsx,cjs,cts,mjs,mts}",
			"**/*.test.{js,ts,jsx,tsx,cjs,cts,mjs,mts}",
		],
		plugins: {
			"jest-formatting": jestFormattingPlugin,
			"vitest": vitestPlugin,
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
];
