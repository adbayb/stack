<br>
<div align="center">
    <h1>@adbayb/stack/typescript</h1>
    <strong>My opinionated TypeScript configuration preset</strong>
</div>
<br>
<br>

## ✨ Features

This package offers opinionated but extensible **[TypeScript](https://www.typescriptlang.org/tsconfig/)** configurations to align type checking and processing across projects.

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

Edit the `tsconfig.json` file to include the following:

```jsonc
{
	"$schema": "https://json.schemastore.org/tsconfig",
	"extends": "@adbayb/stack/typescript",
	"include": ["src"], // Depending on your project specificities
	"exclude": ["node_modules", "dist"], // Depending on your project specificities
}
```

The default configuration is versatile and suitable for all projects, whether back-end or front-end.

<br />
