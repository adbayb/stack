# Evaluation

Check a skill against realistic requests before shipping a change. Scale effort to risk: a wording fix needs a scenario walk; a new skill, a changed trigger, or a changed workflow also needs trigger checks or comparative runs.

## Scenario set

- Write 2 or 3 realistic requests per workflow branch, phrased the way users ask: concrete paths, partial context, casual wording.
- Add near misses: requests that share vocabulary but belong to another skill or to no skill.
- Cover each blocked path: missing prerequisite, missing input, and out-of-scope target.
- Store reusable sets outside the shipped skill folder (for example `evals/evals.json` in a workspace) so installs stay lean.

## Scenario walk

For each request, read only what an agent would load (description, then `SKILL.md`, then routed references) and record:

- Trigger: the request loads the skill; the near miss does not.
- Route: each step names an existing reference and when to load it.
- Outcome: following the steps produces the response the `Output` section defines, without speculative work.
- Blocked paths: the skill says when to stop and what to ask.

Fix the instructions, then walk again.

## Comparative runs

When behavior matters (a new skill, a changed workflow, or a disputed result), run each request with the skill and with a baseline (no skill, or the previous version) in fresh contexts.

- Write objective assertions before reading results; leave subjective qualities to human review.
- Read transcripts, not only outputs: remove instructions that cause wasted work, and move helpers that every run rewrites into `scripts/`.

## Trigger checks

For a new or changed description:

- Draft about 20 substantive queries: half should load the skill, half are near misses sharing its vocabulary.
- Tune the description on part of the set and judge it on the held-out rest, so it does not overfit.
- Change the description, not the queries, until should-trigger queries load the skill and near misses do not.

## Iterate

Stop when results match the `Output` section, feedback is empty, or revisions stop improving results. Keep each revision lean.
