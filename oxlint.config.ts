import baseConfig from "@adbayb/stack/oxlint";

// TODO: expose createConfig? Same for oxfmt?
export default {
	...baseConfig,
	ignorePatterns: ["**/templates/**"],
};
