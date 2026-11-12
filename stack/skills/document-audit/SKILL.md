---
name: document-audit
description: "Audit, review, and score project documentation, including README files, guides, and ADR, RFC, or PDR records, for accuracy, completeness, usability, and consistency. Use when users ask to review, assess, audit, or fix docs, including those records, even without naming Makespec. Requires the `document-design` and `makespec` skills."
license: MIT
metadata:
    author: adbayb
    repository: adbayb/stack
    requires:
        - "document-design >=1.0.0"
        - "makespec >=1.0.3"
    version: "1.0.0"
---

# Document Audit

Audit project documentation against its purpose and the rules owned by `document-design`. Application code is out of scope; in mixed changes, assess only the documentation and claims relevant to it. `document-design` owns documentation rules, `makespec` owns record structure and lifecycle, and this skill owns audit evidence, severity, scoring, and fix policy. Repository rules override both prerequisites, which take precedence in their respective domains.

## Prerequisite

`document-design` and `makespec` are required at the versions declared by `metadata.requires`. The `makespec` binary must also be available on `PATH`. If any prerequisite is unavailable or incompatible, stop before auditing and ask the user to install or update it:

```bash
pnpm dlx skills add adbayb/stack --skill document-design -g
pnpm dlx skills add adbayb/makespec --skill makespec -g
```

Install the Makespec binary from a release or from a Makespec checkout:

```bash
cargo install --path . --locked
```

Do not install without explicit approval. After approval, load both skills, confirm their frontmatter `metadata.version` values satisfy `metadata.requires`, and verify `makespec --version` succeeds. See the [Makespec README](https://github.com/adbayb/makespec#1-install-the-binary) for release-binary instructions. Do not continue with partial prerequisites.

## Workflow

Never edit documents during an audit-only request. Do not change decisions, specifications, or application code as part of a document fix.

### 1. Scope

- Confirm the requested documents and intended audience or task. Read each in scope fully, plus only directly relevant records, sources, instructions, and project context.
- Establish the verification baseline using applicable documented checks. Record unavailable sources and checks before assessing claims.

### 2. Detect

- Read `references/checklist.md` for the audit dimensions, evidence threshold, severity, and scoring.
- Load `document-design` reference `writing.md` for evidence and usability, and `document-design` reference `readme-template.md` for README structure. Apply only relevant references.
- Whenever the request mentions or covers an ADR, RFC, `PDR`, or other Makespec record, use the `makespec` skill for record structure and lifecycle validation, even if the user does not name Makespec. Report its results separately from documentation findings.
- Trace material claims, links, examples, and commands to their sources. For every in-scope checklist item, record a finding, checked-clean evidence, or an inapplicability reason. Treat unsupported suspicion as an investigation question, not a confirmed finding.

### 3. Report before fixing

- Present findings using `Output`. If the request is audit-only, stop after the report.
- Fix only when requested. Ask before deleting documentation, changing accepted records, or broadening the audited scope.

### 4. Fix and verify

- Correct only confirmed documentation defects in scope; preserve intended meaning and clearly distinguish facts, accepted commitments, proposals, and assumptions.
- Re-run applicable checks, recheck changed claims and links, then report fixes, what remains, verification results, coverage, and updated scores.

## Output

```markdown
## Audit findings

| #   | Location          | Severity | Dimension                     | Issue                                                                                                                 | Solution                              |
| --- | ----------------- | -------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| 1   | `README.md#usage` | Major    | C. Structure and completeness | The documented command is absent from the inspected package scripts, so readers cannot follow the setup instructions. | Replace it with the verified command. |

Totals: <Blocker>, <Major>, <Minor>. Coverage: <dimensions checked, skipped, and why>.
Verification: <checks and limits>.
Scores: <A-F criterion scores>.
**Total score: <score>/10**
```

For no findings, say so and still report coverage and scores. Explain unconfirmed questions separately. When fixing, close with the changes, remaining items and reasons, and verification results before the updated score.

## Example

**Request:** "Review this README for inaccurate install steps and fix them."

**Response:** Findings identify each inaccurate step with source evidence and severity; requested fixes replace only unsupported commands. The report lists applicable checks, remaining gaps, per-dimension scores, and the updated total.
