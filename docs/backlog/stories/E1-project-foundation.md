# E1 — Project foundation: stories

**Epic goal:** A developer can clone the repo, install, run, test, and build with one command each.

## E1-S1 — Scaffold the application

As a developer, I want a Vite + React + TypeScript project in a git repository, so that I have a working starting point.

**Acceptance criteria**

- [x] The project directory is a git repository with a `.gitignore` that excludes `node_modules`, build output, and editor files.
- [x] `npm install` completes without errors on a clean clone.
- [x] `npm run dev` starts a local server and the browser shows a placeholder calculator page.
- [x] `npm run build` produces a production build in `dist/`.
- [x] Runtime dependencies are limited to `react` and `react-dom`; everything else is a dev dependency.

## E1-S2 — Strict TypeScript configuration

As a developer, I want strict type checking, so that type errors are caught before runtime.

**Acceptance criteria**

- [x] `tsconfig` enables `strict` and `noUncheckedIndexedAccess`.
- [x] `npm run typecheck` runs the compiler with no emit and exits 0 on the scaffold.
- [x] A deliberate type error causes `npm run typecheck` to exit non-zero.

## E1-S3 — Linting and formatting

As a developer, I want automated linting and formatting, so that the code stays consistent.

**Acceptance criteria**

- [x] `npm run lint` runs oxlint (the linter the current Vite template ships) with TypeScript and React rules and exits 0 on the scaffold.
- [x] Explicit `any` is reported as a lint error.
- [x] `npm run format` applies Prettier; `npm run format:check` fails on unformatted files.

## E1-S4 — Test runner

As a developer, I want a test runner, so that I can write tests alongside the code from the first story.

**Acceptance criteria**

- [x] `npm test` runs Vitest once and exits 0 with at least one passing sample test.
- [x] React Testing Library is configured and a sample component test passes.
- [x] `npm run test:coverage` prints a coverage report.

## E1-S5 — Project structure and README

As a developer, I want a clear folder structure and README, so that I know where code belongs.

**Acceptance criteria**

- [x] Source is organized as `src/engine/` (calculation logic), `src/components/` (React UI), and `src/styles/` (CSS).
- [x] A lint rule fails the build if anything in `src/engine/` imports React or touches DOM globals.
- [x] The README lists prerequisites, every npm script, and the folder structure.
