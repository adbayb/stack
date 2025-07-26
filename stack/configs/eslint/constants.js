export const CWD = process.cwd();

export const JAVASCRIPT_EXTENSIONS = ["**/*.{js,jsx,cjs,mjs}"];

export const TYPESCRIPT_EXTENSIONS = ["**/*.{ts,tsx,cts,mts}"];

export const JAVASCRIPT_LIKE_EXTENSIONS = [
	...JAVASCRIPT_EXTENSIONS,
	...TYPESCRIPT_EXTENSIONS,
];
