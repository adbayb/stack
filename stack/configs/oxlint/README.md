<br>
<div align="center">
    <h1>@adbayb/stack/oxlint</h1>
    <strong>My opinionated linter standards</strong>
</div>
<br>
<br>

## ✨ Features

This package offers opinionated but extensible **[Oxlint](https://oxc.rs/docs/guide/usage/linter.html)** configurations to align logical and stylistic rules across projects.

It allows to:

- Make collaboration across my projects effective (including onboarding with a consistent look and writing patterns).
- Include a minimum viable and required set of rules to foster maintainable, testable, secure, and green code over time.
- Accelerate development by reusing common configuration and convention defaults.

<br />

## 🚀 Quick Start

### 1️⃣ Installation

At the root level of your project, run the following command:

```bash
pnpm add @adbayb/stack --save-dev --workspace-root
```

### 2️⃣ Usage

Create a `oxlint.config.ts` file and include the following:

```ts
export { default } from "@adbayb/stack/oxlint";
```

<br />
