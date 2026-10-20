---
"@adbayb/stack": patch
---

Clarify ownership and precedence of standalone scaffold instructions, use root command wrappers consistently, and distinguish regressions from pre-existing failures. Also:

- Keep one owner per instruction rule: scaffolded `AGENTS.md` files leave skill-internal precedence to each skill, state the release rule once (release scripts run only in the continuous delivery workflow), and point at the full `software-design` security reference.
- Add `software-design` rules for actionable instructions (triggers, prerequisites, blocked paths), progressive loading within size budgets, and adopting third-party dependencies; limit Strategy to repeated type-code switches, matching Open/Closed.
- Remove restated rules from `code-audit`, move code-scoring guidance into its checklist, and keep both skills at version 1.0.0 until their first production release.
