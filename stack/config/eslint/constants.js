import { cwd } from "node:process";

export const CWD = cwd();

export const JAVASCRIPT_EXTENSIONS = ["**/*.{js,jsx,cjs,mjs}"];

export const JAVASCRIPT_LIKE_EXTENSIONS = [
	...JAVASCRIPT_EXTENSIONS,
	"**/*.{ts,tsx,cts,mts}",
];
