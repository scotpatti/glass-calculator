import { engineError } from './errors'
import { fail, ok, type Result } from './result'

export type OperatorSymbol = '+' | '-' | '*' | '/' | '^' | '%' | '!'

export type Token =
  | { type: 'number'; value: number; pos: number }
  | { type: 'operator'; value: OperatorSymbol; pos: number }
  | { type: 'lparen'; pos: number }
  | { type: 'rparen'; pos: number }
  | { type: 'identifier'; value: string; pos: number }

/** Characters accepted as operators, including the typographic forms the display uses. */
const OPERATOR_CHARS: Record<string, OperatorSymbol> = {
  '+': '+',
  '-': '-',
  '−': '-',
  '*': '*',
  '×': '*',
  '/': '/',
  '÷': '/',
  '^': '^',
  '%': '%',
  '!': '!',
}

/** Single characters that stand for a named function or constant. */
const IDENTIFIER_CHARS: Record<string, string> = {
  '√': 'sqrt',
  π: 'pi',
}

const isDigit = (ch: string) => ch >= '0' && ch <= '9'
const isLetter = (ch: string) => (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z')

export function tokenize(expression: string): Result<Token[]> {
  const tokens: Token[] = []
  let i = 0

  while (i < expression.length) {
    const ch = expression.charAt(i)

    if (/\s/.test(ch)) {
      i++
      continue
    }

    if (isDigit(ch) || ch === '.') {
      const start = i
      let seenPoint = false
      let digits = 0
      while (i < expression.length) {
        const c = expression.charAt(i)
        if (c === '.') {
          if (seenPoint) return fail(engineError('MALFORMED', i))
          seenPoint = true
        } else if (isDigit(c)) {
          digits++
        } else {
          break
        }
        i++
      }
      if (digits === 0) return fail(engineError('MALFORMED', start))
      tokens.push({ type: 'number', value: Number(expression.slice(start, i)), pos: start })
      continue
    }

    const operator = OPERATOR_CHARS[ch]
    if (operator !== undefined) {
      tokens.push({ type: 'operator', value: operator, pos: i })
      i++
      continue
    }

    if (ch === '(' || ch === ')') {
      tokens.push({ type: ch === '(' ? 'lparen' : 'rparen', pos: i })
      i++
      continue
    }

    const named = IDENTIFIER_CHARS[ch]
    if (named !== undefined) {
      tokens.push({ type: 'identifier', value: named, pos: i })
      i++
      continue
    }

    if (isLetter(ch)) {
      const start = i
      while (i < expression.length && isLetter(expression.charAt(i))) i++
      tokens.push({
        type: 'identifier',
        value: expression.slice(start, i).toLowerCase(),
        pos: start,
      })
      continue
    }

    return fail(engineError('MALFORMED', i))
  }

  return ok(tokens)
}
