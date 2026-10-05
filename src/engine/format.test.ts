import { describe, expect, it } from 'vitest'
import { evaluate } from './evaluate'
import { formatNumber, toPlainString } from './format'

describe('formatNumber', () => {
  it.each([
    [0, '0'],
    [-0, '0'],
    [7, '7'],
    [-1, '−1'],
    [0.3, '0.3'],
    [1234567.5, '1,234,567.5'],
    [-1234567, '−1,234,567'],
    [999, '999'],
    [1000, '1,000'],
    [0.333333333333, '0.333333333333'],
    [999999999999999, '999,999,999,999,999'],
    [1e15, '1e+15'],
    [1.5e15, '1.5e+15'],
    [-2.5e20, '−2.5e+20'],
    [1e-9, '0.000000001'],
    [1.5e-8, '0.000000015'],
    [1.5e-10, '1.5e−10'],
  ])('%s formats as %s', (value, expected) => {
    expect(formatNumber(value)).toBe(expected)
  })

  it('can force scientific notation to a set number of digits', () => {
    expect(formatNumber(123456789012, { scientificDigits: 4 })).toBe('1.235e+11')
    expect(formatNumber(0.333333333333, { scientificDigits: 3 })).toBe('3.33e−1')
  })
})

describe('toPlainString', () => {
  it.each([
    [0, '0'],
    [-0, '0'],
    [-8, '-8'],
    [0.3, '0.3'],
    [1234567.5, '1234567.5'],
    [1.5e15, '1500000000000000'],
    [1e21, '1000000000000000000000'],
    [1.5e-8, '0.000000015'],
    [-2.5e-12, '-0.0000000000025'],
  ])('%s is written as %s', (value, expected) => {
    expect(toPlainString(value)).toBe(expected)
  })

  it.each([0.3, -8, 1234567.5, 1.5e15, 1.5e-8, 0.333333333333, 2e30])(
    'round-trips %s through the engine',
    (value) => {
      expect(evaluate(toPlainString(value))).toEqual({ kind: 'value', value })
    },
  )
})
