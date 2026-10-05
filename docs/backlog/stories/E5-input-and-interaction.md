# E5 — Input and interaction: stories

**Epic goal:** A user can operate every function by mouse, touch, or keyboard.

## E5-S1 — Pointer input

As a user, I want to tap or click keys, so that I can build an expression.

**Acceptance criteria**

- [x] Clicking or tapping a key appends its symbol to the expression or performs its action.
- [ ] One tap registers exactly one input, with no double entry on touch devices.
- [x] Tapping keys quickly in succession registers every tap in order.
- [ ] Double-tapping a key does not zoom the page.

## E5-S2 — Keyboard input

As a user, I want to type on my keyboard, so that I can calculate without the mouse.

**Acceptance criteria**

- [x] `0`–`9` and `.` enter digits and the decimal point.
- [x] `+`, `-`, `*`, `/`, and `%` enter the matching operator, shown as `+`, `−`, `×`, `÷`, `%`.
- [x] `Enter` and `=` evaluate; `Backspace` deletes; `Escape` clears all.
- [x] Keyboard input works wherever focus is on the page, except inside a text field.
- [x] Keys the calculator does not use, and browser shortcuts such as Ctrl/Cmd combinations, are left untouched.

## E5-S3 — Input rules

As a user, I want the calculator to keep my input well-formed, so that I do not have to fix typos.

**Acceptance criteria**

- [x] A second decimal point in the same number is ignored.
- [x] Typing a binary operator directly after another replaces it (`5 + ×` becomes `5 ×`), except `−`, which is accepted as a negative sign after `×` or `÷`.
- [x] A leading zero is replaced by the next digit (`0` then `5` gives `5`), while `0.` is kept.
- [x] Pressing `.` with no current number inserts `0.`.
- [x] `±` toggles the sign of the number currently being entered.
- [x] An expression cannot start with `+`, `×`, `÷`, or `%`.

## E5-S4 — Clear and delete

As a user, I want to correct mistakes, so that I do not have to start over.

**Acceptance criteria**

- [x] `⌫` removes the last character of the expression; a function name such as `sin(` is removed as one unit.
- [x] `AC` clears the expression and the result, returning the display to `0`.
- [x] `AC` does not clear history or memory.
- [x] `⌫` on an empty expression does nothing.
- [x] After an error, `⌫` returns to the expression for editing and `AC` clears it.

## E5-S5 — Equals and continuing a calculation

As a user, I want to carry a result into my next calculation, so that I can chain work.

**Acceptance criteria**

- [x] Pressing `=` on a valid expression shows the final result and keeps the expression visible above it.
- [x] Pressing `=` on an empty or already-evaluated expression does nothing.
- [x] After a result, typing an operator starts a new expression beginning with that result.
- [x] After a result, typing a digit or decimal point starts a fresh expression.
- [x] Pressing `=` on an invalid expression shows the error and leaves the expression editable.

## E5-S6 — Press feedback

As a user, I want every input acknowledged, so that I know it registered.

**Acceptance criteria**

- [x] A key shows its pressed state for the duration of a click or touch.
- [x] Typing on the keyboard shows the pressed state on the matching on-screen key.
- [x] The result animates briefly when `=` is pressed.
- [x] An error triggers a short shake of the display.
