---
"@adbayb/stack": patch
---

Fixes on `clean` and `install` commands including:

- Preserve `.env*` and refuse out-of-root paths in `stack clean`; document exactly what cleanup removes.
- Build pre-commit hooks with argument arrays instead of interpolating file names into a shell command.
