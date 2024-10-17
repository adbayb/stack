---
"@adbayb/stack": patch
---

Fix `check` command not being able to resolve each package dependency locally (`@types/*` packages must be installed globally at the monorepo root level as a quick-and-dirty fix) by running `tsc` command locally on each package with proper current working directory resolution.
