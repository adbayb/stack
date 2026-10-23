---
name: skill-design
description: "Design and write Agent Skills and the agent instructions that route to them, so every skill follows one anatomy and one set of writing rules. Use whenever creating or editing a skill (SKILL.md, references, scripts, frontmatter, or description), turning a workflow into a skill, splitting or merging skills, or editing agent instruction files such as AGENTS.md, even for a small trigger, step, or rule tweak. Owns skill anatomy, trigger writing, rule ownership, progressive disclosure, and scenario checks."
license: MIT
metadata:
    author: adbayb
    repository: adbayb/stack
    version: "1.0.0"
---

# Skill Design

Design and write skills with one shared anatomy, and all agent instructions, including files such as `AGENTS.md`, with one set of writing rules. This skill owns how instructions are shaped, worded, placed, and checked, including which work moves to a skill's `scripts/` and how `SKILL.md` calls it; domain rules stay with the skills that own them. Application code, including the code inside `scripts/`, is out of scope. Repo rules override this skill; references win over this file on rule conflicts.

## Workflow

Follow in order; skip a step only with a stated reason. For an instruction file that is not a skill, such as `AGENTS.md`, run steps 2 and 5, plus steps 1 and 4 when the change alters which skill a request loads. When updating a skill, keep its name and folder. Ask when a wrong guess is costly; otherwise choose the sensible default and state it.

### 1. Capture intent

- Extract what the conversation already shows (steps, corrections, inputs, outputs) before asking; when updating, capture only what the change affects.
- Settle what the skill enables, which requests should and should not load it, its output, and its prerequisites.
- Collect 2 or 3 realistic requests it must handle and 1 near miss it must ignore.

### 2. Place every rule

- Load `references/writing.md`; give each new or changed rule one canonical owner before drafting.
- Extend an existing skill when the request fits its trigger and workflow; create a skill only for a distinct trigger or workflow.

### 3. Write to the anatomy

- Load `references/anatomy.md`; write the frontmatter, then the body sections in the shared order.
- Keep `SKILL.md` a router: detailed rules go to references, repeated deterministic work to `scripts/`, and files the skill copies into its results to `assets/`.

### 4. Check the scenarios

- Load `references/evaluation.md` and run the checks it scales to the change, starting with a walk of each captured request and near miss through the description, workflow, and routed references.
- Fix the instructions, not the scenarios, until every walk ends with the response the `Output` section defines.

### 5. Validate and update consumers

- Run the repository's instruction checks (for example skill frontmatter, links, budgets, and glyphs, or mirrored `AGENTS.md` copies) and fix every failure; without such checks, verify the changed files against the loaded references by hand and say so.
- Update consumers of a changed contract: dependent skills, `AGENTS.md` files, install docs, guards, and version metadata per the repository's versioning rule.

## Output

Close with a short skill note; omit unchanged items.

- Skill: name, trigger summary, and why it is new or an extension.
- Ownership: rules added, moved, or linked, each with its canonical owner.
- Files: skill files and consumers touched.
- Verification: scenario walk results and checks that ran; list anything unverified.

Do not repeat the change summary or paste rule text.

## Example

Request: "Turn our release checklist into a skill."

- Skill: `release-check`; loads for release preparation and changelog review, not for routine version bumps.
- Ownership: release commands stay in `AGENTS.md`; the skill links to them and owns only the checklist workflow.
- Files: `release-check/SKILL.md` with one checklist reference, plus the install docs.
- Verification: 3 requests and 1 near miss walked; 20 trigger queries route as intended; skill checks pass.

## Missing rule?

If a rule is missing or ambiguous, report the gap and follow `references/sources.md`.
