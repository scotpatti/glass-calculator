# E6 — Accessibility: stories

**Epic goal:** The calculator is usable with a screen reader, keyboard only, and under reduced-motion or high-contrast preferences.

## E6-S1 — Accessible names and roles

As a screen-reader user, I want every control named in words, so that I know what each key does.

**Acceptance criteria**

- [x] Symbol keys have spoken names: `÷` "divide", `×` "multiply", `−` "subtract", `+` "add", `±` "toggle sign", `⌫` "backspace", `AC` "all clear", `=` "equals".
- [x] The keypad is a labelled group, and the display has an accessible name.
- [x] Toggle controls (theme, scientific mode, degree/radian) expose their state with `aria-pressed` or an equivalent.
- [x] An automated axe scan reports no violations.

## E6-S2 — Announcements

As a screen-reader user, I want results and errors read out, so that I know the outcome without hunting for it.

**Acceptance criteria**

- [x] Pressing `=` announces the result once through a polite live region.
- [x] Errors are announced through an assertive live region.
- [x] The live preview is not announced on every keystroke.
- [x] Announcements read operators as words (for example "2 plus 3 equals 5").

## E6-S3 — Keyboard navigation and focus

As a keyboard user, I want to reach and operate everything without a mouse, so that I am not locked out of any feature.

**Acceptance criteria**

- [x] Tab order follows the visual order: display, keypad, then secondary panels.
- [x] Every interactive element shows a visible focus indicator with at least 3:1 contrast against its surroundings.
- [x] Space and Enter activate the focused key.
- [x] Opening the history panel moves focus into it; closing it returns focus to the control that opened it.
- [x] There is no keyboard trap anywhere in the app.

## E6-S4 — Contrast over glass

As a user with low vision, I want text I can read over translucent surfaces, so that the style does not cost me legibility.

**Acceptance criteria**

- [x] Display text and key labels meet 4.5:1 contrast, measured against the lightest and darkest background regions that can sit behind them.
- [x] Large result text meets at least 3:1.
- [x] Key borders and focus rings meet 3:1 against adjacent colors.
- [x] The thresholds hold in both light and dark variants and in the no-blur fallback.

## E6-S5 — Reduced motion and transparency

As a user sensitive to motion or transparency, I want the app to respect my system settings, so that it is comfortable to use.

**Acceptance criteria**

- [x] With `prefers-reduced-motion: reduce`, the background drift, result animation, and error shake are disabled, and state changes are instant.
- [x] With `prefers-reduced-transparency: reduce` or `prefers-contrast: more`, surfaces become near-opaque and borders become stronger.
- [x] No function of the calculator depends on an animation completing.

## E6-S6 — Touch targets and zoom

As a user with limited dexterity or low vision, I want large targets and working zoom, so that I can operate the keys accurately.

**Acceptance criteria**

- [x] Every key is at least 44 × 44 CSS pixels, with at least 8px between keys.
- [x] The page is usable at 200% browser zoom with no loss of content or function.
- [x] Pinch-zoom is not disabled.
