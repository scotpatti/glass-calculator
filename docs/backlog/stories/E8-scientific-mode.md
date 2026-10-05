# E8 — Scientific mode: stories

**Epic goal:** A user can switch to an extended keypad for scientific calculations.

## E8-S1 — Mode toggle and extended keypad

As a user, I want to switch between standard and scientific keypads, so that I see extra keys only when I need them.

**Acceptance criteria**

- [x] A toggle switches between standard and scientific modes, and the choice persists across reloads.
- [x] Scientific mode adds keys for `(`, `)`, `xʸ`, `x²`, `√`, `sin`, `cos`, `tan`, their inverses, `ln`, `log`, `!`, `π`, `e`, and the degree/radian toggle.
- [x] Switching modes keeps the current expression and result.
- [x] On narrow screens the scientific keys fit without horizontal scrolling and still meet the 44px target size.
- [x] Keyboard input for scientific operators (`(`, `)`, `^`, `!`) works in both modes.

## E8-S2 — Parentheses

As a user, I want to group parts of an expression, so that I can control the order of evaluation.

**Acceptance criteria**

- [x] `(2 + 3) × 4` = `20`.
- [x] Nested parentheses evaluate correctly: `((2 + 3) × (4 − 1)) ÷ 5` = `3`.
- [x] Implicit multiplication is supported: `2(3 + 4)` = `14` and `(2)(3)` = `6`.
- [x] Unclosed parentheses are closed automatically on `=`; the display shows the pending closers in a muted style.
- [x] A `)` with no matching `(` is ignored on input.

## E8-S3 — Powers and roots

As a user, I want exponents and roots, so that I can calculate powers.

**Acceptance criteria**

- [x] `2 ^ 10` = `1024`; `x²` appends `^2`.
- [x] Exponentiation is right associative: `2 ^ 3 ^ 2` = `512`.
- [x] Exponentiation binds tighter than unary minus: `−2 ^ 2` = `−4`.
- [x] `√(16)` = `4`; `√(2)` = `1.41421356237`.
- [x] `√(−1)` returns a domain error.

## E8-S4 — Trigonometry and angle units

As a user, I want trig functions in degrees or radians, so that I can work in the unit my problem uses.

**Acceptance criteria**

- [x] The angle unit defaults to degrees, is shown on the display, and persists across reloads.
- [x] In degrees: `sin(30)` = `0.5`, `cos(60)` = `0.5`, `tan(45)` = `1`, `sin(180)` = `0`.
- [x] In radians: `sin(π ÷ 2)` = `1`, `cos(π)` = `−1`.
- [x] Inverse functions return values in the active unit: `asin(0.5)` = `30` in degrees.
- [x] `tan(90)` in degrees, and `asin` or `acos` of a value outside −1 to 1, return a domain error.

## E8-S5 — Logarithms

As a user, I want natural and base-10 logarithms, so that I can solve exponential problems.

**Acceptance criteria**

- [x] `log(1000)` = `3`; `ln(e)` = `1`; `ln(1)` = `0`.
- [x] `log(0)` and the logarithm of a negative number return a domain error.

## E8-S6 — Factorial and constants

As a user, I want factorial and common constants, so that I do not have to type them out.

**Acceptance criteria**

- [x] `5!` = `120`; `0!` = `1`.
- [x] Factorial of a negative or non-integer value returns a domain error; factorial above `170` returns an overflow error.
- [x] `π` evaluates to `3.14159265359` and `e` to `2.71828182846`.
- [x] Constants multiply implicitly: `2π` = `6.28318530718`.
