# Language Conventions

The design principles in this skill apply across languages; code examples and ecosystem-specific practices do not.

- Identify the language and conventions from the files, manifests, toolchain, and existing code before designing a change.
- Treat example paths and identifiers as illustrations; render them using the target language's and project's module and naming conventions.
- Let the target language's and project's established naming conventions take precedence over literal examples and naming rules elsewhere in this skill. Preserve their intent, such as clear names and consistent verb semantics, but do not require specific English verbs, casing, signatures, or type syntax when they conflict with idiomatic conventions.
- Apply TypeScript/JavaScript-specific guidance in this skill only when the target project or touched code uses TypeScript or JavaScript. This includes file extensions and barrels, test filenames and runner APIs, type-checker syntax, optional-value semantics, and TSDoc/JSDoc according to the language and project convention.
- For other languages, follow the target project's established module/export, test, naming, and documentation conventions. If the project has no established convention, use idiomatic conventions for that language and ecosystem; do not translate TypeScript/JavaScript constructs literally.
- In a mixed-language project, apply conventions per language boundary and keep cross-language contracts explicit.
