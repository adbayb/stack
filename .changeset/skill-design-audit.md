---
"@adbayb/stack": minor
---

Add the `skill-design` and `skill-audit` Agent Skills, and rename `code-audit` to `software-audit`, so each domain pairs a `<domain>-design` rule owner with a `<domain>-audit` skill:

- `skill-design` owns one anatomy for every skill (frontmatter, section order, numbered workflow, `Output` and `Example` sections, size budgets), the trigger and writing rules, and scenario checks, aligned with the Agent Skills specification.
- `skill-audit` audits and scores skills and agent instructions such as `AGENTS.md` against `skill-design`, with its own evidence, severity, and scoring guide; edits requested outside its report stay with `skill-design`.
- Reinstall `software-audit` with `pnpm dlx skills add adbayb/stack --skill software-audit -g` and remove the old `code-audit` install.
- Move the instruction ownership rules from `software-design` to `skill-design`, and the instruction scoring rubric and counterexamples from `code-audit` to `skill-audit`. `software-audit` now covers code and pull requests only and gains `Output` and `Example` sections.
- Rename every skill's `Output contract` section to `Output`, defined once in the anatomy as what the agent returns when done; response templates stay there, and `assets/` holds only files a skill copies into its results.
- Keep skills independent: each skill mentions only itself and its declared prerequisite, states scope boundaries by artifact instead of routing to sibling skills, and each audit lists the files it leaves out of scope as unaudited.
- `software-audit` scores the in-scope dimensions by default, and `software-design` loads its naming convention before new names are chosen.
- Simplify both audit findings tables to `#`, `Location`, `Severity`, `Issue`, and `Solution`: each issue names the rule, then the evidence and its consequence, and confidence moves to the verification limits.
- Drop the optional `Rules` section from the anatomy: each constraint lives in the workflow step or `Output` section it governs, and constraints spanning every step are stated once before step 1.
- Give `skill-design` a lighter path for instruction files that are not skills, such as `AGENTS.md`: place each rule and run the repository's instruction checks, and walk requests only when the change alters which skill loads. `software-design` leaves agent instructions out of scope except as consumers of a changed code contract, and `skill-design` leaves application code out of scope, including the code inside skill scripts.
- Let the `skill-design` evaluation reference alone scale checks to risk, so new skills and changed triggers or workflows get trigger checks or comparative runs, and set `metadata.requires` to the lowest prerequisite version that provides every relied-on rule.
- Guard the shared anatomy and skill independence for every skill, and apply the prerequisite, reference mapping, severity, findings table, and README checks to both audit skills.
