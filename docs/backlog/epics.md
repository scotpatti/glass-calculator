# Glassmorphic Calculator — Epics

**Status:** Approved 2026-10-05
**Last updated:** 2026-10-05

## Product summary

A browser-based calculator with a glassmorphic visual theme, built from scratch with HTML, CSS, and TypeScript.

## Decisions

| Topic            | Decision                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| v1 scope         | All epics E1–E9, including history/memory and scientific mode                                          |
| Evaluation model | Expression style: operator precedence is respected (`2 + 3 × 4` = 14) and the full expression is shown |
| Stack            | TypeScript, React, HTML, CSS, scaffolded with Vite; Vitest for tests                                   |
| Styling          | Hand-written CSS (no component or CSS framework), so the glass theme is our own                        |
| Accessibility    | Standalone epic (E6)                                                                                   |
| Backlog location | `docs/backlog/`                                                                                        |

## Epics

### E1 — Project foundation

**Goal:** A developer can clone the repo, install, run, test, and build with one command each.

**In scope:** Git repository, Vite + React + TypeScript scaffold, strict TypeScript config, linting and formatting, test runner, folder structure separating engine from UI, README.

**Out of scope:** Deployment (E9).

### E2 — Calculation engine

**Goal:** A pure TypeScript module, with no DOM or React dependency, that turns an expression into a correct result.

**In scope:** Tokenizer and parser for expressions, operator precedence and associativity, add/subtract/multiply/divide, decimals, percent, unary negation, decimal-safe precision (`0.1 + 0.2` = `0.3`), error handling (divide by zero, malformed expression, overflow), result formatting.

**Out of scope:** Scientific functions and parentheses (E8), though the parser must be designed to accept them.

### E3 — Calculator UI and layout

**Goal:** A user sees a clear display and keypad that work on any screen size.

**In scope:** Semantic markup, display showing the expression in progress and the current result, keypad grid, responsive layout from phone to desktop, handling of long numbers and long expressions (shrink, scroll, or scientific notation).

**Out of scope:** Visual theme (E4), input handling (E5).

### E4 — Glassmorphic theme

**Goal:** The app looks unmistakably glassmorphic and stays legible.

**In scope:** Design tokens (CSS custom properties), translucent frosted panels with backdrop blur, a vivid background for the glass to sit over, borders and highlights, button states (rest, hover, pressed, focus, disabled), light and dark variants, fallback where backdrop blur is unsupported.

**Out of scope:** User-selectable custom themes.

### E5 — Input and interaction

**Goal:** A user can operate every function by mouse, touch, or keyboard.

**In scope:** Click and touch input, keyboard support (digits, operators, Enter/=, Backspace, Escape), clear entry vs. all clear, input rules (one decimal point per number, operator replacement, leading zeros), press feedback and animations.

**Out of scope:** Voice input, paste of arbitrary expressions.

### E6 — Accessibility

**Goal:** The calculator is usable with a screen reader, keyboard only, and under reduced-motion or high-contrast preferences.

**In scope:** Accessible names for every control, announcement of results and errors, logical focus order and visible focus, WCAG AA text contrast over glass surfaces, reduced-motion and reduced-transparency support, touch target sizes.

**Out of scope:** Formal third-party audit.

### E7 — History and memory

**Goal:** A user can review and reuse earlier calculations and store values.

**In scope:** Scrollable history of expressions and results, select an entry to reuse it, clear history, memory functions (MC, MR, M+, M−), persistence across reloads in local storage.

**Out of scope:** Sync across devices, export.

### E8 — Scientific mode

**Goal:** A user can switch to an extended keypad for scientific calculations.

**In scope:** Mode toggle, parentheses, exponents and roots, trig and inverse trig, logarithms, factorial, constants (π, e), degree/radian toggle, extended keypad layout.

**Out of scope:** Graphing, unit conversion, programmer mode.

### E9 — Quality and delivery

**Goal:** The app is verified and published.

**In scope:** Unit-test coverage for the engine, component and interaction tests for the UI, cross-browser check (Chrome, Safari, Firefox, Edge), production build, static hosting, CI running lint, tests, and build.

**Out of scope:** Native or installable app packaging.

## Suggested build order

E1 → E2 → E3 → E5 → E4 → E6 → E7 → E8 → E9, with E9's tests written alongside each epic rather than at the end.

## Stories

Stories and acceptance criteria per epic. Checked boxes are criteria that have been built and verified:

- [E1 — Project foundation](stories/E1-project-foundation.md)
- [E2 — Calculation engine](stories/E2-calculation-engine.md)
- [E3 — Calculator UI and layout](stories/E3-ui-and-layout.md)
- [E4 — Glassmorphic theme](stories/E4-glassmorphic-theme.md)
- [E5 — Input and interaction](stories/E5-input-and-interaction.md)
- [E6 — Accessibility](stories/E6-accessibility.md)
- [E7 — History and memory](stories/E7-history-and-memory.md)
- [E8 — Scientific mode](stories/E8-scientific-mode.md)
- [E9 — Quality and delivery](stories/E9-quality-and-delivery.md)
