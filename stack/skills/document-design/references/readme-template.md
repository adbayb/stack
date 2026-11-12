# README Structure

Use when creating a missing README or substantially reorganizing one. The portable starting point is [`../assets/README.template.md`](../assets/README.template.md).

## Choose the template

- Use the embedded asset by default unless a repository-specific template or the user's request takes precedence.
- If the target repository has an explicit local README template or the user provides one, adapt the asset to it rather than overwriting its conventions.
- The asset is a portable outline, not pre-verified project content. Inspect local documentation, source, configuration, and scripts to fill it.

## Adapt, do not copy blindly

- Preserve the template's headings and order unless the user or a repository-specific template explicitly takes precedence. Replace every placeholder with verified project content.
- Adapt the source content to fit the template while preserving its meaning, relevant facts, caveats, warnings, links, and intent. Reorganize or rephrase only as needed; do not discard information merely to make the README shorter or cleaner.
- Keep each template section. If a section truly does not apply or its content cannot be verified, say so briefly in that section rather than silently removing it or inventing content.
- Preserve the embedded template's emoji headings when using it; they are part of its required formatting.
- Do not copy claims, commands, links, dependencies, or architecture from the template into another project without verifying that they apply.
- Derive features from implemented behavior, usage from actual scripts or public interfaces, and architecture from inspected source and configuration. Include prerequisites and expected outcomes for procedures.
- Verify repository links, commands, package names, license, and examples. Do not invent a contribution process or license; state when the information is unavailable.
- When source content conflicts with the template or cannot be preserved without changing its meaning, retain the source meaning and report the conflict instead of silently rewriting it.
