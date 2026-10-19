---
"stack": patch
---

Harden skills and agent instructions:

- Preserve `.env*` and refuse out-of-root paths in `stack clean`; document exactly what cleanup removes.
- Build pre-commit hooks with argument arrays instead of interpolating file names into a shell command.
- Resolve conflicting design rules for shared-code thresholds, CQS/Result commands, barrel imports, severity levels, and Helper naming; clarify that the Helper ban applies to class/function identifiers, not file names.
- Add the code-audit behavior-fix lane and require approval before destructive audit changes.
- Fix template bootstrap, `turbo.json`, and root-config claims; widen the AGENTS.md mirror tests.
- Validate Agent Skills name, description, and semantic-version constraints, and bump both skill versions.
