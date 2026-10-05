# Glass Calculator

A browser calculator with a glassmorphic theme, built with TypeScript, React, and hand-written CSS.

The backlog lives in [docs/backlog/epics.md](docs/backlog/epics.md).

## Prerequisites

- Node.js 22 or later (developed on 26)
- npm

## Getting started

```bash
npm install
npm run dev
```

## Scripts

| Command                 | What it does                                         |
| ----------------------- | ---------------------------------------------------- |
| `npm run dev`           | Start the dev server with hot reload                 |
| `npm run build`         | Type-check, then write a production build to `dist/` |
| `npm run preview`       | Serve the production build locally                   |
| `npm run typecheck`     | Run the TypeScript compiler without emitting files   |
| `npm run lint`          | Lint with oxlint; warnings fail the run              |
| `npm run format`        | Format every file with Prettier                      |
| `npm run format:check`  | Fail if any file is not formatted                    |
| `npm test`              | Run the test suite once                              |
| `npm run test:watch`    | Run tests in watch mode                              |
| `npm run test:coverage` | Run tests and print a coverage report                |
| `npm run test:e2e`      | Run Playwright browser tests against the build       |
| `npm run size`          | Fail if the built JavaScript exceeds 100 kB gzipped  |

## Project structure

```
src/
  engine/       Calculation logic in pure TypeScript
  state/        Input rules, history, memory and persistence
  components/   React UI components
  styles/       CSS, including design tokens
  test/         Test setup
e2e/            Playwright browser tests
docs/backlog/   Epics, stories, and acceptance criteria
```

`src/engine/` must not import React, UI code, or touch DOM globals. The lint configuration enforces this, so the engine can be tested and reused without a browser.

Tests sit next to the code they cover as `*.test.ts` or `*.test.tsx`.

The browser tests need Playwright's browsers, which are a separate download:

```bash
npx playwright install
```

## Keyboard

| Key                         | Action            |
| --------------------------- | ----------------- |
| `0`–`9`, `.`                | Enter a number    |
| `+` `-` `*` `/` `%` `^` `!` | Operators         |
| `(` `)`                     | Parentheses       |
| `Enter` or `=`              | Evaluate          |
| `Backspace`                 | Delete last entry |
| `Escape`                    | All clear         |
