# Documentation Writing

The writing rules below are copied from the Makespec skill's writing guide because they also apply to README files and general project documentation. Keep them aligned with that guide when updating either skill.

## Writing rules

Apply these rules to record content and planning prose. Preserve facts, technical meaning, required template syntax, IDs, comparison labels, and MUST/SHOULD/MAY priorities. Leave code, commands, paths, URLs, and quotations unchanged. Keep meaningful Unicode in names, localized text, and technical notation.

- Do not use em dashes (U+2014) or en dashes (U+2013) in authored prose. Use commas, periods, colons, or parentheses. Do not substitute spaced hyphens or double hyphens as sentence connectors; keep normal hyphenated terms.
- Use plain ASCII punctuation: straight quotes and apostrophes, ordinary spaces, and `...` if an ellipsis is needed. Avoid smart quotes, typographic ellipses, and decorative Unicode symbols.
- Remove accidental invisible characters, including zero-width spaces, nonbreaking spaces, soft hyphens, and byte order marks. Preserve intentional characters that carry meaning.
- Use plain Markdown bullets and sentence-case headings. Avoid decorative emojis, arrows, repeated horizontal rules, and bold labels on every list item. Keep required template formatting.
- Lead with the problem, decision, or required behavior. Remove document announcements, chatbot greetings, praise, offers to continue, and sign-offs such as "Great question", "Here's why", or "I hope this helps".
- Remove model-specific citation tokens, role tags, and drafting notes. Cite verified sources with Markdown links; retain explicit unknowns and template-supported open questions.
- Remove filler, redundant qualifiers, and empty emphasis such as "It's worth noting" or "really". Keep qualifiers that change requirement scope or behavior, such as "only" and "by default".
- Name the responsible actor or component and prefer active voice. State who rejects invalid input, retries an operation, or accepts a decision. Avoid giving documents or data human intentions.
- Make claims specific. Replace vague importance, performance claims, and unnamed expert opinions with concrete consequences, measurable requirements, or cited evidence. State missing evidence and uncertainty; do not invent facts, citations, or personal anecdotes.
- Use plain technical language. Remove sales language and stock phrasing such as "delve into", "game-changing", or "seamless". Keep specialized terms when they have a defined technical meaning.
- Avoid rhetorical questions, dramatic fragments, staged objections, formulaic "not X, but Y" contrasts, and forced three-item lists. Keep genuine comparisons, constraints, and distinct options regardless of their count.
- Vary sentence openings, length, and paragraph structure without padding or deliberate mistakes. Cut slogans, punchy closing lines, repeated conclusions, and explanations the reader already has.

Before finishing, check punctuation and hidden characters, then reread for repetition and unsupported claims. Confirm that edits preserve actors, negation, scope, numbers, evidence, and requirement strength. Judge clarity and accuracy; do not claim human authorship or guaranteed AI-detector results.

## Applying the rules to project documentation

- Identify the intended reader, task, and scope. Prefer the shortest document that lets the reader complete that task.
- Read relevant source files, configuration, commands, and existing documentation before making claims. Do not infer implemented behavior from a proposal, filename, or example.
- Separate observed facts, accepted decisions, proposals, and assumptions. Label assumptions when they materially affect the document.
- Link to authoritative sources and nearby documentation instead of copying details likely to drift. Do not claim a link, command, option, or behavior was checked unless it was.
- Put prerequisites before steps that need them, order procedures as performed, and put expected results near the relevant action.
- Make links descriptive and relative for repository-local targets. Verify local targets and distinguish placeholders from literal example values.
- Edit only the requested documentation and directly necessary links. Do not alter source behavior or create records, policies, or decisions without authorization.
- For content derived from a Makespec record, load the `makespec` skill; cite only records it inspected and preserve their status.
- Check factual claims, paths, links, commands, and examples. Run relevant documented documentation checks when available, and report what was not verified.
