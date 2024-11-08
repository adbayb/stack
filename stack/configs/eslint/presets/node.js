import { join } from "node:path";

import nodePlugin from "eslint-plugin-n";

import { require } from "../helpers.js";
import { CWD, JAVASCRIPT_LIKE_EXTENSIONS } from "../constants.js";

export const config = [
	{
		files: JAVASCRIPT_LIKE_EXTENSIONS,
		plugins: {
			n: nodePlugin,
		},
		rules: {
			"n/callback-return": "error",
			"n/exports-style": ["error", "module.exports"],
			"n/no-exports-assign": "error",
			"n/no-path-concat": "error",
			"n/no-process-env": [
				"error",
				{
					allowedVariables: ["NODE_ENV", "ENVIRONMENT"],
				},
			],
			"n/no-unpublished-bin": "error",
			"n/no-unsupported-features/es-builtins": "error",
			"n/no-unsupported-features/es-syntax": "error",
			"n/no-unsupported-features/node-builtins": [
				"error",
				{ allowExperimental: true },
			],
			"n/prefer-global/buffer": ["error", "never"],
			"n/prefer-global/console": ["error", "always"],
			"n/prefer-global/process": ["error", "never"],
			"n/prefer-global/text-decoder": ["error", "always"],
			"n/prefer-global/text-encoder": ["error", "always"],
			"n/prefer-global/url": ["error", "always"],
			"n/prefer-global/url-search-params": ["error", "always"],
			"n/prefer-node-protocol": "error",
			"n/prefer-promises/dns": "error",
			"n/prefer-promises/fs": "error",
			"n/process-exit-as-throw": "error",
		},
		settings: {
			node: {
				version: require(join(CWD, "package.json")).engines.node,
			},
		},
	},
];
