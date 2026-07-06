import baseConfig from "@adbayb/stack/oxlint";

// TODO: expose createConfig? Same for oxfmt?
// TODO: clean all eslint references
export default {
	...baseConfig,
	ignorePatterns: ["**/templates/**"],
};
