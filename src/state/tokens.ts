import { toPlainString } from '../engine'

/**
 * The expression is held as a list of input tokens, one per key press: a digit,
 * a decimal point, an operator, a parenthesis, a constant, or a function name
 * with its opening parenthesis (for example `sin(`). Backspace removes one token.
 */
export type InputToken = string

export const BINARY_TOKENS = ['+', '−', '×', '÷', '^'] as const
export const POSTFIX_TOKENS = ['%', '!'] as const
export const CONSTANT_TOKENS = ['π', 'e'] as const
export const FUNCTION_NAMES = [
  'sin',
  'cos',
  'tan',
  'asin',
  'acos',
  'atan',
  'ln',
  'log',
  '√',
] as const

export type BinaryToken = (typeof BINARY_TOKENS)[number]
export type PostfixToken = (typeof POSTFIX_TOKENS)[number]
export type ConstantToken = (typeof CONSTANT_TOKENS)[number]
export type FunctionName = (typeof FUNCTION_NAMES)[number]

const includes = (list: readonly string[], token: string | undefined) =>
  token !== undefined && list.includes(token)

export const isDigit = (token: string | undefined) =>
  token !== undefined && token.length === 1 && token >= '0' && token <= '9'
export const isNumberPart = (token: string | undefined) => isDigit(token) || token === '.'
export const isBinary = (token: string | undefined) => includes(BINARY_TOKENS, token)
export const isPostfix = (token: string | undefined) => includes(POSTFIX_TOKENS, token)
export const isConstant = (token: string | undefined) => includes(CONSTANT_TOKENS, token)
/** True for `(` and for function tokens such as `sin(`. */
export const opensGroup = (token: string | undefined) => token !== undefined && token.endsWith('(')
/** True when the token can be the last one of a complete operand. */
export const endsOperand = (token: string | undefined) =>
  isNumberPart(token) || token === ')' || isConstant(token) || isPostfix(token)

/** A `−` is a negative sign, not subtraction, at the start or after an operator or `(`. */
export function isUnaryMinus(tokens: readonly InputToken[], index: number): boolean {
  if (tokens[index] !== '−') return false
  const previous = tokens[index - 1]
  return previous === undefined || isBinary(previous) || opensGroup(previous)
}

/** Index where the number being typed begins; equals `tokens.length` when there is none. */
export function currentNumberStart(tokens: readonly InputToken[]): number {
  let start = tokens.length
  while (start > 0 && isNumberPart(tokens[start - 1])) start--
  return start
}

export function valueToTokens(value: number): InputToken[] {
  return [...toPlainString(value)].map((ch) => (ch === '-' ? '−' : ch))
}

/** Builds the string handed to the engine. Names are spaced so `e` and `sin(` do not run together. */
export function toEngineString(tokens: readonly InputToken[]): string {
  return tokens.map((token) => (/^[a-z]/i.test(token) ? ` ${token}` : token)).join('')
}

const DISPLAY_NAMES: Record<string, string> = {
  'asin(': 'sin⁻¹(',
  'acos(': 'cos⁻¹(',
  'atan(': 'tan⁻¹(',
}

/** Builds the string shown on the display, with spaces around binary operators. */
export function toDisplayString(tokens: readonly InputToken[]): string {
  return tokens
    .map((token, index) => {
      if (isBinary(token) && !isUnaryMinus(tokens, index)) return ` ${token} `
      return DISPLAY_NAMES[token] ?? token
    })
    .join('')
}
