# E4 — Glassmorphic theme: stories

**Epic goal:** The app looks unmistakably glassmorphic and stays legible.

## E4-S1 — Design tokens

As a developer, I want every visual value defined as a token, so that the theme is consistent and easy to adjust.

**Acceptance criteria**

- [x] Colors, blur radii, surface opacities, border radii, spacing, shadows, font sizes, and durations are CSS custom properties on `:root`.
- [x] No component stylesheet contains a hard-coded color or blur value.
- [x] Changing a single token (for example the blur radius) updates every surface that uses it.

## E4-S2 — Background

As a user, I want a vivid backdrop behind the calculator, so that the glass effect has something to blur.

**Acceptance criteria**

- [x] The page background is a multi-color gradient with at least two soft, blurred color shapes behind the calculator.
- [x] The background covers the full viewport at every size, with no visible seams or banding at the edges.
- [x] The background is built in CSS alone, with no image downloads.
- [x] The background shapes drift slowly; the motion is subtle enough not to distract from the display.

## E4-S3 — Glass panel

As a user, I want the calculator body to look like frosted glass, so that the app has its distinctive style.

**Acceptance criteria**

- [x] The calculator body has a semi-transparent fill, a backdrop blur, a thin light border, a soft drop shadow, and generously rounded corners.
- [x] Background colors are visibly diffused through the panel.
- [x] The display area reads as a second, inset glass layer distinct from the body.
- [x] A subtle highlight along the top or left edge suggests light catching the glass.

## E4-S4 — Key styles and states

As a user, I want keys that look and respond like glass, so that I can tell what is pressable and what I pressed.

**Acceptance criteria**

- [x] Each key is its own translucent surface with a border and rounded corners.
- [x] Digit, operator, function, and equals keys each have a distinct tint; the equals key is the most prominent.
- [x] Hover brightens the key; pressed state darkens and scales it down slightly; both transitions take 150ms or less.
- [x] The focus state is a clearly visible ring that does not rely on color change alone.

## E4-S5 — Light and dark variants

As a user, I want the theme to match my system appearance, so that it is comfortable day or night.

**Acceptance criteria**

- [x] The theme follows `prefers-color-scheme` by default.
- [x] A toggle control lets the user override the system setting, and the choice persists across reloads.
- [x] Both variants redefine tokens only; no component styles are duplicated.
- [x] Switching themes does not cause a flash of the wrong theme on page load.

## E4-S6 — Fallback without backdrop blur

As a user on a browser without backdrop blur, I want a usable design, so that the app still looks intentional.

**Acceptance criteria**

- [x] Where `backdrop-filter` is unsupported, surfaces use a more opaque fill chosen through `@supports`.
- [x] Text contrast in the fallback meets the same thresholds as the primary design (see E6-S4).
- [x] Layout and spacing are identical with and without blur.
