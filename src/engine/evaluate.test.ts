import { describe, expect, it } from 'vitest'
import type { ErrorCode } from './errors'
import { evaluate, missingClosers, type AngleUnit } from './evaluate'

type ValueCase = [expression: string, expected: number, unit?: AngleUnit]
type ErrorCase = [expression: string, code: ErrorCode, unit?: AngleUnit]

/** Add a case by adding a row: [expression, expected result, optional angle unit]. */
const VALUES: Record<string, ValueCase[]> = {
  'precedence and associativity (E2-S2)': [
    ['2 + 3 × 4', 14],
    ['10 − 4 − 3', 3],
    ['12 ÷ 3 × 2', 8],
    ['2 + 3 * 4 - 6 / 2', 11],
  ],
  'basic arithmetic (E2-S3)': [
    ['7 + 8', 15],
    ['7 − 8', -1],
    ['7 × 8', 56],
    ['56 ÷ 8', 7],
    ['1.5 × 4', 6],
    ['7 ÷ 2', 3.5],
    ['.5 + 5.', 5.5],
    ['7+8', 15],
  ],
  'unary negation (E2-S4)': [
    ['−5 + 3', -2],
    ['4 × −2', -8],
    ['−−5', 5],
    ['5 − −3', 8],
    ['-0', 0],
  ],
  'percent (E2-S5)': [
    ['50%', 0.5],
    ['200 × 10%', 20],
    ['200 ÷ 10%', 2000],
    ['200 + 10%', 220],
    ['200 − 10%', 180],
    ['200 + 10% × 2', 200.2],
    ['50% + 50%', 0.75],
  ],
  'decimal-safe precision (E2-S6)': [
    ['0.1 + 0.2', 0.3],
    ['0.3 − 0.1', 0.2],
    ['1.1 × 3', 3.3],
    ['0.1 × 3', 0.3],
    ['1 ÷ 3', 0.333333333333],
    ['0.1 + 0.2 − 0.3', 0],
    ['1 ÷ 3 × 3', 1],
  ],
  'parentheses (E8-S2)': [
    ['(2 + 3) × 4', 20],
    ['((2 + 3) × (4 − 1)) ÷ 5', 3],
    ['2(3 + 4)', 14],
    ['(2)(3)', 6],
    ['(2 + 3', 5],
    ['2 × (3 + (4 − 1', 12],
  ],
  'powers and roots (E8-S3)': [
    ['2 ^ 10', 1024],
    ['2 ^ 3 ^ 2', 512],
    ['−2 ^ 2', -4],
    ['2 ^ −1', 0.5],
    ['√(16)', 4],
    ['sqrt(16)', 4],
    ['√(2)', 1.41421356237],
    ['2√(9)', 6],
  ],
  'trigonometry in degrees (E8-S4)': [
    ['sin(30)', 0.5],
    ['cos(60)', 0.5],
    ['tan(45)', 1],
    ['sin(180)', 0],
    ['cos(90)', 0],
    ['asin(0.5)', 30],
    ['acos(0.5)', 60],
    ['atan(1)', 45],
    ['SIN(30)', 0.5],
  ],
  'trigonometry in radians (E8-S4)': [
    ['sin(π ÷ 2)', 1, 'rad'],
    ['cos(π)', -1, 'rad'],
    ['sin(π)', 0, 'rad'],
    ['atan(1) × 4', 3.14159265359, 'rad'],
  ],
  'logarithms (E8-S5)': [
    ['log(1000)', 3],
    ['ln(e)', 1],
    ['ln(1)', 0],
  ],
  'factorial and constants (E8-S6)': [
    ['5!', 120],
    ['0!', 1],
    ['3! + 2', 8],
    ['2 ^ 3!', 64],
    ['π', 3.14159265359],
    ['pi', 3.14159265359],
    ['e', 2.71828182846],
    ['2π', 6.28318530718],
    ['2π ^ 2', 19.7392088022],
  ],
}

const ERRORS: Record<string, ErrorCase[]> = {
  'malformed input (E2-S1, E2-S2, E2-S5)': [
    ['1.2.3', 'MALFORMED'],
    ['2 $ 3', 'MALFORMED'],
    ['2 +', 'MALFORMED'],
    ['2 × ÷ 3', 'MALFORMED'],
    ['%', 'MALFORMED'],
    ['.', 'MALFORMED'],
    ['2 3', 'MALFORMED'],
    ['+ 2', 'MALFORMED'],
    ['2 + 3)', 'MALFORMED'],
    ['()', 'MALFORMED'],
    ['sin 30', 'MALFORMED'],
    ['foo(2)', 'MALFORMED'],
  ],
  'impossible calculations (E2-S7)': [
    ['5 ÷ 0', 'DIVIDE_BY_ZERO'],
    ['5 ÷ (2 − 2)', 'DIVIDE_BY_ZERO'],
    ['0 ^ −1', 'DIVIDE_BY_ZERO'],
    ['10 ^ 400', 'OVERFLOW'],
    ['170! × 170!', 'OVERFLOW'],
  ],
  'domain errors (E8-S3 to E8-S6)': [
    ['√(−1)', 'DOMAIN'],
    ['(−8) ^ 0.5', 'DOMAIN'],
    ['tan(90)', 'DOMAIN'],
    ['tan(π ÷ 2)', 'DOMAIN', 'rad'],
    ['asin(2)', 'DOMAIN'],
    ['acos(−1.5)', 'DOMAIN'],
    ['log(0)', 'DOMAIN'],
    ['ln(−1)', 'DOMAIN'],
    ['(−1)!', 'DOMAIN'],
    ['2.5!', 'DOMAIN'],
    ['171!', 'OVERFLOW'],
  ],
}

describe('evaluate', () => {
  for (const [group, cases] of Object.entries(VALUES)) {
    describe(group, () => {
      it.each(cases)('%s = %s', (expression, expected, unit) => {
        expect(evaluate(expression, { angleUnit: unit })).toEqual({
          kind: 'value',
          value: expected,
        })
      })
    })
  }

  for (const [group, cases] of Object.entries(ERRORS)) {
    describe(group, () => {
      it.each(cases)('%s fails with %s', (expression, code, unit) => {
        const result = evaluate(expression, { angleUnit: unit })
        expect(result.kind).toBe('error')
        if (result.kind === 'error') {
          expect(result.error.code).toBe(code)
          expect(result.error.message).not.toBe('')
        }
      })
    })
  }

  it('returns an empty result for an empty or blank expression', () => {
    expect(evaluate('')).toEqual({ kind: 'empty' })
    expect(evaluate('   ')).toEqual({ kind: 'empty' })
  })

  it('reports where a malformed expression went wrong', () => {
    const result = evaluate('1.2.3')
    expect(result).toMatchObject({ kind: 'error', error: { code: 'MALFORMED', position: 3 } })
    expect(evaluate('2 $ 3')).toMatchObject({ kind: 'error', error: { position: 2 } })
  })

  it('never returns negative zero', () => {
    const result = evaluate('0 × −5')
    expect(result.kind === 'value' && Object.is(result.value, 0)).toBe(true)
  })

  it('survives pathologically deep nesting', () => {
    const result = evaluate('('.repeat(50_000) + '1')
    expect(['value', 'error']).toContain(result.kind)
  })

  it('never throws or yields NaN or Infinity for random key sequences (E9-S1)', () => {
    const keys = [
      ...'0123456789',
      '.',
      '+',
      '−',
      '×',
      '÷',
      '^',
      '%',
      '!',
      '(',
      ')',
      'π',
      'e',
      'sin(',
      'cos(',
      'tan(',
      'asin(',
      'acos(',
      'atan(',
      'ln(',
      'log(',
      '√(',
      ' ',
      '$',
    ]
    // Small deterministic generator so a failure is reproducible.
    let seed = 0x2545f491
    const random = () => {
      seed ^= seed << 13
      seed ^= seed >>> 17
      seed ^= seed << 5
      return (seed >>> 0) / 0x100000000
    }

    for (let run = 0; run < 20_000; run++) {
      const length = 1 + Math.floor(random() * 12)
      let expression = ''
      for (let i = 0; i < length; i++) expression += keys[Math.floor(random() * keys.length)]
      const unit: AngleUnit = run % 2 === 0 ? 'deg' : 'rad'

      const result = evaluate(expression, { angleUnit: unit })
      if (result.kind === 'value' && !Number.isFinite(result.value)) {
        throw new Error(`"${expression}" produced ${result.value}`)
      }
    }
  })
})

describe('missingClosers', () => {
  it.each([
    ['', 0],
    ['(2 + 3)', 0],
    ['(2 + 3', 1],
    ['sin((2', 2],
    ['2) + (3', 1],
  ])('%j needs %i', (expression, expected) => {
    expect(missingClosers(expression)).toBe(expected)
  })
})
