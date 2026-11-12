# Documentation Audit Checklist

Audit every in-scope document fully. For each Evidence bullet, record a finding, checked-clean evidence, or why it does not apply. Each `Rules:` line maps the check to its canonical `document-design` owner.

## A. Accuracy and evidence

Rules: `document-design` reference `writing.md`.

- Evidence: claims supported by inspected implementation, configuration, sources, or accepted records; proposals distinguished from commitments; assumptions labeled; cited sources actually read; no fabricated evidence, measurements, behavior, approval, or status. When an ADR, RFC, `PDR`, or other Makespec record is in scope, use the `makespec` skill for record status and format validation.
- Deltas: unsupported claims require a concrete contradiction or missing source; do not deduct merely because a document lacks citations when its factual basis is clear in scope.

## B. Purpose, audience, and scope

Rules: `document-design` reference `writing.md`.

- Evidence: intended reader and task are clear; document covers the requested scope without unrelated filler; prerequisites, steps, and outcomes support the task; scope does not imply authorization for unrequested decisions or implementation.
- Deltas: assess the document's stated audience and purpose, not an imagined broader readership.

## C. Structure and completeness

Rules: `document-design` reference `writing.md` and `document-design` reference `readme-template.md`.

- Evidence: sections fit the artifact and established template; required content is present; README headings and order follow the chosen template; adapting content preserves the source's intended meaning; placeholders, stale scaffold text, and missing non-optional content are identified. Delegate ADR, RFC, `PDR`, and other formal Makespec record structure checks to the `makespec` skill.
- Deltas: a template mismatch is not a finding when an explicit user or repository template takes precedence; when a section is inapplicable, check that the document says so instead of silently omitting it.

## D. Usability and navigation

Rules: `document-design` reference `writing.md` and `document-design` reference `readme-template.md`.

- Evidence: headings, sequence, examples, terminology, and expected results help readers complete the task; local links resolve; commands and examples are distinguishable from placeholders; related requirements link to their owning records.
- Deltas: report only reader-impacting navigation or clarity issues, not stylistic preferences.

## E. Consistency and maintenance

Rules: `document-design` reference `writing.md` and `document-design` reference `readme-template.md`.

- Evidence: terms and claims align with relevant documents and accepted records; duplicated details link to a source of truth; links, package names, contribution guidance, and license match inspected project evidence; conflicting records are surfaced, not silently reconciled.
- Deltas: distinguish a concrete contradiction or drift path from harmless wording variation.

## F. Validation and change scope

Rules: `document-design` reference `writing.md` and `document-design` reference `readme-template.md`.

- Evidence: relevant documented checks were run when available; check results and unverified claims are stated accurately; use the `makespec` skill for formal record lifecycle checks; fixes affect only requested documentation and do not change record status or application behavior.
- Deltas: no CLI or check is required for prose-only documents when no applicable validator exists; report unavailable validation rather than implying success.

## Severity

Assign severity by demonstrated reader impact. Blocker: dangerous or irreversible instructions, or a core document unusable for its stated task. Major: a materially false instruction, commitment, or required step likely to mislead readers. Minor: local clarity, completeness, navigation, or maintenance defect without material impact.

## Evidence and scoring

Cite each finding's location and supporting source. State whether the issue was reproduced, traced without execution, or left unconfirmed. Keep investigation questions separate from findings and do not score unconfirmed suspicions.

Score A-F from 0 (absent or conflicting) to 2 (complete in the audited scope). Each unresolved confirmed finding lowers an affected dimension. Calculate `sum / 12 * 10`, rounded to one decimal, and state that the score is a qualitative judgment; incomplete relevant verification makes it provisional. End with **Total score: ?/10**.
