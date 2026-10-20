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

- Evidence: naming/verb mapping/banned synonyms; function size/nesting/guards/explanatory variables/named constants; comments/dead code; neutral text/type-checker silencing/absence/public interface/TSDoc; instruction ownership, triggers, loading paths, links, prerequisites, blocked paths, size budgets, and standalone mirrors.
- Deltas: scope naming/style to new or edited code, neutral-text checks to introduced text. For instruction artifacts, trace conflicts to a concrete agent decision and exercise relevant counterexamples: flat I/O script, data-only DTO, closed union switch, failed lookup versus absence, and unavailable prerequisites.

## F. Tests / cohesion / coupling / errors

Rules: `software-design` reference `cohesion-coupling.md`, `software-design` reference `testing-refactoring.md`, and `software-design` reference `clean-code.md`.

- Evidence: change impact/coupling (cycles, globals, hidden I/O, Demeter, surprise side effects, new third-party dependencies); deterministic tests, adapter contracts, and changed boundary/failure coverage; error convention/boundary mapping/query purity/absence; resource ownership, cancellation, retry/idempotency safety, and bounded workload.
- Deltas: demonstrate the test obstacle or missing changed-behavior case; untouched coverage gaps are not findings. Trace success, rejection, timeout/cancellation, duplicate/concurrent execution, and partial-failure paths when relevant; check final state, effect count, cleanup, and reported errors.

## G. Security

Rules: `software-design` reference `security.md` plus repo security rules.

- Evidence: boundary validation and resource/tenant authorization; untrusted input reaching shell/query syntax, paths, or network destinations; secrets and sensitive data in storage/logs/errors; token/permission scope; dependency pinning/upgrades.
- Deltas: establish input trust and path reachability; redact secret evidence. Dependency changes remain report-only under the audit workflow.

## Severity

Assign by demonstrated impact, after applying the owning reference's style and scope exceptions. A smell or principle name alone does not determine severity. Record the affected caller, execution path, or agent decision; label uncertain impact as a hypothesis to investigate.

- Blocker: a concrete path to data loss/corruption, an irreversible duplicate effect, exposed secrets, a reachable security breach, an unusable core flow, or an unapproved incompatible published contract. Architectural discomfort or a minor wrong result alone is insufficient.
- Major: reproducible incorrect behavior below the Blocker threshold, or evidenced maintainability/verification harm such as cross-slice change propagation, a violated chosen dependency boundary, an untestable changed business rule, or missing changed-behavior boundary/failure coverage.
- Minor: local clarity, naming, documentation, or duplicated ownership without demonstrated behavioral impact.
- Prose artifacts (`AGENTS.md`, skills, references): use the same thresholds. A conflict that directs an unjustified rewrite is Major unless its demonstrated consequence meets the Blocker threshold. Guarded standalone mirrors are not duplicate ownership.

## Evidence and confidence

- Verified: a reproduction, failing test, or direct source proof establishes the consequence.
- Supported: a concrete caller/input and traced path establish the consequence, but it was not executed. State that limit.
- Unverified: a suspicion without a complete path. Report it as an investigation gap, not a confirmed finding or scoring deduction.
- Separate confidence from severity. Deduplicate findings by root cause; record both the expected contract and the observed contradiction. Do not claim repository-wide absence from a scoped search.

## Scoring

Instructions use the rubric below. For code, agree on scope-appropriate criteria first and label the score a qualitative judgment. Score each criterion 0 (absent or conflicting), 1 (partial), or 2 (complete in the audited scope); tie deductions to confirmed findings and keep criteria unchanged for before/after scores. The instruction rubric sums to 10.

| Criterion       | Evidence for 2 points                                                                           |
| --------------- | ----------------------------------------------------------------------------------------------- |
| Consistency     | No unresolved conflicts across canonical rules and their consumers.                             |
| Ownership       | One owner per rule; consumers link to it, and justified standalone copies have drift guards.    |
| Actionability   | Clear triggers, prerequisites, scope, evidence requirements, and failure/blocked paths.         |
| Proportionality | Rules honor style exceptions and present needs; counterexamples do not force speculative work.  |
| Verification    | Relevant reference/metadata/mirror checks and scenario checks pass; state any remaining limits. |

An unresolved confirmed finding prevents full marks in its affected criterion. Unverified relevant areas make the score provisional; 10/10 means no identified gap within the stated scope, not universal perfection or proof from lint alone.
