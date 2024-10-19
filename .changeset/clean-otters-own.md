---
"@adbayb/stack": minor
---

Update TypeScript config.

-   `moduleResolution` is now set to `Bundler` to allow `exports` package.json field resolution.
-   `target` and `module` are now set to `ESNext` to support, for example, syntaxes that can be used exclusively with `ESNext` module target (for example, import attributes). It should be fine since:
    -   Down leveling the bundled code for wider browser compatibility is a bundler responsibility, not a TS one.
    -   For server-side code, interpreting the code is a runtime responsibility (teams must use API compatible with their Node runtime).
