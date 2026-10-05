import { describe, expect, it } from 'vitest'
import { tokenize, type Token } from './tokenizer'

function tokens(expression: string): Token[] {
  const result = tokenize(expression)
  if (!result.ok) throw new Error(`unexpected failure: ${result.error.message}`)
  return result.value
}

describe('tokenize', () => {
  it('splits numbers and operators', () => {
    expect(tokens('12.5+3')).toEqual([
      { type: 'number', value: 12.5, pos: 0 },
      { type: 'operator', value: '+', pos: 4 },
      { type: 'number', value: 3, pos: 5 },
    ])
  })

  it('treats typographic and ASCII operators alike', () => {
    const values = (expression: string) =>
      tokens(expression).map((token) => ('value' in token ? token.value : token.type))
    expect(values('1 × 2 ÷ 3 − 4')).toEqual(values('1 * 2 / 3 - 4'))
  })

  it('ignores whitespace', () => {
    expect(tokens('  1 \t+\n 2 ')).toHaveLength(3)
  })

  it('accepts a leading or trailing decimal point', () => {
    expect(tokens('.5')).toEqual([{ type: 'number', value: 0.5, pos: 0 }])
    expect(tokens('5.')).toEqual([{ type: 'number', value: 5, pos: 0 }])
  })

  it('reads parentheses, functions and constants', () => {
    expect(tokens('√(π)').map((token) => token.type)).toEqual([
      'identifier',
      'lparen',
      'identifier',
      'rparen',
    ])
    expect(tokens('Sin')).toEqual([{ type: 'identifier', value: 'sin', pos: 0 }])
  })

  it.each([
    ['1.2.3', 3],
    ['2 $ 3', 2],
    ['.', 0],
  ])('rejects %j at position %i', (expression, position) => {
    expect(tokenize(expression)).toEqual({
      ok: false,
      error: { code: 'MALFORMED', message: 'Invalid expression', position },
    })
  })
})
