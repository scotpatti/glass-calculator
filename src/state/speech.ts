import { formatNumber } from '../engine'
import { isNumberPart, isUnaryMinus, type InputToken } from './tokens'

const WORDS: Record<string, string> = {
  '+': 'plus',
  '−': 'minus',
  '×': 'times',
  '÷': 'divided by',
  '^': 'to the power of',
  '%': 'percent',
  '!': 'factorial',
  '(': 'open parenthesis',
  ')': 'close parenthesis',
  π: 'pi',
  e: 'e',
  'sin(': 'sine of',
  'cos(': 'cosine of',
  'tan(': 'tangent of',
  'asin(': 'inverse sine of',
  'acos(': 'inverse cosine of',
  'atan(': 'inverse tangent of',
  'ln(': 'natural log of',
  'log(': 'log of',
  '√(': 'square root of',
}

/** Reads an expression aloud in words, for example "2 plus 3". */
export function speakExpression(tokens: readonly InputToken[]): string {
  const words: string[] = []
  let number = ''
  const flush = () => {
    if (number !== '') words.push(number)
    number = ''
  }

  tokens.forEach((token, index) => {
    if (isNumberPart(token)) {
      number += token
      return
    }
    flush()
    words.push(isUnaryMinus(tokens, index) ? 'negative' : (WORDS[token] ?? token))
  })
  flush()

  return words.join(' ')
}

export function speakNumber(value: number): string {
  return formatNumber(value)
    .replace(/e([+−])(\d+)$/, (_, sign: string, exponent: string) =>
      sign === '−' ? ` times 10 to the negative ${exponent}` : ` times 10 to the ${exponent}`,
    )
    .replace(/^−/, 'negative ')
}

export function speakResult(tokens: readonly InputToken[], value: number): string {
  return `${speakExpression(tokens)} equals ${speakNumber(value)}`
}
