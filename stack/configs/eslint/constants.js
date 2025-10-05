const JAVASCRIPT_EXTENSIONS = ["js", "jsx", "cjs", "mjs", "mjsx"];
const TYPESCRIPT_EXTENSIONS = ["ts", "tsx", "cts", "mts", "mtsx"];

const JAVASCRIPT_LIKE_EXTENSIONS = [
	...JAVASCRIPT_EXTENSIONS,
	...TYPESCRIPT_EXTENSIONS,
];

const JAVASCRIPT_LIKE_EXTENSIONS_AS_STRING =
	JAVASCRIPT_LIKE_EXTENSIONS.join(",");

export const JAVASCRIPT_FILES = [`**/*.{${JAVASCRIPT_EXTENSIONS.join(",")}}`];

export const JAVASCRIPT_LIKE_FILES = [
	`**/*.{${JAVASCRIPT_LIKE_EXTENSIONS_AS_STRING}}`,
];

export const TEST_LIKE_FILES = [
	`**/{test,test-d}.{${JAVASCRIPT_LIKE_EXTENSIONS_AS_STRING}}`,
	`**/*.{test,test-d}.{${JAVASCRIPT_LIKE_EXTENSIONS_AS_STRING}}`,
];

export const RELAXED_LIKE_FILES = [
	...TEST_LIKE_FILES,
	"**/?(.)config?(s)/**",
	"**/examples/**",
	"**/scripts/**",
	"**/tools/**",
	`**/config?(s).{${JAVASCRIPT_LIKE_EXTENSIONS_AS_STRING}}`,
	`**/*.config?(s).{${JAVASCRIPT_LIKE_EXTENSIONS_AS_STRING}}`,
	`**/stories.{${JAVASCRIPT_LIKE_EXTENSIONS_AS_STRING}}`,
	`**/*.stories.{${JAVASCRIPT_LIKE_EXTENSIONS_AS_STRING}}`,
];

export const CWD = process.cwd();
