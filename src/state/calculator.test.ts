import { describe, expect, it } from 'vitest'
import {
  calculatorReducer,
  currentValue,
  HISTORY_LIMIT,
  initialState,
  type Action,
  type CalculatorState,
} from './calculator'
import { speakResult } from './speech'
import { toDisplayString, toEngineString } from './tokens'

const KEY_ACTIONS: Record<string, Action> = {
  '.': { type: 'decimal' },
  '+': { type: 'binary', operator: '+' },
  '-': { type: 'binary', operator: '−' },
  '*': { type: 'binary', operator: '×' },
  '/': { type: 'binary', operator: '÷' },
  '^': { type: 'binary', operator: '^' },
  '%': { type: 'postfix', operator: '%' },
  '!': { type: 'postfix', operator: '!' },
  '(': { type: 'openParen' },
  ')': { type: 'closeParen' },
  '=': { type: 'equals' },
  '<': { type: 'backspace' },
  C: { type: 'clear' },
  '~': { type: 'toggleSign' },
  p: { type: 'constant', name: 'π' },
  e: { type: 'constant', name: 'e' },
  s: { type: 'function', name: 'sin' },
  r: { type: 'function', name: '√' },
  q: { type: 'square' },
}

/** Plays a string of key presses: digits and the shorthand above. */
function press(keys: string, from: CalculatorState = initialState): CalculatorState {
  return [...keys].reduce((state, key) => {
    const action = KEY_ACTIONS[key] ?? ({ type: 'digit', digit: key } satisfies Action)
    return calculatorReducer(state, action)
  }, from)
}

const shown = (keys: string, from?: CalculatorState) => toDisplayString(press(keys, from).tokens)

describe('input rules (E5-S3)', () => {
  it.each([
    ['1.2.3', '1.23'],
    ['5+*', '5 × '],
    ['5*-', '5 × −'],
    ['5/-3', '5 ÷ −3'],
    ['5+-', '5 − '],
    ['5*-+', '5 + '],
    ['05', '5'],
    ['007', '7'],
    ['0.5', '0.5'],
    ['.', '0.'],
    ['5+.', '5 + 0.'],
    ['+', ''],
    ['*', ''],
    ['/', ''],
    ['%', ''],
    ['-', '−'],
    ['-+', '−'],
    ['(*', '('],
    ['(-', '(−'],
  ])('%s shows %j', (keys, expected) => {
    expect(shown(keys)).toBe(expected)
  })

  it.each([
    ['5~', '−5'],
    ['5~~', '5'],
    ['5*3~', '5 × −3'],
    ['5+3~', '5 − 3'],
    ['5-3~', '5 + 3'],
    ['~', '−'],
    ['~~', ''],
  ])('sign toggle: %s shows %j', (keys, expected) => {
    expect(shown(keys)).toBe(expected)
  })

  it('multiplies when a digit follows a bracket, constant or postfix operator', () => {
    expect(shown('(2)3')).toBe('(2) × 3')
    expect(shown('p2')).toBe('π × 2')
    expect(shown('5%2')).toBe('5% × 2')
  })

  it('only closes brackets that are open and non-empty', () => {
    expect(shown(')')).toBe('')
    expect(shown('(2+3))')).toBe('(2 + 3)')
    expect(shown('()')).toBe('(')
    expect(shown('(2+)')).toBe('(2 + ')
  })

  it('squares only a complete operand', () => {
    expect(shown('5q')).toBe('5 ^ 2')
    expect(shown('5+q')).toBe('5 + ')
  })
})

describe('clear and delete (E5-S4)', () => {
  it('backspace removes one token, taking a function name as a unit', () => {
    expect(shown('12<')).toBe('1')
    expect(shown('2s<')).toBe('2')
    expect(shown('<')).toBe('')
  })

  it('all clear empties the expression but keeps history and memory', () => {
    const state = press('2+3=', { ...initialState, memory: 7 })
    const cleared = press('C', state)
    expect(cleared.tokens).toEqual([])
    expect(cleared.status).toEqual({ kind: 'editing' })
    expect(cleared.history).toHaveLength(1)
    expect(cleared.memory).toBe(7)
  })

  it('after an error, backspace reopens the expression and all clear empties it', () => {
    const failed = press('5/0=')
    expect(failed.status).toMatchObject({ kind: 'error', error: { code: 'DIVIDE_BY_ZERO' } })
    const reopened = press('<', failed)
    expect(reopened.status.kind).toBe('editing')
    expect(toDisplayString(reopened.tokens)).toBe('5 ÷ 0')
    expect(press('C', failed).tokens).toEqual([])
  })
})

describe('equals and continuing (E5-S5)', () => {
  it('shows the result and keeps the expression', () => {
    const state = press('2+3*4=')
    expect(state.status).toEqual({ kind: 'result', value: 14 })
    expect(toDisplayString(state.tokens)).toBe('2 + 3 × 4')
  })

  it('does nothing on an empty or already evaluated expression', () => {
    expect(press('=')).toBe(initialState)
    const once = press('2+3=')
    expect(press('=', once)).toBe(once)
  })

  it('continues from the result when an operator follows', () => {
    const state = press('2+3=*4=')
    expect(toDisplayString(state.tokens)).toBe('5 × 4')
    expect(state.status).toEqual({ kind: 'result', value: 20 })
  })

  it('starts fresh when a digit or decimal point follows', () => {
    expect(shown('2+3=7')).toBe('7')
    expect(shown('2+3=.')).toBe('0.')
  })

  it('keeps a negative result intact when raising it to a power', () => {
    const state = press('2-5=q=')
    expect(toDisplayString(state.tokens)).toBe('(−3) ^ 2')
    expect(state.status).toEqual({ kind: 'result', value: 9 })
  })

  it('leaves an invalid expression editable', () => {
    const state = press('2+=')
    expect(state.status.kind).toBe('error')
    expect(shown('3=', state)).toBe('2 + 3')
    expect(press('3=', state).status).toEqual({ kind: 'result', value: 5 })
  })

  it('closes open brackets on equals', () => {
    const state = press('2*(3+4=')
    expect(toDisplayString(state.tokens)).toBe('2 × (3 + 4)')
    expect(state.status).toEqual({ kind: 'result', value: 14 })
  })

  it('negates a shown result with the sign toggle', () => {
    expect(shown('2+3=~')).toBe('−5')
  })
})

describe('scientific input (E8)', () => {
  it('evaluates functions, constants and implicit multiplication', () => {
    expect(press('s30)=').status).toEqual({ kind: 'result', value: 0.5 })
    expect(press('2p=').status).toEqual({ kind: 'result', value: 6.28318530718 })
    expect(press('r16=').status).toEqual({ kind: 'result', value: 4 })
    expect(press('5!=').status).toEqual({ kind: 'result', value: 120 })
  })

  it('keeps the constant e separate from a following function name', () => {
    expect(toEngineString(press('es').tokens)).toBe(' e sin(')
    expect(press('es90)=').status).toEqual({ kind: 'result', value: 2.71828182846 })
  })

  it('uses the selected angle unit', () => {
    const radians = calculatorReducer(initialState, { type: 'setAngleUnit', angleUnit: 'rad' })
    expect(press('sp/2)=', radians).status).toEqual({ kind: 'result', value: 1 })
  })
})

describe('history (E7-S1, E7-S3, E7-S4)', () => {
  it('records completed calculations, newest first', () => {
    const state = press('1+1=C2*3=')
    expect(state.history.map((entry) => [toDisplayString(entry.tokens), entry.value])).toEqual([
      ['2 × 3', 6],
      ['1 + 1', 2],
    ])
  })

  it('does not record errors or an immediate repeat', () => {
    expect(press('5/0=').history).toEqual([])
    expect(press('1+1=C1+1=').history).toHaveLength(1)
  })

  it('keeps only the most recent entries', () => {
    let state = initialState
    for (let i = 0; i < HISTORY_LIMIT + 5; i++) state = press(`${i}+1=C`, state)
    expect(state.history).toHaveLength(HISTORY_LIMIT)
    expect(state.history[0]?.value).toBe(HISTORY_LIMIT + 5)
    expect(new Set(state.history.map((entry) => entry.id)).size).toBe(HISTORY_LIMIT)
  })

  it('reuses a result at the end of the current expression', () => {
    const state = press('2*3=C10+')
    const id = state.history[0]?.id ?? -1
    const reused = calculatorReducer(state, { type: 'historyUseResult', id })
    expect(toDisplayString(reused.tokens)).toBe('10 + 6')
  })

  it('reuses an expression for editing', () => {
    const state = press('2*3=C10+')
    const id = state.history[0]?.id ?? -1
    const reused = calculatorReducer(state, { type: 'historyUseExpression', id })
    expect(toDisplayString(reused.tokens)).toBe('2 × 3')
    expect(reused.status.kind).toBe('editing')
  })

  it('removes one entry or all of them without touching the expression or memory', () => {
    const state = press('1+1=C2+2=C9', { ...initialState, memory: 4 })
    const id = state.history[0]?.id ?? -1
    const removed = calculatorReducer(state, { type: 'historyRemove', id })
    expect(removed.history.map((entry) => entry.value)).toEqual([2])
    const cleared = calculatorReducer(state, { type: 'historyClear' })
    expect(cleared.history).toEqual([])
    expect(toDisplayString(cleared.tokens)).toBe('9')
    expect(cleared.memory).toBe(4)
  })
})

describe('memory (E7-S5)', () => {
  const act = (state: CalculatorState, type: Action['type']) =>
    calculatorReducer(state, { type } as Action)

  it('adds and subtracts the current result', () => {
    let state = act(press('2+3='), 'memoryAdd')
    expect(state.memory).toBe(5)
    state = act(press('C2=', state), 'memorySubtract')
    expect(state.memory).toBe(3)
  })

  it('uses the live preview while typing', () => {
    expect(act(press('4*5'), 'memoryAdd').memory).toBe(20)
  })

  it('does nothing without a valid current result', () => {
    expect(act(initialState, 'memoryAdd')).toBe(initialState)
    const failed = press('5/0=')
    expect(act(failed, 'memoryAdd')).toBe(failed)
  })

  it('recalls into the expression, replacing a number being typed', () => {
    const base = { ...initialState, memory: 8 }
    expect(toDisplayString(act(press('5+', base), 'memoryRecall').tokens)).toBe('5 + 8')
    expect(toDisplayString(act(press('5+12', base), 'memoryRecall').tokens)).toBe('5 + 8')
    expect(toDisplayString(act(press('(2)', base), 'memoryRecall').tokens)).toBe('(2) × 8')
  })

  it('clears', () => {
    expect(act({ ...initialState, memory: 8 }, 'memoryClear').memory).toBe(0)
  })

  it('avoids floating-point residue', () => {
    let state = act(press('0.1='), 'memoryAdd')
    state = act(press('C0.2=', state), 'memoryAdd')
    expect(state.memory).toBe(0.3)
  })
})

describe('currentValue', () => {
  it('ignores a dangling operator or open bracket', () => {
    expect(currentValue(press('5+'))).toBe(5)
    expect(currentValue(press('5*('))).toBe(5)
    expect(currentValue(press(''))).toBeNull()
    expect(currentValue(press('5/0'))).toBeNull()
  })
})

describe('speech (E6-S2)', () => {
  it('reads operators as words', () => {
    const state = press('2+3=')
    expect(speakResult(state.tokens, 5)).toBe('2 plus 3 equals 5')
  })

  it('distinguishes a negative sign from subtraction', () => {
    const state = press('4*-2.5-1=')
    expect(speakResult(state.tokens, -11)).toBe('4 times negative 2.5 minus 1 equals negative 11')
  })

  it('reads functions and large numbers', () => {
    expect(speakResult(press('s30)').tokens, 0.5)).toBe('sine of 30 close parenthesis equals 0.5')
    expect(speakResult(press('5').tokens, 1.5e-10)).toBe('5 equals 1.5 times 10 to the negative 10')
  })
})
