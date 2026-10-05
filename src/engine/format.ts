import { SIGNIFICANT_DIGITS } from './evaluate'

const SCIENTIFIC_UPPER = 1e15
const SCIENTIFIC_LOWER = 1e-9
const MINUS = '−'

/**
 * Writes a number as plain decimal digits with an ASCII minus and no grouping
 * or exponent, so it can be placed back into an expression.
 */
export function toPlainString(value: number): string {
  if (value === 0) return '0'
  const magnitude = Math.abs(value)
  const sign = value < 0 ? '-' : ''

  if (magnitude >= 1e21) return sign + BigInt(magnitude).toString()
  if (magnitude >= 1e-6) return sign + String(magnitude)

  const decimals = Math.min(100, SIGNIFICANT_DIGITS - 1 - Math.floor(Math.log10(magnitude)))
  return sign + magnitude.toFixed(decimals).replace(/0+$/, '')
}

function toScientific(value: number, significantDigits: number): string {
  const [mantissa = '0', exponent = '+0'] = value.toExponential(significantDigits - 1).split('e')
  const trimmed = mantissa.includes('.') ? mantissa.replace(/\.?0+$/, '') : mantissa
  return `${trimmed}e${exponent}`.replace('-', MINUS).replace('-', MINUS)
}

export interface FormatOptions {
  /** Forces scientific notation with at most this many significant digits. */
  scientificDigits?: number
}

/** Formats a result for the display: grouped thousands, or scientific notation at the extremes. */
export function formatNumber(value: number, options: FormatOptions = {}): string {
  if (value === 0) return '0'

  const magnitude = Math.abs(value)
  if (options.scientificDigits !== undefined) {
    return toScientific(value, options.scientificDigits)
  }
  if (magnitude >= SCIENTIFIC_UPPER || magnitude < SCIENTIFIC_LOWER) {
    return toScientific(value, SIGNIFICANT_DIGITS)
  }

  const [integer = '0', fraction] = toPlainString(magnitude).split('.')
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const sign = value < 0 ? MINUS : ''
  return fraction === undefined ? sign + grouped : `${sign}${grouped}.${fraction}`
}
