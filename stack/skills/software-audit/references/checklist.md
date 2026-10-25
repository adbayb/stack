# Audit Checklist: evidence and deltas

Per-dimension evidence prompts and audit deltas, then severity, confidence, and scoring. Each `Rules:` line names the owning `software-design` reference.

## A. API surface / blast radius

Rules: `software-design` reference `api-surface.md`.

- Evidence: requirement/consumers per export; parameters/flags/leaked infrastructure/query mutations; invariant ownership and invalid state combinations; atomicity, concurrent updates, value precision, and source/wire/storage compatibility; callers and slices touched.
- Deltas: trace each finding to a current consumer or contract; distinguish an internal signature change from an incompatible published contract. Apply reference exceptions; generated code/test doubles exempt.

## B. Structure

Rules: `software-design` reference `architecture-styles.md`.

- Evidence: inner style and dependency direction; cross-slice/module imports; composition-root wiring; boundary enforcement (linter, package names, or convention).
- Deltas: establish the chosen style before reporting layer bypasses; direct repository calls are valid in flat transaction scripts. Check whether tooling can enforce a claimed boundary; do not invent layers to satisfy the checklist.

## C. SOLID / GRASP

Rules: `software-design` reference `solid-grasp.md`.

- Evidence: responsibility boundaries/change reasons; extension without stable-file edits; LSP overrides; interface width/unused dependencies; dependency direction/composition root.
- Deltas: report an observed change reason, substitution failure, unused dependency, or test obstacle, not a missing pattern. Inheritance and local exhaustive switches alone are not findings.

## D. Smells / anti-patterns

Rules: `software-design` reference `smells-antipatterns.md`.

- Evidence: bloaters, couplers, dispensables, change preventers, architecture anti-patterns in touched code; recurring type-code switches; dead/commented/speculative/duplicated-rule code.
- Deltas: group by root cause and establish harm; legitimate data contracts and deliberate duplication are not automatic findings. Separate touched-code remedies from larger cleanups.

## E. Clean code

Rules: `software-design` reference `clean-code.md`.

- Evidence: naming/verb mapping/banned synonyms; function size/nesting/guards/explanatory variables/named constants; comments/dead code; neutral text/type-checker silencing/absence/public interface/TSDoc.
- Deltas: scope naming/style to new or edited code, neutral-text checks to introduced text.

## F. Tests / cohesion / coupling / errors

Rules: `software-design` reference `cohesion-coupling.md`, `software-design` reference `testing-refactoring.md`, and `software-design` reference `clean-code.md`.

- Evidence: change impact/coupling (cycles, globals, hidden I/O, Demeter, surprise side effects, new third-party dependencies); deterministic tests, adapter contracts, and changed boundary/failure coverage; error convention/boundary mapping/query purity/absence; resource ownership, cancellation, retry/idempotency safety, and bounded workload.
- Deltas: a diff that omits test files alone does not establish a coverage gap. Before reporting one, identify a behavior contract changed by the reviewed diff; an audit-only finding about existing behavior does not make that contract changed. If no changed contract is in scope, do not report or deduct for absent coverage. For a changed contract, inspect the relevant suite to confirm its boundary or failure behavior is untested; if that evidence is unavailable, record an investigation gap rather than a finding or score deduction. Trace success, rejection, timeout/cancellation, duplicate/concurrent execution, and partial-failure paths when relevant; check final state, effect count, cleanup, and reported errors.

## G. Security

Rules: `software-design` reference `security.md` plus repo security rules.

- Evidence: boundary validation and resource/tenant authorization; untrusted input reaching shell/query syntax, paths, or network destinations; secrets and sensitive data in storage/logs/errors; token/permission scope; dependency pinning/upgrades.
- Deltas: establish input trust and path reachability; redact secret evidence.

## Severity

Assign by demonstrated impact, after applying the owning reference's style and scope exceptions. A smell or principle name alone does not determine severity. Record the affected caller or execution path; label uncertain impact as a hypothesis to investigate.

- Blocker: a concrete path to data loss/corruption, an irreversible duplicate effect, exposed secrets, a reachable security breach, an unusable core flow, or an unapproved incompatible published contract. Architectural discomfort or a minor wrong result alone is insufficient.
- Major: reproducible incorrect behavior below the Blocker threshold, or evidenced maintainability/verification harm such as cross-slice change propagation, a violated chosen dependency boundary, an untestable changed business rule, or missing changed-behavior boundary/failure coverage.
- Minor: local clarity, naming, documentation, or duplicated ownership without demonstrated behavioral impact.

## Evidence and confidence

- Verified: a reproduction, failing test, or direct source proof establishes the consequence.
- Supported: a concrete caller/input and traced path establish the consequence, but it was not executed. State that limit.
- Unverified: a suspicion without a complete path. Report it as an investigation gap, not a confirmed finding or scoring deduction.
- Separate confidence from severity. Deduplicate findings by root cause; record both the expected contract and the observed contradiction. Do not claim repository-wide absence from a scoped search.

## Scoring

Always score every audit report, including no-findings reports and requests that do not ask for scoring. Use the in-scope A-G dimensions as criteria unless the user names others, and label the score a qualitative judgment. Score each criterion 0 (absent or conflicting), 1 (partial), or 2 (complete in the audited scope); the total is out of twice the criterion count. Tie deductions to confirmed findings and keep criteria unchanged for before/after scores. Exclude inapplicable dimensions from the denominator; if nothing can be assessed, report **Score: not assessed** with the blocker instead of inventing a numerical score.

An unresolved confirmed finding prevents full marks in its affected criterion. Unverified relevant areas make the score provisional; a full score means no identified gap within the stated scope, not universal perfection or proof from lint alone.

End the scoring report with **Total score: ?/10**, replacing `?` with the criterion total divided by the maximum possible total and multiplied by 10; mark it provisional when applicable.
