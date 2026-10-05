# E9 — Quality and delivery: stories

**Epic goal:** The app is verified and published.

Tests are written alongside each story in E2–E8. The stories here set the thresholds and add the cross-cutting checks.

## E9-S1 — Engine test coverage

As a developer, I want the engine thoroughly tested, so that calculation bugs are caught before users see them.

**Acceptance criteria**

- [x] Every example in the E2 and E8 acceptance criteria exists as a unit test.
- [x] Line and branch coverage of `src/engine/` is at least 95%, enforced by the test command.
- [x] A table-driven test file makes adding a new expression/result case a one-line change.
- [x] A fuzz test feeds random key sequences to the engine and asserts it never throws or returns `NaN` or `Infinity`.

## E9-S2 — UI tests

As a developer, I want the UI behavior tested, so that interaction regressions are caught.

**Acceptance criteria**

- [x] Component tests cover pointer input, keyboard input, the input rules in E5-S3, clear and delete, and continuing from a result.
- [x] Tests cover adding, reusing, and clearing history, memory keys, and restoring from local storage.
- [ ] Tests find elements by accessible role and name, not by CSS class or test ID.
- [x] An axe accessibility check runs in the test suite and fails on any violation.

## E9-S3 — Cross-browser end-to-end checks

As a user of any modern browser, I want the app to work the same, so that my browser choice does not matter.

**Acceptance criteria**

- [ ] A Playwright suite runs a smoke scenario (a standard calculation, a scientific calculation, history reuse, theme toggle) in Chromium, Firefox, and WebKit.
- [x] The suite runs at one phone and one desktop viewport size.
- [ ] The glass fallback is checked visually in a browser with `backdrop-filter` disabled.
- [ ] A manual pass on the current versions of Chrome, Safari, Firefox, and Edge is recorded in the README.

## E9-S4 — Continuous integration

As a developer, I want checks run on every change, so that broken code is not merged.

**Acceptance criteria**

- [ ] A CI workflow runs typecheck, lint, format check, unit tests with coverage, end-to-end tests, and the production build on every push and pull request.
- [ ] Any failing step fails the workflow.
- [ ] The workflow completes in under five minutes.

## E9-S5 — Production build and deployment

As a user, I want the calculator at a public URL, so that I can use it anywhere.

**Acceptance criteria**

- [ ] The production build is deployed to a static host automatically when the main branch passes CI.
- [x] The deployed JavaScript is under 100 kB gzipped.
- [ ] The deployed page scores at least 95 for Performance and 100 for Accessibility in Lighthouse.
- [x] The app works when served from a sub-path, not only from the domain root.
- [ ] The README links to the live URL.
