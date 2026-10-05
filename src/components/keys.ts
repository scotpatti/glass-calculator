import type { Action } from '../state/calculator'

export type KeyVariant = 'digit' | 'operator' | 'function' | 'equals' | 'memory' | 'scientific'

export interface KeyDefinition {
  id: string
  /** What is drawn on the key. */
  label: string
  /** What a screen reader says. */
  name: string
  variant: KeyVariant
  action: Action
}

const digit = (value: string): KeyDefinition => ({
  id: value,
  label: value,
  name: value,
  variant: 'digit',
  action: { type: 'digit', digit: value },
})

const fn = (
  id: string,
  label: string,
  name: string,
  action: Action,
  variant: KeyVariant = 'scientific',
): KeyDefinition => ({ id, label, name, variant, action })

/** Four columns, read left to right, top to bottom. */
export const STANDARD_KEYS: KeyDefinition[] = [
  fn('clear', 'AC', 'all clear', { type: 'clear' }, 'function'),
  fn('backspace', '⌫', 'backspace', { type: 'backspace' }, 'function'),
  fn('percent', '%', 'percent', { type: 'postfix', operator: '%' }, 'function'),
  fn('divide', '÷', 'divide', { type: 'binary', operator: '÷' }, 'operator'),
  digit('7'),
  digit('8'),
  digit('9'),
  fn('multiply', '×', 'multiply', { type: 'binary', operator: '×' }, 'operator'),
  digit('4'),
  digit('5'),
  digit('6'),
  fn('subtract', '−', 'subtract', { type: 'binary', operator: '−' }, 'operator'),
  digit('1'),
  digit('2'),
  digit('3'),
  fn('add', '+', 'add', { type: 'binary', operator: '+' }, 'operator'),
  fn('sign', '±', 'toggle sign', { type: 'toggleSign' }, 'function'),
  digit('0'),
  fn('decimal', '.', 'decimal point', { type: 'decimal' }, 'digit'),
  fn('equals', '=', 'equals', { type: 'equals' }, 'equals'),
]

export const MEMORY_KEYS: KeyDefinition[] = [
  fn('memory-clear', 'MC', 'memory clear', { type: 'memoryClear' }, 'memory'),
  fn('memory-recall', 'MR', 'memory recall', { type: 'memoryRecall' }, 'memory'),
  fn('memory-add', 'M+', 'memory add', { type: 'memoryAdd' }, 'memory'),
  fn('memory-subtract', 'M−', 'memory subtract', { type: 'memorySubtract' }, 'memory'),
]

export const SCIENTIFIC_KEYS: KeyDefinition[] = [
  fn('open-paren', '(', 'open parenthesis', { type: 'openParen' }),
  fn('close-paren', ')', 'close parenthesis', { type: 'closeParen' }),
  fn('power', 'xʸ', 'to the power of', { type: 'binary', operator: '^' }),
  fn('square', 'x²', 'squared', { type: 'square' }),
  fn('sqrt', '√', 'square root', { type: 'function', name: '√' }),
  fn('factorial', 'x!', 'factorial', { type: 'postfix', operator: '!' }),
  fn('pi', 'π', 'pi', { type: 'constant', name: 'π' }),
  fn('euler', 'e', "Euler's number", { type: 'constant', name: 'e' }),
  fn('sin', 'sin', 'sine', { type: 'function', name: 'sin' }),
  fn('cos', 'cos', 'cosine', { type: 'function', name: 'cos' }),
  fn('tan', 'tan', 'tangent', { type: 'function', name: 'tan' }),
  fn('ln', 'ln', 'natural logarithm', { type: 'function', name: 'ln' }),
  fn('asin', 'sin⁻¹', 'inverse sine', { type: 'function', name: 'asin' }),
  fn('acos', 'cos⁻¹', 'inverse cosine', { type: 'function', name: 'acos' }),
  fn('atan', 'tan⁻¹', 'inverse tangent', { type: 'function', name: 'atan' }),
  fn('log', 'log', 'logarithm base 10', { type: 'function', name: 'log' }),
]

const ALL_KEYS = [...STANDARD_KEYS, ...MEMORY_KEYS, ...SCIENTIFIC_KEYS]
const KEYS_BY_ID = new Map(ALL_KEYS.map((key) => [key.id, key]))

/** Physical keyboard keys (KeyboardEvent.key) mapped to calculator key ids. */
const KEYBOARD: Record<string, string> = {
  '.': 'decimal',
  ',': 'decimal',
  '+': 'add',
  '-': 'subtract',
  '*': 'multiply',
  '/': 'divide',
  '%': 'percent',
  '=': 'equals',
  Enter: 'equals',
  Backspace: 'backspace',
  Escape: 'clear',
  '(': 'open-paren',
  ')': 'close-paren',
  '^': 'power',
  '!': 'factorial',
}

/** Finds the calculator key a keyboard key stands for, if any. */
export function keyForKeyboard(key: string): KeyDefinition | undefined {
  return KEYS_BY_ID.get(KEYBOARD[key] ?? key)
}
