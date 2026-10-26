---
name: skill-audit
description: "Audit and score agent instructions: Agent Skills (SKILL.md, references, frontmatter, descriptions) and instruction files such as AGENTS.md, including pull request and diff reviews. Use when asked to review, audit, score, or assess skills or engineering instructions for duplication, single source of truth, rule ownership, conflicting precedence, trigger quality, anatomy drift, actionability, or size budgets. Execute skill-creator evaluations for skill targets; report findings before fixes. Requires the `skill-design` and `skill-creator` skills."
license: MIT
metadata:
    author: adbayb
    repository: adbayb/stack
    requires:
        - "skill-design >=1.0.0"
        - "skill-creator"
    version: "1.0.0"
---

# Skill Audit

Audit agent instructions against `skill-design`, report findings first, then fix with minimal blast radius. The prerequisite owns the instruction anatomy and writing rules; this skill owns audit procedure, evidence, severity, scoring, and fix policy. Repo rules override both, and the prerequisite wins over this skill on rule conflicts. Application code is out of scope: in mixed changes, audit only the instruction files and the claims they make about code.

## Prerequisite

`skill-design` and `skill-creator` are required by the `metadata.requires` array; version bounds apply where declared. If either skill is unavailable, or a declared bound is not met, stop before auditing and ask the user to install or update the affected prerequisite:

```bash
pnpm dlx skills add adbayb/stack --skill skill-design -g
pnpm dlx skills add anthropics/skills --skill skill-creator -g
```

When this gate fails, return only a prerequisite notice: identify what is unavailable or incompatible, state the required version or missing reference when applicable, ask the user to make it available, and include **Score: not assessed (prerequisite blocked)**. Do not report target findings, assign a numerical score, or continue with a partial audit. Never install without explicit approval. After approval, load the prerequisite and confirm the `skill-design` version satisfies `metadata.requires`, `skill-creator` is available, and every mapped reference exists before resuming. If any check still fails, stop and report the incompatibility.

`metadata.requires` is a lower bound: if a reference mapped here is missing from the installed `skill-design`, stop and report the incompatibility.

## Workflow

Never run installs, publishes, or releases while auditing, except installing or updating explicitly approved prerequisites with the commands above.

### 1. Scope

- Confirm the target (skills, `AGENTS.md` files, other agent instruction files, or a diff touching them) and non-goals; keep the scope bounded but audit everything inside it exhaustively, slice by slice for a broad target.
- Map the instruction graph: always-loaded files, skill descriptions, `SKILL.md` routes, references, prerequisites, and standalone copies with their guards.
- Run the repository's instruction checks (skill and template tests) to establish a baseline; record checks that cannot run.

### 2. Detect

Read `references/checklist.md` for the dimension map, evidence, severity, and scoring. Load only the mapped `skill-design` references in scope, apply their rules first, then the audit deltas.

**Exhaustive depth.** A shallow pass is a failed audit. Read every in-scope file in full and run each dimension's evidence prompts against each file. For every Evidence bullet in `references/checklist.md`, record a finding, a "checked, clean" note with the evidence examined, or an inapplicability reason. Report every distinct root cause, including Minors and Unverified gaps (kept out of scoring), then sweep each dimension once more for missed items before reporting. Do not pad: each row needs evidence and an owning rule.

Trace each rule to its owner and every consumer: skills, `AGENTS.md` files, templates, docs, and tests. Walk the checklist counterexamples through the text.

Record each finding as an `Output` table row, grading severity and confidence with `references/checklist.md`. If no rule matches, report a gap and propose a rule for its canonical owner instead of inventing one.

### 3. Evaluate skill behavior

- For every skill target, including audit-only requests, load `skill-creator` and `skill-design` reference `evaluation.md`; execute representative evaluations using `skill-creator`. Loading the prerequisite, scenario walks, and repository checks do not substitute for executed runs.
- Before running evaluations, track generating and verifying the HTML report as a separate task. After grading, use `skill-creator`'s `eval-viewer/generate_review.py` to generate the report; use its static HTML mode when a browser/server is unavailable.
- Write prompts and assertions before running; retain them with outputs, grading results, and available execution transcripts in a session workspace outside the shipped skill. Use fresh contexts and paired baseline runs for new skills, behavior changes, or disputed results; ordinary unchanged-skill audits still require executed evaluations.
- If execution is unavailable or fails, report the blocker and mark the audit incomplete; do not substitute a claimed success or install tools without approval.

### 4. Report before fixing

Present the `Output` section's report before editing. If the request is audit-only, stop there. Otherwise, ask whether the user approves the proposed fixes before starting; an explicit request to fix identified issues authorizes fixes only within that stated scope. Ask separately before expanding scope or making destructive changes not explicitly authorized.

### 5. Fix with minimal blast radius

- Fix only present gaps: add no skills, sections, or rules unless a finding requires them; removing duplicated text is in scope.
- Fix Blockers first, then Majors. Fix cheap Minors in touched files as a separate change; park the rest in the report. Do not create a commit unless asked.
- Fix order: delete duplicated or conflicting text while keeping the canonical owner; link consumers to it; repair triggers and routes; then tighten wording.
- Edit the owner first, then consumers, guards, and version metadata per the repository's versioning rule.
- Keep changes to triggers, workflows, or prerequisites separate from wording cleanups.

### 6. Verify

- Re-run the baseline checks, then the checks that `skill-design` reference `evaluation.md` requires for the fixes.
- Re-scan touched files against `references/checklist.md`; no new violations. Mark blocked checks as unverified; never claim a clean audit from a partial scan.
- Before declaring a skill audit complete, confirm step 3 has saved execution evidence and an HTML report containing every executed evaluation and its grades; open the report when possible and include its link or path in the final response. Missing evidence, failed generation, or missing evaluations/grades means an incomplete audit, even when there are no findings or edits. If opening fails, provide the HTML link or path and state the limitation.

## Output

```markdown
## Audit findings

| #   | Location       | Severity | Criterion(s) | Issue                                                                     | Solution                      |
| --- | -------------- | -------- | ------------ | ------------------------------------------------------------------------- | ----------------------------- |
| 1   | `AGENTS.md:42` | Major    | Ownership    | One owner: two files state conflicting bump rules, so agents apply either | Keep one owner and link to it |
```

For each finding, name the scoring criterion or criteria it affects. Write each Issue as one sentence: the owning `skill-design` rule, then the contradicting text and the agent decision it changes; cite the rule instead of pasting its prose. Keep each Solution to a fix direction.

Then totals by severity, a per-dimension coverage line (findings or checked-clean evidence), reviewed and skipped dimensions, unaudited out-of-scope files, verification limits (Supported rows and Unverified gaps), evaluation evidence location and results with the HTML report link or path (or an incomplete status and blocker), and a recommended fix order that highlights the highest-leverage fixes without limiting the findings table. Always include the five criterion scores and **Total score: ?/10** using `references/checklist.md`, even when scoring was not requested or there are no findings; mark incomplete verification provisional. No findings: say so and skip fixes; do not invent work. When fixing, close with what changed per owner, what was left and why, verification results, and the updated score.

## Example

Request: "Audit and score our skills."

- Findings: 1 Major (a dependent skill restates a rule its prerequisite owns, and the copies conflict), 1 Minor (a reference is not linked from `SKILL.md`).
- Criteria: Consistency 1/2, Ownership 1/2, Actionability 2/2, Proportionality 2/2, Verification 2/2.
- **Total score: 8/10** (provisional because trigger checks did not run).
- Evaluation: representative runs passed; prompts, assertions, outputs, and grades saved in the session workspace; trigger accuracy remains unverified.
- Fix order: first delete the restated rule and link the owning reference.
