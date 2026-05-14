---
"@adbayb/stack": minor
---

Use [devEngines](https://github.com/openjs-foundation/package-metadata-interoperability-working-group/blob/main/devengines-field-proposal.md) instead of engines to define development runtime requirements.
The `packageManager` field is still kept for tooling interoperability (Turborepo still needs this field), it will be removed later.
The install command has been updated to remove `only-allow` check since it's now deprecated in favor of `devEngines`.
Templates are updated as well.
