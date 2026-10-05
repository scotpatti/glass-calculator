# E7 — History and memory: stories

**Epic goal:** A user can review and reuse earlier calculations and store values.

## E7-S1 — Record calculations

As a user, I want each completed calculation saved, so that I can refer back to it.

**Acceptance criteria**

- [x] Pressing `=` on a valid expression adds an entry holding the expression and its result.
- [x] Errors and live previews are not recorded.
- [x] Repeating the same expression immediately does not create a duplicate entry.
- [x] History holds the 100 most recent entries; older entries are dropped.

## E7-S2 — History panel

As a user, I want to open a list of past calculations, so that I can review them.

**Acceptance criteria**

- [x] A history control opens and closes a glass-styled panel.
- [x] Entries are listed newest first, each showing its expression and result.
- [x] The list scrolls when it exceeds the panel height.
- [x] With no entries, the panel shows an empty-state message.
- [x] On narrow screens the panel overlays the keypad; on wide screens it sits beside the calculator.

## E7-S3 — Reuse a history entry

As a user, I want to pull an earlier calculation back, so that I can build on it.

**Acceptance criteria**

- [x] Selecting an entry's result inserts that value at the end of the current expression.
- [x] Selecting an entry's expression replaces the current expression with it, ready to edit.
- [x] Entries are operable by keyboard as well as by pointer.

## E7-S4 — Clear history

As a user, I want to delete my history, so that I can start clean.

**Acceptance criteria**

- [x] A "Clear history" control removes all entries after a confirmation step.
- [x] Each entry can be removed individually.
- [x] Clearing history does not affect the current expression or memory.

## E7-S5 — Memory functions

As a user, I want memory keys, so that I can hold a value across calculations.

**Acceptance criteria**

- [x] `M+` adds the current result to memory; `M−` subtracts it.
- [x] `MR` inserts the memory value into the current expression.
- [x] `MC` clears memory.
- [x] An indicator on the display shows when memory holds a non-zero value.
- [x] `M+` and `M−` do nothing when there is no valid current result.

## E7-S6 — Persistence

As a user, I want history and memory kept between visits, so that a reload does not lose them.

**Acceptance criteria**

- [x] History and memory are restored from local storage after a reload.
- [x] Stored data carries a version number, and data from an unrecognized version is discarded without error.
- [x] If local storage is unavailable or full, the app runs normally with in-session history only.
- [x] Corrupt stored data is discarded and never crashes the app.
