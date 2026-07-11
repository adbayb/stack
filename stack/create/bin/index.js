#!/usr/bin/env node

import { createRequire } from "node:module";

const pkg = createRequire(import.meta.url)("../package.json");

void import(new URL(`../${pkg.exports["."].default}`, import.meta.url));
