# Audit Checklist: evidence and deltas

Per-dimension evidence prompts and audit deltas, then severity, confidence, and scoring. Each `Rules:` line names the owning `skill-design` reference.

Depth: each dimension is exhaustive within scope. Walk every Evidence item against every in-scope file; clear an item without a finding explicitly, with the evidence examined.

## A. Anatomy and metadata

Rules: `skill-design` reference `anatomy.md`.

- Evidence: folder and `name` match (64 chars, lowercase/digits/single hyphens); `description` within 1024 characters and double-quoted; `license`, `metadata.author`, `metadata.repository` set; `metadata.version` semver bumped (patch for wording, minor for added rule or reference, major for removed or renamed rule, workflow, or prerequisite, per the repository rule) per the repository rule for contract changes; `metadata.requires` shape and lowest-sufficient bounds, with every prerequisite declared; unneeded `compatibility`/`allowed-tools`; level-two sections in the shared order and no others; title-case heading and intro covering scope, ownership split, and precedence; `Prerequisite` steps (name, stop-and-ask, install command, approval, no partial work, missing-reference incompatibility); numbered workflow steps each naming the reference to load and when; `Output` and `Example` consistency (the example follows the output template); glossary placement and identical shared expansions; every reference linked from `SKILL.md` with a load condition and kept one level deep; optional `Missing rule?` section for rule-owning skills pointing at non-normative sources (sources never overriding repo rules); `scripts/` and `assets/` use (assets only for files copied into results, response templates kept in `Output`); repository docs kept out of the skill folder; `SKILL.md` and reference line budgets.
- Deltas: passing repository checks are evidence, not proof of intent; report drift the checks miss. Report a missing guard only when drift occurred or a copy makes it likely.

## B. Triggers

Rules: `skill-design` reference `writing.md`.

- Evidence: capability followed by "Use when"/"Use whenever" triggers naming tasks, artifacts, and phrasings, including requests that never name the skill and adjacent requests that still need it; leaning toward triggering without capturing trivial one-step requests; when-to-use text hidden in the body; out-of-scope artifacts stated in the body intro; overlap and near misses against sibling skills; closing `Requires` sentence listing every declared prerequisite; description claims matching what the skill does (no hidden network calls, data collection, or approval bypass); trigger-check evidence (about 20 queries, held-out split) for changed descriptions.
- Deltas: demonstrate a misroute with a concrete request: one that should load the skill but would not, or a near miss that would.

## C. Ownership and consistency

Rules: `skill-design` reference `writing.md`.

- Evidence: one canonical owner per rule across `AGENTS.md`, `SKILL.md`, references, and the audit checklist; restated or paraphrased rules in consumers and non-normative summaries that read as normative; conflicting precedence or version rules; owner-first edits propagated to consumers; skills named or referenced without being declared prerequisites, and scope boundaries stated by artifact rather than by sibling skill; skill split by trigger and workflow, not size, with `<domain>-design`/`<domain>-audit` naming and the audit mapping checks to owning references instead of copying rules; standalone copies with a named source and an automated drift guard (not replaced by links to files the consumer lacks).
- Deltas: guarded standalone mirrors are not duplicate ownership, and distinct rules with similar wording are not duplication, but an unguarded restatement of an owned rule is, even when the copies agree. Trace each conflict to the agent decision it changes.

## D. Actionability and proportionality

Rules: `skill-design` reference `writing.md`.

- Evidence: each instruction states when it applies, its scope and prerequisites, and what to do when blocked or a prerequisite is missing; imperative steps with a one-clause reason instead of all-caps commands; rules generalized from examples rather than one patch per example; output formats as a template plus one example; constraints placed in the step they govern, with cross-step constraints stated once before step 1; workflow steps name the reference to load and when; ambiguous or unmeasurable wording an agent could read two ways; non-skill instruction files (`AGENTS.md`) held to the same ownership and writing rules, with workflow steps for intent capture, rule placement, anatomy, scenario checks, and consumer updates applied proportionately; extension of an existing skill preferred over a new one unless the trigger or workflow is distinct; `Output` skill note items (skill, ownership, files, verification) without repeated change summaries or pasted rule text; application code and `scripts/` internals kept out of scope. Check fix authorization against `SKILL.md` workflow step 4; an audit request alone does not authorize edits.
- Deltas: walk counterexamples from the instruction's own domain and exceptions (for design rules: a flat input/output script, a data-only transfer object, a closed union switch, a failed lookup versus absence), plus an unavailable prerequisite. A rule that forces speculative work in a counterexample is a finding.

## E. Progressive disclosure

Rules: `skill-design` reference `writing.md`.

- Evidence: always-loaded text (`AGENTS.md`, names, descriptions) limited to triggers and repository deltas; `SKILL.md` an entry point (workflow, output, routing) with detail in on-demand references split by concern; repeated deterministic work moved to `scripts/`; budgets met without dropping meaning.
- Deltas: a budget overrun is a symptom; report its root cause, such as duplication or misplaced detail.

## F. Verification

Rules: `skill-design` reference `evaluation.md`.

- Evidence: reference targets, prerequisites, and documented commands exist and match repository evidence; evaluation sets stored outside the shipped skill folder and iteration stopped once results match `Output`; consumers of a changed contract updated (dependent skills, `AGENTS.md`, install docs, guards, version metadata); captured intent (what the skill enables, requests that should and should not load it, output, prerequisites); scenario sets (2-3 requests per branch, near misses, blocked paths) with walks and fixes of the instructions rather than the scenarios; comparative or baseline runs where behavior changed, with assertions written before results and transcripts read; guards cover anatomy, links, budgets, and mirrors. For skill targets, check the execution evidence and HTML report completion gate in `SKILL.md` workflow steps 3 and 6, including audit-only requests; verify the generated artifact includes every executed evaluation and its grades and the final response links to it, rather than checking instruction text alone. Distinguish executed evaluations from scenario walks and mark unavailable or unrun checks unverified.
- Deltas: demand a guard only where drift is costly or already occurred, not for every sentence. Do not demand comparative runs for a wording-only change.

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

For every audit report, including no-findings reports and requests that do not ask for scoring, score each criterion 0 (absent or conflicting), 1 (partial), or 2 (complete in the audited scope); the total is out of 10. Tie deductions to confirmed findings and keep criteria unchanged for before/after scores. A prerequisite-blocked notice follows the non-numerical status in `SKILL.md` instead.

| Criterion       | Evidence for 2 points                                                                                                                                 |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Consistency     | No unresolved conflicts across canonical rules and consumers; every skill follows the anatomy.                                                        |
| Ownership       | One owner per rule; consumers link to it, and justified standalone copies have drift guards.                                                          |
| Actionability   | Clear triggers, prerequisites, scope, evidence requirements, and failure/blocked paths.                                                               |
| Proportionality | Rules honor style exceptions and present needs; counterexamples do not force speculative work.                                                        |
| Verification    | Relevant reference/metadata/mirror checks and scenario or comparative evaluations pass; state any remaining limits and confirm fixes were authorized. |

An unresolved confirmed finding prevents full marks in its affected criterion. Unverified relevant areas make the score provisional; 10/10 means no identified gap within the stated scope, not universal perfection or proof from lint alone.

End the scoring report with **Total score: ?/10**, replacing `?` with the sum of the five criterion scores; mark it provisional when applicable.
