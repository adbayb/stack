---
"@adbayb/stack": patch
"@adbayb/create": patch
---

Skip the pre-commit fix run on a clean tree instead of falling back to a whole-project fix. Quote shell arguments so spaced filenames resolve correctly, and fail fast with actionable errors on invalid input. The initializer now exits non-zero on failure.
