# E2 — Calculation engine: stories

**Epic goal:** A pure TypeScript module, with no DOM or React dependency, that turns an expression into a correct result.

The engine exposes one main function that takes an expression string and returns either a numeric result or a typed error. It never throws for bad user input.

## E2-S1 — Tokenize an expression

As the engine, I want to split an expression into tokens, so that it can be parsed.

**Acceptance criteria**

- [x] `12.5+3` produces the tokens number `12.5`, operator `+`, number `3`.
- [x] Both `×`/`*` and `÷`/`/` are accepted, as is `−`/`-`.
- [x] Whitespace between tokens is ignored.
- [x] Numbers may begin with a decimal point (`.5` is `0.5`) or end with one (`5.` is `5`).
- [x] A number with two decimal points (`1.2.3`) or an unknown character (`2 $ 3`) returns a malformed-expression error identifying the position.

## E2-S2 — Parse with precedence and associativity

As a user, I want expressions evaluated in the standard order of operations, so that results match what I learned in maths.

**Acceptance criteria**

- [x] `2 + 3 × 4` evaluates to `14`.
- [x] `10 − 4 − 3` evaluates to `3` (left associative).
- [x] `12 ÷ 3 × 2` evaluates to `8` (equal precedence, left to right).
- [x] The operator table is data-driven, so that adding an operator, function, or parentheses in E8 requires no change to existing parsing rules.
- [x] An expression ending in an operator (`2 +`) or containing adjacent binary operators (`2 × ÷ 3`) returns a malformed-expression error.
- [x] An empty expression returns an empty result, not an error.

## E2-S3 — Basic arithmetic

As a user, I want to add, subtract, multiply, and divide, so that I can do everyday calculations.

**Acceptance criteria**

- [x] `7 + 8` = `15`; `7 − 8` = `−1`; `7 × 8` = `56`; `56 ÷ 8` = `7`.
- [x] Decimal operands work: `1.5 × 4` = `6`.
- [x] `7 ÷ 2` = `3.5`.

## E2-S4 — Unary negation

As a user, I want to enter negative numbers, so that I can calculate with them.

**Acceptance criteria**

- [x] `−5 + 3` = `−2`.
- [x] `4 × −2` = `−8`.
- [x] `−−5` = `5`.
- [x] `5 − −3` = `8`.

## E2-S5 — Percent

As a user, I want a percent operator, so that I can work out tips, discounts, and tax.

**Acceptance criteria**

- [x] On its own or after `×` or `÷`, percent divides by 100: `50%` = `0.5`; `200 × 10%` = `20`.
- [x] After `+` or `−`, percent means that percentage of the left-hand value: `200 + 10%` = `220`; `200 − 10%` = `180`.
- [x] `%` with no preceding number returns a malformed-expression error.

## E2-S6 — Decimal-safe precision

As a user, I want results free of floating-point artefacts, so that I can trust what I see.

**Acceptance criteria**

- [x] `0.1 + 0.2` = `0.3` exactly as displayed.
- [x] `0.3 − 0.1` = `0.2`; `1.1 × 3` = `3.3`; `0.1 × 3` = `0.3`.
- [x] Results are rounded to at most 12 significant digits, with trailing zeros removed.
- [x] `1 ÷ 3` = `0.333333333333`.

## E2-S7 — Error handling

As a user, I want a clear outcome when a calculation is impossible, so that I am never shown `NaN` or `Infinity`.

**Acceptance criteria**

- [x] `5 ÷ 0` returns a divide-by-zero error.
- [x] A result whose magnitude exceeds the largest safe value returns an overflow error.
- [x] Every error has a stable code (`DIVIDE_BY_ZERO`, `MALFORMED`, `OVERFLOW`, `DOMAIN`) and a short human-readable message.
- [x] No input string causes the engine to throw or to return `NaN` or `Infinity`.

## E2-S8 — Result formatting

As a user, I want results formatted for reading, so that large and small numbers are legible.

**Acceptance criteria**

- [x] Integer parts are grouped in thousands: `1234567.5` formats as `1,234,567.5`.
- [x] Magnitudes of `1e15` and above, or below `1e−9` and non-zero, format in scientific notation (for example `1.5e+15`).
- [x] Negative zero formats as `0`.
- [x] Formatting is a separate function from evaluation, so that a raw numeric result is always available for reuse.
