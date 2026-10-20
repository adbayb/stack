---
name: code-audit
description: "Audit and fix existing code for architecture and quality violations, including pull request and diff reviews. Use when asked to review, audit, or assess a slice, module, repo, or pull request for design quality: tech debt, code smells, SOLID violations, bloated APIs, tight coupling, or hexagonal/clean/vertical-slice compliance. Reports findings first, then applies minimal fixes when requested, keeping behavior changes and refactors separate. Requires the `software-design` skill."
license: MIT
metadata:
    author: adbayb
    repository: adbayb/stack
    requires: "software-design >=1.0.0"
    version: "1.0.0"
---

# Code Audit

Audit existing code against `software-design`, report findings first, then fix with minimal blast radius. The prerequisite owns design rules and glossary and wins on rule conflicts; this skill owns audit procedure, evidence, severity, scoring, and fix policy. For audits, the findings report (and, when fixing, the closing summary) replaces the `software-design` design note.

## Prerequisite

`software-design` is required at the version declared by this skill's `metadata.requires`. Acronyms are expanded once in the `software-design` glossary; this skill uses them bare. If it is not installed, or older than required, stop before auditing and ask the user to install or update it:

```bash
pnpm dlx skills add adbayb/stack --skill software-design -g
```

Do not install it without explicit approval. After approval, run the command, load the skill, confirm the installed `software-design` frontmatter `metadata.version` satisfies `metadata.requires`, and resume. Do not continue with a partial audit.

`metadata.requires` is a lower bound: if a reference mapped here is missing from the installed `software-design`, stop and report the incompatibility.

## Workflow

### 1. Scope

- Confirm target (files, slice, repo, or PR diff) and non-goals. Do not boil the ocean.
- For a PR review, audit changed files and direct dependents; report unrelated findings separately.
- Note the inner style and slice boundaries from the codebase; state assumptions when missing.
- Run existing tests and the relevant linters/formatters first to establish a baseline; red baselines follow `software-design` reference `testing-refactoring.md`. If project dependencies are missing, stop and ask.

### 2. Detect

Read `references/checklist.md` for the A-G dimension map, evidence, exemptions, and severity. Load only the mapped references in scope, apply their rules first, then the audit deltas.

Scan A-G in order for a full audit; for a PR, cover dimensions touched by the change and direct dependents. Mark inapplicable dimensions with a reason. Before introducing a named pattern while fixing, load `software-design` reference `patterns.md`.

Trace the changed contract through direct callers, alternate entry points, adapters, exports/configuration, and instruction/template consumers that can affect it. Inspect actual implementations, not only matching names.

Record each finding with location (`path:line`), reference rule, evidence/confidence, impact, and severity using `references/checklist.md`. If no rule matches, report a gap and propose a rule for its canonical owner instead of inventing one.

### 3. Report before fixing

Present this table first. For a PR review, default to the report and leave fixes to a follow-up unless asked. If audit-only, stop after the report. If fixing, ask approval before destructive changes: deleting files, changing public signatures, or schema/data migrations.

```markdown
## Audit findings

| #   | Location                  | Severity | Principle/Smell | Evidence / confidence                                    | Impact                 | Fix direction                 |
| --- | ------------------------- | -------- | --------------- | -------------------------------------------------------- | ---------------------- | ----------------------------- |
| 1   | `src/refund/refund.ts:42` | Major    | SRP             | Supported: unrelated callers change validation and retry | Coupled change reasons | Separate the responsibilities |
```

Then total counts by severity, reviewed/skipped dimensions, verification limits, and up to 3 highest-leverage fixes. No findings: say so, include a requested score, and skip fixes; do not invent work.

When asked to score, follow `references/checklist.md`.

### 4. Fix with minimal blast radius

- Fix Blockers first, then Majors. Fix Boy Scout-cheap Minors in the touched code as a separate change; do not create a commit unless asked. Park unrelated Minors in the report.
- **Behavior fixes are a separate lane.** For any severity, follow the behavior-fix sequence in `software-design` reference `testing-refactoring.md`.
- Fix order inside one file:
    1. Delete dead code.
    2. Narrow API using `software-design` reference `api-surface.md`.
    3. Reduce coupling using `software-design` reference `cohesion-coupling.md`.
    4. Extract responsibilities (SRP).
    5. Replace repeated type switches with Strategy only for a present violation.
    6. Insert ports/adapters at I/O edges only for a present violation (hexagonal/clean modules; flat slices exempt).
    7. Rename for intent.
    8. Clean naming/comments using `software-design` reference `clean-code.md`.
- Record each fix's blast radius in the closing summary.
- One responsibility per change. Use the mapped `software-design` reference for mechanics; the fix order is audit policy, not a new design rule.

### 5. Verify

- Re-run affected tests plus linters/type checks; state what ran and the result.
- Re-scan touched code against the mapped references and `references/checklist.md`; no new violations.
- Recheck direct consumers and the original reproductions. Mark blocked checks as unverified; never claim a clean audit from a partial scan or a test that never ran.
- Close with what was fixed, what was left and why, and verification results. Recommend another audit slice only for a concrete remaining concern.

## Rules

- Explain the why in one line per fix (principle, then consequence), not theory dumps. Cite the reference; do not paste rule prose.
- Follow `software-design` reference `testing-refactoring.md` for test integrity.
- Stay within present violations: no new functionality, frameworks, or speculative patterns. Removing speculative code is in scope; adding "flexibility" is not.
- Never run package installs, dependency upgrades, or releases while auditing; dependency changes are findings, not fixes. The only exception is installing/updating the approved `software-design` prerequisite. After the baseline, keep linter/formatter runs scoped to audited files.
- Fix only inside the audited slice; park out-of-scope findings in the report.
- If a fix would expand the API surface or cross slice boundaries, propose it and stop; do not unilaterally widen contracts.
