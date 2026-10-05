import { evaluate, missingClosers, type AngleUnit, type EngineError } from '../engine'
import {
  currentNumberStart,
  endsOperand,
  isBinary,
  isConstant,
  isNumberPart,
  isUnaryMinus,
  opensGroup,
  toEngineString,
  valueToTokens,
  type BinaryToken,
  type ConstantToken,
  type FunctionName,
  type InputToken,
  type PostfixToken,
} from './tokens'

export const HISTORY_LIMIT = 100
const MAX_TOKENS = 200

export interface HistoryEntry {
  id: number
  tokens: InputToken[]
  value: number
  angleUnit: AngleUnit
}

export type Status =
  { kind: 'editing' } | { kind: 'result'; value: number } | { kind: 'error'; error: EngineError }

export interface CalculatorState {
  tokens: InputToken[]
  status: Status
  angleUnit: AngleUnit
  memory: number
  history: HistoryEntry[]
}

export type Action =
  | { type: 'digit'; digit: string }
  | { type: 'decimal' }
  | { type: 'binary'; operator: BinaryToken }
  | { type: 'postfix'; operator: PostfixToken }
  | { type: 'toggleSign' }
  | { type: 'openParen' }
  | { type: 'closeParen' }
  | { type: 'function'; name: FunctionName }
  | { type: 'constant'; name: ConstantToken }
  | { type: 'square' }
  | { type: 'backspace' }
  | { type: 'clear' }
  | { type: 'equals' }
  | { type: 'memoryAdd' }
  | { type: 'memorySubtract' }
  | { type: 'memoryRecall' }
  | { type: 'memoryClear' }
  | { type: 'historyUseResult'; id: number }
  | { type: 'historyUseExpression'; id: number }
  | { type: 'historyRemove'; id: number }
  | { type: 'historyClear' }
  | { type: 'setAngleUnit'; angleUnit: AngleUnit }

export const initialState: CalculatorState = {
  tokens: [],
  status: { kind: 'editing' },
  angleUnit: 'deg',
  memory: 0,
  history: [],
}

const EDITING: Status = { kind: 'editing' }

function edit(state: CalculatorState, tokens: InputToken[]): CalculatorState {
  if (tokens.length > MAX_TOKENS) return state
  return { ...state, tokens, status: EDITING }
}

/** Tokens to build on when the input begins a new operand: a shown result is discarded. */
function freshTokens(state: CalculatorState): InputToken[] {
  return state.status.kind === 'result' ? [] : [...state.tokens]
}

/**
 * Tokens to build on when the input continues the calculation: a shown result
 * becomes the first operand. A negative result is wrapped when `wrapNegative`
 * is set, so that `^`, `%` and `!` apply to the whole value.
 */
function continuedTokens(state: CalculatorState, wrapNegative: boolean): InputToken[] {
  if (state.status.kind !== 'result') return [...state.tokens]
  const value = valueToTokens(state.status.value)
  return wrapNegative && state.status.value < 0 ? ['(', ...value, ')'] : value
}

/** A digit typed straight after `)`, a constant, `%` or `!` multiplies. */
function withImplicitTimes(tokens: InputToken[]): InputToken[] {
  const last = tokens.at(-1)
  if (endsOperand(last) && !isNumberPart(last)) tokens.push('×')
  return tokens
}

function digit(state: CalculatorState, value: string): CalculatorState {
  const tokens = freshTokens(state)
  const start = currentNumberStart(tokens)
  if (tokens.length - start === 1 && tokens[start] === '0') {
    tokens[start] = value
    return edit(state, tokens)
  }
  withImplicitTimes(tokens).push(value)
  return edit(state, tokens)
}

function decimal(state: CalculatorState): CalculatorState {
  const tokens = freshTokens(state)
  const start = currentNumberStart(tokens)
  if (tokens.slice(start).includes('.')) return state
  if (start === tokens.length) withImplicitTimes(tokens).push('0')
  tokens.push('.')
  return edit(state, tokens)
}

function binary(state: CalculatorState, operator: BinaryToken): CalculatorState {
  const tokens = continuedTokens(state, operator === '^')
  const last = tokens.at(-1)
  const canOnlyNegate = (token: string | undefined) => token === undefined || opensGroup(token)

  if (canOnlyNegate(last)) {
    return operator === '−' ? edit(state, [...tokens, '−']) : state
  }

  if (isBinary(last)) {
    const afterStrongOperator = last === '×' || last === '÷' || last === '^'
    if (operator === '−' && afterStrongOperator) return edit(state, [...tokens, '−'])

    const trimmed = [...tokens]
    while (isBinary(trimmed.at(-1))) trimmed.pop()
    if (canOnlyNegate(trimmed.at(-1))) {
      return operator === '−' ? edit(state, [...trimmed, '−']) : state
    }
    return edit(state, [...trimmed, operator])
  }

  return edit(state, [...tokens, operator])
}

function postfix(state: CalculatorState, operator: PostfixToken): CalculatorState {
  const tokens = continuedTokens(state, true)
  const last = tokens.at(-1)
  if (!(isNumberPart(last) || last === ')' || isConstant(last))) return state
  return edit(state, [...tokens, operator])
}

function toggleSign(state: CalculatorState): CalculatorState {
  if (state.status.kind === 'result') {
    return state.status.value === 0 ? state : edit(state, valueToTokens(-state.status.value))
  }

  const tokens = [...state.tokens]
  const start = currentNumberStart(tokens)
  const last = tokens.at(-1)
  if (start === tokens.length && endsOperand(last)) return state

  const before = start - 1
  const previous = tokens[before]
  if (previous === '−' && isUnaryMinus(tokens, before)) {
    tokens.splice(before, 1)
  } else if (previous === '+') {
    tokens[before] = '−'
  } else if (previous === '−') {
    tokens[before] = '+'
  } else {
    tokens.splice(start, 0, '−')
  }
  return edit(state, tokens)
}

function closeParen(state: CalculatorState): CalculatorState {
  if (state.status.kind === 'result') return state
  const last = state.tokens.at(-1)
  if (missingClosers(toEngineString(state.tokens)) === 0) return state
  if (isBinary(last) || opensGroup(last)) return state
  return edit(state, [...state.tokens, ')'])
}

function insertValue(state: CalculatorState, value: number): CalculatorState {
  const inserted = valueToTokens(value)
  if (state.status.kind === 'result') return edit(state, inserted)

  const tokens = state.tokens.slice(0, currentNumberStart(state.tokens))
  return edit(state, [...withImplicitTimes(tokens), ...inserted])
}

/** Evaluates what has been typed so far, ignoring a dangling operator or open bracket. */
export function previewValue(tokens: readonly InputToken[], angleUnit: AngleUnit): number | null {
  const usable = [...tokens]
  while (isBinary(usable.at(-1)) || opensGroup(usable.at(-1))) usable.pop()
  const result = evaluate(toEngineString(usable), { angleUnit })
  return result.kind === 'value' ? result.value : null
}

/** The value memory keys act on: the shown result, or the live preview while typing. */
export function currentValue(state: CalculatorState): number | null {
  if (state.status.kind === 'result') return state.status.value
  if (state.status.kind === 'error') return null
  return previewValue(state.tokens, state.angleUnit)
}

function equals(state: CalculatorState): CalculatorState {
  if (state.status.kind === 'result' || state.tokens.length === 0) return state

  const expression = toEngineString(state.tokens)
  const result = evaluate(expression, { angleUnit: state.angleUnit })
  if (result.kind === 'empty') return state
  if (result.kind === 'error') return { ...state, status: { kind: 'error', error: result.error } }

  const closers = Array<InputToken>(missingClosers(expression)).fill(')')
  const tokens = [...state.tokens, ...closers]
  // A bare number is not a calculation worth remembering.
  const isBareNumber = tokens.every(
    (token, index) => isNumberPart(token) || isUnaryMinus(tokens, index),
  )
  return {
    ...state,
    tokens,
    status: { kind: 'result', value: result.value },
    history: isBareNumber
      ? state.history
      : addToHistory(state.history, tokens, result.value, state.angleUnit),
  }
}

function addToHistory(
  history: HistoryEntry[],
  tokens: InputToken[],
  value: number,
  angleUnit: AngleUnit,
): HistoryEntry[] {
  const latest = history[0]
  if (
    latest !== undefined &&
    latest.angleUnit === angleUnit &&
    latest.tokens.join('') === tokens.join('')
  ) {
    return history
  }
  const id = history.reduce((max, entry) => Math.max(max, entry.id), 0) + 1
  return [{ id, tokens, value, angleUnit }, ...history].slice(0, HISTORY_LIMIT)
}

function adjustMemory(state: CalculatorState, sign: 1 | -1): CalculatorState {
  const value = currentValue(state)
  if (value === null) return state
  const memory = Number((state.memory + sign * value).toPrecision(12))
  return Number.isFinite(memory) ? { ...state, memory: memory === 0 ? 0 : memory } : state
}

export function calculatorReducer(state: CalculatorState, action: Action): CalculatorState {
  switch (action.type) {
    case 'digit':
      return digit(state, action.digit)
    case 'decimal':
      return decimal(state)
    case 'binary':
      return binary(state, action.operator)
    case 'postfix':
      return postfix(state, action.operator)
    case 'toggleSign':
      return toggleSign(state)
    case 'openParen':
      return edit(state, [...freshTokens(state), '('])
    case 'closeParen':
      return closeParen(state)
    case 'function':
      return edit(state, [...freshTokens(state), `${action.name}(`])
    case 'constant':
      return edit(state, [...freshTokens(state), action.name])
    case 'square': {
      const tokens = continuedTokens(state, true)
      return endsOperand(tokens.at(-1)) ? edit(state, [...tokens, '^', '2']) : state
    }
    case 'backspace':
      // After a result or an error, the first press only reopens the expression for editing.
      if (state.status.kind !== 'editing') return { ...state, status: EDITING }
      return state.tokens.length === 0 ? state : edit(state, state.tokens.slice(0, -1))
    case 'clear':
      return { ...state, tokens: [], status: EDITING }
    case 'equals':
      return equals(state)
    case 'memoryAdd':
      return adjustMemory(state, 1)
    case 'memorySubtract':
      return adjustMemory(state, -1)
    case 'memoryRecall':
      return insertValue(state, state.memory)
    case 'memoryClear':
      return { ...state, memory: 0 }
    case 'historyUseResult': {
      const entry = state.history.find((item) => item.id === action.id)
      return entry === undefined ? state : insertValue(state, entry.value)
    }
    case 'historyUseExpression': {
      const entry = state.history.find((item) => item.id === action.id)
      return entry === undefined ? state : edit(state, [...entry.tokens])
    }
    case 'historyRemove':
      return { ...state, history: state.history.filter((item) => item.id !== action.id) }
    case 'historyClear':
      return { ...state, history: [] }
    case 'setAngleUnit':
      return { ...state, angleUnit: action.angleUnit }
  }
}
