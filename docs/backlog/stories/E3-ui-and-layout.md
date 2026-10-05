# E3 — Calculator UI and layout: stories

**Epic goal:** A user sees a clear display and keypad that work on any screen size.

## E3-S1 — App shell and semantic structure

As a user, I want a page that loads straight into the calculator, so that I can start immediately.

**Acceptance criteria**

- [x] The page has a descriptive `<title>`, a `lang` attribute, and a responsive viewport meta tag.
- [x] The calculator sits in a `<main>` landmark and is centered in the viewport.
- [x] Every key is a native `<button>` element.
- [x] The UI is composed of separate Display, Keypad, and Key components.

## E3-S2 — Display

As a user, I want to see what I am typing and what it equals, so that I can check my work.

**Acceptance criteria**

- [x] The display has two lines: the expression being entered, and the result.
- [x] With nothing entered, the result line shows `0`.
- [x] While the expression is valid, the result line shows a live preview of its value in a muted style.
- [x] After `=` is pressed, the result line shows the final value in the full-emphasis style.
- [x] Operators appear as `×`, `÷`, `−`, and `+`, never as `*`, `/`, or a hyphen.
- [x] Errors appear on the result line as a short message (for example "Can't divide by zero").

## E3-S3 — Standard keypad

As a user, I want a familiar keypad layout, so that I can find keys without searching.

**Acceptance criteria**

- [x] The keypad is a four-column grid containing digits `0`–`9`, the decimal point, `+`, `−`, `×`, `÷`, `%`, sign toggle `±`, `AC`, backspace `⌫`, and `=`.
- [x] Digits follow the conventional calculator arrangement, with `7 8 9` on the top digit row.
- [x] Operators form the right-hand column, with `=` at the bottom right.
- [x] Digit, operator, function, and equals keys are distinguishable by a visual variant.

## E3-S4 — Responsive layout

As a user, I want the calculator to fit my screen, so that I can use it on a phone or a desktop.

**Acceptance criteria**

- [x] At widths from 320px to 480px, the calculator fills the width with a 16px gutter and no horizontal scrolling.
- [x] At widths above 480px, the calculator has a fixed maximum width and is centered.
- [x] In landscape on a phone (height below 500px), the whole calculator remains visible without vertical scrolling.
- [x] Keys stay square or near-square at every supported width.

## E3-S5 — Long numbers and expressions

As a user, I want long input to stay readable, so that nothing is cut off.

**Acceptance criteria**

- [x] The result text shrinks in steps to fit, down to a minimum of 60% of its normal size.
- [x] A result that still does not fit at the minimum size is shown in scientific notation.
- [x] An expression longer than the display scrolls horizontally and keeps the most recent input in view.
- [x] The display never changes height as content changes.
