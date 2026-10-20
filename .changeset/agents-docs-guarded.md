---
"@adbayb/stack": patch
---

Update skills and `AGENTS.md` to:

- Consolidate style rules in one source: AGENTS.md defers design and style defaults to the `software-design` skill and carries only repo deltas (the code-audit checklist also points at the canonical naming table).
- Align naming rules everywhere (add the `list` banned synonym) and keep audit fixes scoped to the audited slice.
- Point the bootstrap at the `devEngines` fields instead of hardcoded tool versions.
- Make the `software-design` skill installable again: quote the frontmatter `description` (its unquoted colon broke the `skills` CLI YAML loader) and document `pnpm dlx` as the install command (`npx` cannot run in this repo because npm rejects the `devEngines` pnpm gate).
- Complete both skill frontmatters with the Agent Skills specification optional fields (`license: MIT`, `author`, `repository`, and a decoupled skill `version`; `compatibility` and `allowed-tools` do not apply) and document the `version` bump rule in root AGENTS.md. Validate Agent Skills name, description, and semantic-version constraints.
- Document the generated-project focused test command, hook behavior, release flow, and PR title enforcement accurately.
- Make the Result convention conditional on project adoption, align barrel-import and parameter rules across skill references, and keep refactor findings scoped to touched code.
- Make `code-audit` explicitly audit-and-fix and usable for pull request and diff reviews.
- Correct the LSP variance rule and distinguish symbol promotion from shared-module extraction.
- Sync template workflow and README check labels with the default `stack check` scope.
- Validate skill frontmatter fields and guard against duplicate or inconsistent glossary entries, bare acronyms, oversized skill bodies, unsafe unquoted descriptions, and stale CI labels.
- Point scaffolded repos at nested `AGENTS.md` guidance: workspace packages needing tailored rules can add one inside the package, where agents read the nearest file.
- Define instruction precedence: the nearest `AGENTS.md` wins and repo rules override skill defaults; each skill owns its internal precedence (in `software-design`, references win over `SKILL.md`), and external sources never override either.
- Make `software-design` a hard prerequisite for `code-audit`: stop and ask for approval to install it instead of falling back to duplicated naming rules, and validate cross-skill references.
- Clarify TSDoc expectations for exported APIs, internal production helpers, and non-obvious test helpers.
- Document the installable skills and the `code-audit` prerequisite in the README, and guard cross-skill references, orphan references, template paths, and root bootstrap commands in the test suite.
