import { createRequire } from "node:module";

export const require = createRequire(import.meta.url);

export { defineConfig as createConfig } from "eslint/config";
