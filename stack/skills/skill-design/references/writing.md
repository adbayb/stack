# Writing Rules

What to write and where it lives. `anatomy.md` owns the file shape; `evaluation.md` owns scenario and trigger checks.

## Ownership

- Give each rule one canonical owner. Put repository commands and overrides in `AGENTS.md`; skill workflow, output, and internal precedence in `SKILL.md`; detailed rules in the owning skill's reference; audit evidence, severity, and scoring in the audit skill's checklist. Link to the owner instead of restating its rule.
- Keep cross-reference summaries non-normative. Edit the owner first, then update its consumers; when the contract changes, update version metadata per the repository's versioning rule.
- Split skills by trigger and workflow, not by size: a rule-owning skill holds the rules; a procedure skill, such as an audit, declares it as a prerequisite and maps each check to the owning reference instead of copying rules. Name such a pair by one domain and each role (`<domain>-design`, `<domain>-audit`), so related skills read as a family.
- Mention only the skill itself and its declared prerequisites, so each skill installs and runs alone. State scope boundaries by artifact (for example, "application code is out of scope"), not by sibling skill; skill descriptions and repository files such as `AGENTS.md` route between skills.
- Keep copied instructions only when consumers need standalone artifacts, such as generated repositories. Name the canonical source and guard shared sections against drift with an automated comparison; do not replace required standalone text with links to files the consumer will not have.

## Descriptions and triggers

- The name and description are all an agent sees before choosing a skill. State the capability, then "Use when" or "Use whenever" with the tasks, artifacts, and phrasings that should load it, including requests that never name the skill.
- Lean toward triggering: agents tend to skip skills, so name adjacent requests that still need it. Target substantive work; agents answer trivial one-step requests without any skill.
- Put all when-to-use information in the description; the body is read only after loading. State out-of-scope artifacts in the body intro.
- End with "Requires the `<prerequisite>` skill." when a prerequisite exists.

## Body

- Make each instruction actionable: state when it applies, its prerequisites and scope, and what to do when blocked or a prerequisite is missing.
- Write imperative steps. Explain the reason behind a constraint in one clause instead of all-caps commands, so agents can handle cases the rule did not foresee.
- Generalize from examples: write the rule the examples share, not one patch per example.
- Route instead of repeating: each workflow step names the reference to load and when.
- Show output formats as a template plus one example.
- No surprises: a skill does only what its description says; never hide network calls, data collection, or steps that bypass user approval.

## Progressive disclosure

- Always-loaded text (`AGENTS.md`, skill names and descriptions) carries only triggers and repository deltas.
- `SKILL.md` stays an entry point (workflow, output, routing); detailed rules live in on-demand references split by concern.
- Meet enforced size budgets by removing duplication, not required meaning.

## Verification

- Verify local reference targets, prerequisites, and documented commands against repository evidence.
