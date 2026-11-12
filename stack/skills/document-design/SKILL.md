---
name: document-design
description: "Create or update project documentation and missing READMEs using the embedded template; delegate ADR, RFC, PDR, and Makespec record work to its skill. Use when users ask to write or improve docs or README files, or mention or request an ADR, RFC, PDR, or Makespec record, even without naming Makespec. Requires the `makespec` skill."
license: MIT
metadata:
    author: adbayb
    repository: adbayb/stack
    requires:
        - "makespec >=1.0.2"
    version: "1.0.0"
---

# Document Design

Create project documentation grounded in inspected sources. Application code and documentation audits are out of scope. This skill owns general writing rules and README creation; the `makespec` skill owns formal decision and specification records. Repository rules override this skill, and its references win over this file on documentation-rule conflicts.

## Prerequisite

The `makespec` skill is required at the version declared by `metadata.requires`, and the `makespec` binary must be available on `PATH`. If either is missing or incompatible, stop before creating documentation and ask the user to install or update it. Do not install anything without explicit approval.

Install the skill globally with:

```bash
pnpm dlx skills add adbayb/makespec --skill makespec -g
```

Install the binary from a Makespec release as documented in its [README](https://github.com/adbayb/makespec#1-install-the-binary), or build it from a Makespec checkout:

```bash
cargo install --path . --locked
```

After approval, load the skill, confirm its frontmatter `metadata.version` satisfies `metadata.requires`, and verify `makespec --version` succeeds. The alternative `makespec init` installs the skill locally but also creates record directories and an adoption decision; do not run it without explicit approval. Do not continue with partial prerequisites. A missing mapped reference is an incompatibility to report, not a reason to recreate Makespec guidance here.

## Acronym glossary

- **AI**: Artificial Intelligence.
- **ADR**: Architecture Decision Record.
- **ASCII**: American Standard Code for Information Interchange.
- **CLI**: Command-Line Interface.
- **ID**: identifier.
- **MUST / SHOULD / MAY**: Makespec requirement priority words.
- **RFC**: Request for Comments.
- **README**: readme file.

## Workflow

Follow in order. Load only the references needed for the requested artifact.

### 1. Establish purpose and sources

- Load `references/writing.md` for the shared prose rules and documentation-specific evidence and scope guidance.
- Inspect the target directory, relevant project instructions, existing documentation, and only the code or configuration needed to support the requested claims. Distinguish accepted commitments from proposals.

### 2. Choose the document route

- Whenever a request mentions or asks to write, review, or revise an ADR, RFC, `PDR`, or other Makespec record, load the prerequisite `makespec` skill, even if the user does not name Makespec. Delegate record structure, creation, editing, validation, status changes, and record interpretation to it. Do not duplicate its lifecycle or template rules.
- For a missing or rewritten README, load `references/readme-template.md`. Inspect repository-specific README sources when available.
- For other documentation, follow `references/writing.md` and any format already established by the project.

### 3. Draft the requested artifact

- State only supported facts; label assumptions and link relevant inspected sources. Preserve existing project terminology and avoid duplicating requirements owned by linked specifications.
- Keep the change limited to the requested document. Do not silently create decisions, specifications, or other documentation.

### 4. Validate and report

- Verify claims, local paths, links, commands, and examples against available sources. Run only documented checks that apply to the artifact; let the `makespec` skill perform record validation.
- If the Makespec skill, binary, or required project context is unavailable, stop the affected work and report the blocker rather than inventing a manual substitute. Report any checks not run.

## Output

State the files created or updated, the sources or assumptions that materially shaped them, and applicable validation results. Identify unresolved gaps and checks not run; omit unchanged items.

## Example

**Request:** "Add a README for `libraries/api` using the embedded template."

**Response:** Created `libraries/api/README.md` using the embedded template, with package usage and architecture grounded in the inspected manifest and source. No unsupported features were added; links and commands were checked against the repository.

## Missing rule?

If a documentation rule is missing or ambiguous, report the gap and consult `references/sources.md` for non-normative sources.
