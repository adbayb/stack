---
"stack": patch
---

Update skills and `AGENTS.md` to:

- Consolidate style rules in one source: AGENTS.md defers design and style defaults to the `software-design` skill and carries only repo deltas (the code-audit checklist also points at the canonical naming table).
- Align naming rules everywhere (add the `list` banned synonym) and keep audit fixes scoped to the audited slice.
- Point the bootstrap at the `devEngines` fields instead of hardcoded tool versions.
- Make the `software-design` skill installable again: quote the frontmatter `description` (its unquoted colon broke the `skills` CLI YAML loader) and document `pnpm dlx` as the install command (`npx` cannot run in this repo because npm rejects the `devEngines` pnpm gate).
- Complete both skill frontmatters with the Agent Skills specification optional fields (`license: MIT`, `author`, `repository`, and a decoupled skill `version`; `compatibility` and `allowed-tools` do not apply) and document the `version` bump rule in root AGENTS.md.
