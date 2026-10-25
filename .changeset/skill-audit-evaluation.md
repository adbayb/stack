---
"@adbayb/stack": patch
---

Improve skill audit evaluation and reporting:

- Require Anthropic's `skill-creator` alongside `skill-design` for `skill-audit`, document both installers, and stop without partial findings when prerequisites are unavailable.
- Evaluate skill behavior during audits and require authorization before applying fixes.
- Represent skill prerequisites as a `metadata.requires` array with optional version bounds.
- Require evidence of missing changed-behavior coverage before `software-audit` reports a test gap.
- End both audit scoring reports with a total score out of 10, marking provisional scores when applicable.
