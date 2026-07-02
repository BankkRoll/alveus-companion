# Contributing to Alveus Companion

Thanks for your interest in contributing! Here's what you need to know.

## Before you start

- For **bug fixes** and small improvements, open a PR directly.
- For **new features or larger changes**, open an issue first so we can discuss scope and approach before you invest time writing code.

## Setup

```sh
git clone https://github.com/BankkRoll/alveus-companion
cd alveus-companion
pnpm install
pnpm dev       # start dev build with hot reload
```

## Code style

- **TypeScript** — strict mode, no `any`, all types explicit at boundaries.
- **Comments** — JSDoc only on exported symbols where the _why_ is non-obvious. No filler comments, no AI-generated prose.
- **Tailwind** — v4 canonical classes only (`bg-linear-to-t` not `bg-gradient-to-t`, `min-h-15` not `min-h-[60px]`, etc).
- **Imports** — sorted per the Prettier config (`importOrder` in `package.json`). Run `pnpm format` before committing.
- **No new dependencies** without a good reason — keep the bundle small.

## Pull request checklist

- [ ] `pnpm typecheck` passes with no errors
- [ ] `pnpm lint` passes with no errors
- [ ] `pnpm build` produces a working extension
- [ ] Changes are scoped — one logical change per PR
- [ ] Commit messages are clear and describe _why_, not just _what_

## What not to do

- Don't add features outside the scope of an approved issue.
- Don't wrap working code in error handling that can't fail.
- Don't add comments that just restate what the code does.
- Don't introduce backend services, authentication, or databases — this is intentionally a fully client-side extension.

## Disclaimer

This project is not affiliated with or endorsed by Alveus Sanctuary.
