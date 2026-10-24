# Audit Checklist: evidence and deltas

Per-dimension evidence prompts and audit deltas, then severity, confidence, and scoring. Each `Rules:` line names the owning `skill-design` reference.

## A. Anatomy and metadata

Rules: `skill-design` reference `anatomy.md`.

- Evidence: folder and `name` match; frontmatter fields, quoting, and version bounds; section set and order; prerequisite section steps; numbered workflow; `Output` and `Example` sections; glossary placement; reference links and depth; size budgets.
- Deltas: passing repository checks are evidence, not proof of intent; report drift the checks miss. Report a missing guard only when drift occurred or a copy makes it likely.

## B. Triggers

Rules: `skill-design` reference `writing.md`.

- Evidence: capability plus a "Use when" trigger; real phrasings covered; when-to-use text hidden in the body; overlap with sibling skills; prerequisite named.
- Deltas: demonstrate a misroute with a concrete request: one that should load the skill but would not, or a near miss that would.

## C. Ownership and consistency

Rules: `skill-design` reference `writing.md`.

- Evidence: one owner per rule; restated or paraphrased rules in consumers; conflicting precedence or version rules; skills named or referenced without being declared prerequisites; standalone copies with a named source and drift guard.
- Deltas: guarded standalone mirrors are not duplicate ownership, and distinct rules with similar wording are not duplication, but an unguarded restatement of an owned rule is, even when the copies agree. Trace each conflict to the agent decision it changes.

## D. Actionability and proportionality

Rules: `skill-design` reference `writing.md`.

- Evidence: each instruction states when it applies, its scope and prerequisites, and what to do when blocked; workflow steps name the reference to load and when.
- Deltas: walk counterexamples from the instruction's own domain and exceptions (for design rules: a flat input/output script, a data-only transfer object, a closed union switch, a failed lookup versus absence), plus an unavailable prerequisite. A rule that forces speculative work in a counterexample is a finding.

## E. Progressive disclosure

Rules: `skill-design` reference `writing.md`.

- Evidence: always-loaded text limited to triggers and repository deltas; `SKILL.md` an entry point; references split by concern; budgets met without dropping meaning.
- Deltas: a budget overrun is a symptom; report its root cause, such as duplication or misplaced detail.

## F. Verification

Rules: `skill-design` reference `evaluation.md`.

- Evidence: reference targets, prerequisites, and documented commands exist; each change ran the checks its risk requires; guards cover anatomy, links, budgets, and mirrors.
- Deltas: demand a guard only where drift is costly or already occurred, not for every sentence.

## Severity

Assign by demonstrated impact on agent decisions, after applying the owning rule's scope and exceptions. A rule name alone does not determine severity. Record the affected request and the decision it changes; label uncertain impact as a hypothesis to investigate.

- Blocker: text that directs a destructive or irreversible action, exposes secrets, bypasses required approval, or leaves a core skill unusable (unloadable frontmatter, broken prerequisite chain, missing required reference).
- Major: a conflict or misroute below the Blocker threshold that directs wrong or unjustified work: conflicting owners, a trigger that misses core requests or captures near misses, a step routing to a missing or wrong reference, or a drifted standalone copy.
- Minor: local clarity, wording, budget pressure, or duplicated text without a demonstrated decision change.

## Evidence and confidence

- Verified: a failing check, a wrong decision reproduced in a scenario walk or run, or direct text proof of a conflict or duplicate.
- Supported: a concrete request and traced loading path establish the wrong decision, but nothing ran. State that limit.
- Unverified: a suspicion without a complete path. Report it as an investigation gap, not a confirmed finding or scoring deduction.
- Separate confidence from severity. Deduplicate findings by root cause; record both the owning rule and the contradicting text. Do not claim repository-wide absence from a scoped search.

## Scoring

Score each criterion 0 (absent or conflicting), 1 (partial), or 2 (complete in the audited scope); the total is out of 10. Tie deductions to confirmed findings and keep criteria unchanged for before/after scores.

| Criterion       | Evidence for 2 points                                                                           |
| --------------- | ----------------------------------------------------------------------------------------------- |
| Consistency     | No unresolved conflicts across canonical rules and consumers; every skill follows the anatomy.  |
| Ownership       | One owner per rule; consumers link to it, and justified standalone copies have drift guards.    |
| Actionability   | Clear triggers, prerequisites, scope, evidence requirements, and failure/blocked paths.         |
| Proportionality | Rules honor style exceptions and present needs; counterexamples do not force speculative work.  |
| Verification    | Relevant reference/metadata/mirror checks and scenario checks pass; state any remaining limits. |

An unresolved confirmed finding prevents full marks in its affected criterion. Unverified relevant areas make the score provisional; 10/10 means no identified gap within the stated scope, not universal perfection or proof from lint alone.
