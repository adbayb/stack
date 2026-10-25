---
name: software-audit
description: "Audit and fix existing code for architecture and quality violations, including pull request and diff reviews. Use when asked for a code audit or to review, audit, or assess a slice, module, repo, or pull request for design quality: tech debt, code smells, SOLID violations, bloated APIs, tight coupling, or hexagonal/clean/vertical-slice compliance. Reports findings first, then applies minimal fixes when requested, keeping behavior changes and refactors separate. Requires the `software-design` skill."
license: MIT
metadata:
    author: adbayb
    repository: adbayb/stack
    requires:
        - "software-design >=1.0.0"
    version: "1.0.0"
---

# Software Audit

Audit existing code against `software-design`, report findings first, then fix with minimal blast radius. Agent instructions are out of scope: in mixed changes, check instruction files only as consumers of a changed code contract. The prerequisite owns design rules and glossary; this skill owns audit procedure, evidence, severity, scoring, and fix policy. Repo rules override both, and the prerequisite wins over this skill on rule conflicts. For audits, the findings report (and, when fixing, the closing summary) replaces the `software-design` design note.

## Prerequisite

`software-design` is required at the version declared by this skill's `metadata.requires`. Acronyms are expanded once in the `software-design` glossary; this skill uses them bare. If it is not installed, or older than required, stop before auditing and ask the user to install or update it:

```bash
pnpm dlx skills add adbayb/stack --skill software-design -g
```

Do not install it without explicit approval. After approval, run the command, load the skill, confirm the installed `software-design` frontmatter `metadata.version` satisfies `metadata.requires`, and resume. Do not continue with a partial audit.

`metadata.requires` is a lower bound: if a reference mapped here is missing from the installed `software-design`, stop and report the incompatibility. When prerequisites block the audit, include **Score: not assessed (prerequisite blocked)**; do not invent a numerical score.

## Workflow

Never install or upgrade dependencies or run releases while auditing, except installing or updating the approved `software-design` prerequisite; dependency changes are findings, not fixes. After the baseline, scope linter and formatter runs to audited files.

### 1. Scope

- Confirm target (files, slice, repo, or PR diff) and non-goals. Do not boil the ocean.
- For a PR review, audit changed files and direct dependents; report unrelated findings separately.
- Note the inner style and slice boundaries from the codebase; state assumptions when missing.
- Run existing tests and the relevant linters/formatters first to establish a baseline; red baselines follow `software-design` reference `testing-refactoring.md`. If project dependencies are missing, stop and ask.

### 2. Detect

Read `references/checklist.md` for the A-G dimension map, evidence, exemptions, and severity. Load only the mapped references in scope, apply their rules first, then the audit deltas.

Scan A-G in order for a full audit; for a PR, cover dimensions touched by the change and direct dependents. Mark inapplicable dimensions with a reason.

Trace the changed contract through direct callers, alternate entry points, adapters, exports/configuration, and instruction/template consumers that can affect it. Inspect actual implementations, not only matching names.

For test-gap findings, follow the evidence threshold in `references/checklist.md` dimension F; a diff that omits test files alone does not establish missing coverage.

Record each finding as an `Output` table row, grading severity and confidence with `references/checklist.md`. If no rule matches, report a gap and propose a rule for its canonical owner instead of inventing one.

### 3. Report before fixing

Present the `Output` section's report first. For a PR review, default to the report and leave fixes to a follow-up unless asked. If audit-only, stop after the report. If fixing, ask approval before destructive changes: deleting files, changing public signatures, or schema/data migrations.

### 4. Fix with minimal blast radius

- Fix only present violations inside the audited slice: no new functionality, frameworks, or speculative patterns; removing speculative code is in scope, adding "flexibility" is not. If a fix would widen the API surface or cross a slice boundary, propose it and stop.
- Fix Blockers first, then Majors. Fix Boy Scout-cheap Minors in the touched code as a separate change; do not create a commit unless asked. Park unrelated Minors and out-of-slice findings in the report.
- **Behavior fixes are a separate lane.** For any severity, follow the behavior-fix sequence in `software-design` reference `testing-refactoring.md`; every fix keeps its test-integrity rules.
- Fix order inside one file:
    1. Delete dead code.
    2. Narrow API using `software-design` reference `api-surface.md`.
    3. Reduce coupling using `software-design` reference `cohesion-coupling.md`.
    4. Extract responsibilities (SRP).
    5. Replace repeated type switches with Strategy only for a present violation.
    6. Insert ports/adapters at I/O edges only for a present violation (hexagonal/clean modules; flat slices exempt).
    7. Rename for intent.
    8. Clean naming/comments using `software-design` reference `clean-code.md`.
- One responsibility per change. Use the mapped `software-design` reference for mechanics, and load `software-design` reference `patterns.md` before introducing a named pattern; the fix order is audit policy, not a new design rule.

### 5. Verify

- Re-run affected tests plus linters/type checks; state what ran and the result.
- Re-scan touched code against the mapped references and `references/checklist.md`; no new violations.
- Recheck direct consumers and the original reproductions. Mark blocked checks as unverified; never claim a clean audit from a partial scan or a test that never ran.
- Recommend another audit slice only for a concrete remaining concern.

## Output

```markdown
## Audit findings

| #   | Location                  | Severity | Criterion(s)     | Issue                                                                             | Solution                      |
| --- | ------------------------- | -------- | ---------------- | --------------------------------------------------------------------------------- | ----------------------------- |
| 1   | `src/refund/refund.ts:42` | Major    | C. SOLID / GRASP | SRP: unrelated callers change validation and retry, coupling their change reasons | Separate the responsibilities |
```

For each finding, name the in-scope scoring dimension or dimensions it affects, using the checklist's letter and title. Write each Issue as one sentence: the violated rule or smell, then the evidence and its consequence; cite the rule instead of pasting its prose or theory. Keep each Solution to a fix direction.

Then total counts by severity, reviewed/skipped dimensions, unaudited out-of-scope files, verification limits (Supported rows and Unverified gaps), and up to 3 highest-leverage fixes. Always include the in-scope criterion scores per `references/checklist.md` and end the report with **Total score: ?/10**, even when scoring was not requested or there are no findings; mark incomplete verification provisional. Before reporting, recalculate the total from the listed criterion scores using the checklist formula and confirm the numerator, denominator, and displayed score agree. No findings: say so and skip fixes; do not invent work. When fixing, close with what was fixed and each fix's blast radius, what was left and why, and verification results, then end with the updated score.

## Example

Request: "Audit `src/refund/` and fix what matters."

- Report: 1 Major (SRP at `src/refund/refund.ts:42`), 1 Minor (a new `fetchRefund` helper uses a banned verb); G skipped, no new input boundary.
- Fixes: retry policy extracted (blast radius: one module and its test); helper renamed to `getRefund`.
- Verification: unit tests, lint, and type checks pass; the re-scan finds no new violations.
- Criteria after fixes: A-F each 2/2; G inapplicable, excluded from the denominator.
- **Total score: 10/10** (qualitative judgment within the audited scope).
