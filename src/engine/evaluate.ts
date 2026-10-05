import { engineError, type EngineError, type ErrorCode } from './errors'
import { parse, type BinaryOperator, type Node } from './parser'
import { tokenize } from './tokenizer'

export type AngleUnit = 'deg' | 'rad'

export interface EvaluateOptions {
  angleUnit?: AngleUnit
}

export type Evaluation =
  { kind: 'empty' } | { kind: 'value'; value: number } | { kind: 'error'; error: EngineError }

/** Results are rounded to this many significant digits to hide binary floating-point noise. */
export const SIGNIFICANT_DIGITS = 12
const MAX_FACTORIAL = 170

class EvalFailure extends Error {
  readonly code: ErrorCode
  constructor(code: ErrorCode) {
    super(code)
    this.code = code
  }
}

function check(value: number): number {
  if (Number.isNaN(value)) throw new EvalFailure('DOMAIN')
  if (!Number.isFinite(value)) throw new EvalFailure('OVERFLOW')
  return value
}

/**
 * Adds two numbers, snapping to zero when the result is only rounding residue,
 * so that `0.1 + 0.2 - 0.3` is exactly 0.
 */
function add(a: number, b: number): number {
  const sum = a + b
  if (sum !== 0 && Math.abs(sum) < 1e-13 * Math.max(Math.abs(a), Math.abs(b))) return 0
  return sum
}

const BINARY: Record<BinaryOperator, (a: number, b: number) => number> = {
  '+': add,
  '-': (a, b) => add(a, -b),
  '*': (a, b) => a * b,
  '/': (a, b) => {
    if (b === 0) throw new EvalFailure('DIVIDE_BY_ZERO')
    return a / b
  },
  '^': (a, b) => {
    if (a === 0 && b < 0) throw new EvalFailure('DIVIDE_BY_ZERO')
    return Math.pow(a, b)
  },
}

function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n)) throw new EvalFailure('DOMAIN')
  if (n > MAX_FACTORIAL) throw new EvalFailure('OVERFLOW')
  let product = 1
  for (let i = 2; i <= n; i++) product *= i
  return product
}

/** Removes residue such as sin(180°) = 1.2e-16 from trigonometric results. */
const tidy = (value: number) => Math.round(value * 1e15) / 1e15

const toRadians = (x: number, unit: AngleUnit) => (unit === 'deg' ? (x * Math.PI) / 180 : x)
const fromRadians = (x: number, unit: AngleUnit) => (unit === 'deg' ? (x * 180) / Math.PI : x)

function requireRange(x: number, min: number, max: number): number {
  if (x < min || x > max) throw new EvalFailure('DOMAIN')
  return x
}

function requirePositive(x: number): number {
  if (x <= 0) throw new EvalFailure('DOMAIN')
  return x
}

const FUNCTIONS: Record<string, (x: number, unit: AngleUnit) => number> = {
  sin: (x, unit) => tidy(Math.sin(toRadians(x, unit))),
  cos: (x, unit) => tidy(Math.cos(toRadians(x, unit))),
  tan: (x, unit) => {
    const radians = toRadians(x, unit)
    const cosine = tidy(Math.cos(radians))
    if (cosine === 0) throw new EvalFailure('DOMAIN')
    return tidy(Math.sin(radians)) / cosine
  },
  asin: (x, unit) => fromRadians(Math.asin(requireRange(x, -1, 1)), unit),
  acos: (x, unit) => fromRadians(Math.acos(requireRange(x, -1, 1)), unit),
  atan: (x, unit) => fromRadians(Math.atan(x), unit),
  ln: (x) => Math.log(requirePositive(x)),
  log: (x) => Math.log10(requirePositive(x)),
  sqrt: (x) => {
    if (x < 0) throw new EvalFailure('DOMAIN')
    return Math.sqrt(x)
  },
}

const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  e: Math.E,
}

const isFunction = (name: string) => Object.hasOwn(FUNCTIONS, name)
const isConstant = (name: string) => Object.hasOwn(CONSTANTS, name)

function evaluateNode(node: Node, unit: AngleUnit): number {
  switch (node.type) {
    case 'number':
      return node.value
    case 'constant':
      return CONSTANTS[node.name] ?? Number.NaN
    case 'negate':
      return -evaluateNode(node.operand, unit)
    case 'binary':
      return check(
        BINARY[node.operator](evaluateNode(node.left, unit), evaluateNode(node.right, unit)),
      )
    case 'postfix': {
      const operand = evaluateNode(node.operand, unit)
      return check(node.operator === '%' ? operand / 100 : factorial(operand))
    }
    case 'percentOf': {
      const left = evaluateNode(node.left, unit)
      const portion = (left * evaluateNode(node.percent, unit)) / 100
      return check(add(left, node.operator === '+' ? portion : -portion))
    }
    case 'call': {
      const fn = FUNCTIONS[node.name]
      if (fn === undefined) throw new EvalFailure('MALFORMED')
      return check(fn(evaluateNode(node.argument, unit), unit))
    }
  }
}

function roundResult(value: number): number {
  const rounded = Number(value.toPrecision(SIGNIFICANT_DIGITS))
  return rounded === 0 ? 0 : rounded
}

/**
 * Evaluates an expression. Never throws: invalid input and impossible
 * calculations come back as a typed error.
 */
export function evaluate(expression: string, options: EvaluateOptions = {}): Evaluation {
  const unit = options.angleUnit ?? 'deg'

  const tokens = tokenize(expression)
  if (!tokens.ok) return { kind: 'error', error: tokens.error }
  if (tokens.value.length === 0) return { kind: 'empty' }

  const tree = parse(tokens.value, expression.length, { isFunction, isConstant })
  if (!tree.ok) return { kind: 'error', error: tree.error }

  try {
    return { kind: 'value', value: roundResult(check(evaluateNode(tree.value, unit))) }
  } catch (error) {
    if (error instanceof EvalFailure) return { kind: 'error', error: engineError(error.code) }
    return { kind: 'error', error: engineError('MALFORMED') }
  }
}

/** How many `)` are needed to balance the expression. */
export function missingClosers(expression: string): number {
  let depth = 0
  for (const ch of expression) {
    if (ch === '(') depth++
    else if (ch === ')' && depth > 0) depth--
  }
  return depth
}
