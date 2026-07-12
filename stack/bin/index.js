#!/usr/bin/env node

import pkg from "../package.json" with { type: "json" };

void import(new URL(`../${pkg.exports["."].default}`, import.meta.url));
