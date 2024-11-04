import { createRequire } from "node:module";

import tseslint from "typescript-eslint";

export const require = createRequire(import.meta.url);
export const createConfig = tseslint.config;
