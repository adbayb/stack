---
"@adbayb/stack": minor
---

Rename the published Agent Skills verb-first and reset their versions to `1.0.0`.

**Breaking for skill installs**: `software-design` -> `design-software`, `software-audit` -> `audit-software`, `skill-design` -> `design-skill`, `skill-audit` -> `audit-skill`, `document-design` -> `design-document`, and `document-audit` -> `audit-document`. Reinstall with the new names, for example `pnpm dlx skills add adbayb/stack --skill design-software -g`.

`design-skill` now owns the verb-first `<verb>-<object>` naming rule, and `audit-skill` links to the repository versioning rule instead of restating it.
