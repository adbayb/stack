# Skill Anatomy

The shared shape of every skill. The Agent Skills specification is the floor; this file adds the house fields and section order. Where the repository has skill tests, they enforce this shape.

## Layout

```text
<name>/
  SKILL.md       entry point: frontmatter, workflow, output, routing
  references/    detailed rules loaded on demand, one concern per file
  scripts/       optional helpers for deterministic, repeated work
  assets/        optional files the skill copies into its results
```

- The folder name equals the frontmatter `name`.
- Link every reference from `SKILL.md` by its relative path, stating when to load it; keep references one level deep.
- Keep repository docs (readme, changelog, install guides) out of the skill folder.

## Frontmatter

```yaml
---
name: <name>
description: "<Capability>. Use when <triggers>. Requires the `<prerequisite>` skill."
license: <license>
metadata:
    author: <owner>
    repository: <owner>/<repository>
    requires:
        - "<prerequisite> >=<major>.<minor>.<patch>"
        - "<unversioned-prerequisite>"
    version: "<major>.<minor>.<patch>"
---
```

- `name`: at most 64 lowercase letters, digits, and single hyphens, with no leading or trailing hyphen.
- `description`: at most 1024 characters in a double-quoted scalar, so colons stay valid; write it per `writing.md`. Drop the "Requires" sentence when there is no prerequisite.
- `license`, `metadata.author`, and `metadata.repository`: always set, so installed copies stay attributable.
- `metadata.version`: a semantic version, bumped on contract changes per the repository's versioning rule.
- `metadata.requires`: optional nonempty array of hard prerequisite skill names, each optionally followed by `>=<major>.<minor>.<patch>`. Use the lowest version within the prerequisite's current major that provides every required rule and reference when it publishes version metadata; otherwise omit the bound. Declare all prerequisites in this array regardless of install source.
- Leave `compatibility` and `allowed-tools` unset unless a real environment or tool constraint exists.

## Body sections

Use these level-two headings in this order and no others; omit optional ones that do not apply. A fixed order lets agents and reviewers find the same part in every skill.

1. `# <Name In Title Case>`, then an intro paragraph: scope and out-of-scope artifacts, what the skill owns versus its prerequisite, and precedence (repository rules override the skill; then whether its references, its `SKILL.md`, or its prerequisite wins on rule conflicts).
2. `## Prerequisite`: exactly when `metadata.requires` is set.
3. `## Acronym glossary` (optional): expand each bare acronym once, in the skill that owns it; dependents reuse their prerequisite's glossary, and shared acronyms keep identical expansions.
4. `## Workflow`: steps as `### 1. <Step>`, numbered in execution order; each step names the reference to load and when. Put each constraint in the step it governs; state constraints that span every step once, before step 1.
5. `## Output`: what the agent returns when done, with required items, omissions, and any report template; keep response templates here, not in `assets/`.
6. `## Example`: one short request and the response its `## Output` section defines.
7. `## Missing rule?` (optional, rule-owning skills): report the gap and point at the skill's non-normative sources reference.

## Prerequisite section

State, in order:

1. Name each prerequisite in `metadata.requires` and explain that version bounds apply where declared; mention glossary reuse when relevant.
2. If a prerequisite is missing or too old for its declared bound, stop before doing the work and ask the user to install or update it.
3. Show each prerequisite's install command in a fenced block, using its verified source and the repository's documented installer.
4. Never install without explicit approval; after approval, install or load the prerequisite, verify its declared version when applicable, and resume. Never continue with partial work.
5. A mapped reference missing from an installed prerequisite is an incompatibility to report, not to work around.

## Budgets

- `SKILL.md` body: at most 100 lines, well below the specification's 500-line ceiling, so the entry point stays a router.
- Each reference: at most 100 lines; split by concern instead of growing a table of contents.
- Meet budgets by removing duplication or moving detail to a reference, never by dropping required meaning.
