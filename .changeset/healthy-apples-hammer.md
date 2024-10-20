---
"@adbayb/stack": minor
"@adbayb/create": minor
---

Update template to add pre-release workflow and hoist type-like package by default (to prevent such [issue](https://github.com/pnpm/pnpm/issues/5068) with, for example, `tsc` runs from where the recursive command has been initiated leading to omission of recursive packages dependencies).
