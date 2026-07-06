<br>
<div align="center">
    <h1>@adbayb/stack/oxfmt</h1>
    <strong>My opinionated formatting standards</strong>
</div>
<br>
<br>

## ✨ Features

This package offers opinionated but extensible **[Oxfmt](https://oxc.rs/docs/guide/usage/formatter.html)** configurations to align code formatting conventions across projects.

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

Create a `oxfmt.config.ts` file and include the following:

```ts
export { default } from "@adbayb/stack/oxfmt";
```

<br />

## 🤷‍♂️ Questions

### The tab size takes too much space, how to reduce it?

If you feel that tabbed indentation rendered on the GitHub web interface takes up too much (by default, most browsers display a tab character as 8 spaces), you can either:

- Edit your [GitHub profile appearance settings](https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-personal-account-on-github/managing-user-account-settings/managing-your-tab-size-rendering-preference).
- Add (or update) a `.editorconfig` file at the root level to customize the tab size display on the GitHub interface.

```yaml
root = true

[*]
indent_size = 2 # Depending on your tab indentation size preference.
```

<br />
