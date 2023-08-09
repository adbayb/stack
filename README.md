<div align="center">
    <h1>🦦 Stack</h1>
    <strong>My opinionated environment to ease project building</strong>
</div>
<br>
<br>

The mono-repository includes:

## 💿 Binaries

-   [Stack](./stack)
-   [NPM initializer](./packages/create)

## 🏗️ Configuration presets

-   [Linting](./packages/eslint-config)
-   [Formatting](./packages/prettier-config)
-   [Typing](./packages/ts-config)

## ✅ TODO

-   [ ] Check if it's ok to have `commitlint`, `eslint`, ... as dependencies in `@adbayb/scripts` by removing monorepo root dev dependencies
-   [ ] Update `@adbayb/stack` to make `tsc` check feasible on git hooks (via eslint-plugin-tsc?)
-   [ ] Update `@adbayb/stack` to lint packages (caret range for dependencies and strict ones for dev dependencies)
-   [ ] Deprecate and remove `@adbayb/scripts` package
-   [ ] Clean scripts and root package.json after publishing the v1
