---
"@adbayb/stack": patch
---

Split design rules from audit procedure in the Agent Skills:

- Keep normative design rules in `software-design` (add test-quality, refactoring-safety, and secret-handling rules).
- Make `code-audit` a verification layer that links to `software-design` references and glossary instead of restating them, with audit-only evidence, severity, and fix policy.
- Require `software-design` >=1.0.0 from `code-audit` and validate the prerequisite version, reference mapping, and per-dimension pointers in tests.
- Split `software-design` references by concern (clean code, cohesion/coupling, testing/refactoring, security, sources) so each audit dimension loads only what it needs, and tighten the `SKILL.md` router.
- Compact root and template `AGENTS.md` files, make mirrored sections byte-identical, and enforce line/word budgets plus exact mirroring in tests.
- Add audit safety rules: never weaken tests or suppress checks to make a fix pass, and keep dependency changes report-only.
