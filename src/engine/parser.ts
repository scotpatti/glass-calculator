import { engineError, type EngineError } from './errors'
import { fail, ok, type Result } from './result'
import type { OperatorSymbol, Token } from './tokenizer'

export type BinaryOperator = '+' | '-' | '*' | '/' | '^'
export type PostfixOperator = '%' | '!'

export type Node =
  | { type: 'number'; value: number }
  | { type: 'constant'; name: string }
  | { type: 'negate'; operand: Node }
  | { type: 'binary'; operator: BinaryOperator; left: Node; right: Node }
  | { type: 'postfix'; operator: PostfixOperator; operand: Node }
  /** `left + right%` and `left - right%`: the percentage is taken of the left-hand value. */
  | { type: 'percentOf'; operator: '+' | '-'; left: Node; percent: Node }
  | { type: 'call'; name: string; argument: Node }

/**
 * Operator tables. Parsing is driven entirely by these, so a new operator is a
 * new row here plus its arithmetic in evaluate.ts.
 */
export const BINARY_OPERATORS: Record<BinaryOperator, { precedence: number; rightAssoc: boolean }> =
  {
    '+': { precedence: 1, rightAssoc: false },
    '-': { precedence: 1, rightAssoc: false },
    '*': { precedence: 2, rightAssoc: false },
    '/': { precedence: 2, rightAssoc: false },
    '^': { precedence: 4, rightAssoc: true },
  }

export const POSTFIX_OPERATORS: Record<PostfixOperator, { precedence: number }> = {
  '%': { precedence: 5 },
  '!': { precedence: 5 },
}

/** Binds looser than `^`, so `-2 ^ 2` is `-(2 ^ 2)`. */
const NEGATE_PRECEDENCE = 3
/** `2π` and `2(3 + 4)` multiply at the same level as `×`. */
const IMPLICIT_MULTIPLY_PRECEDENCE = BINARY_OPERATORS['*'].precedence

const isBinary = (op: OperatorSymbol): op is BinaryOperator => op in BINARY_OPERATORS
const isPostfix = (op: OperatorSymbol): op is PostfixOperator => op in POSTFIX_OPERATORS

export interface ParseOptions {
  isFunction: (name: string) => boolean
  isConstant: (name: string) => boolean
}

class ParseFailure extends Error {
  readonly detail: EngineError
  constructor(detail: EngineError) {
    super(detail.message)
    this.detail = detail
  }
}

/**
 * Parses tokens into a syntax tree. Parentheses left open at the end of the
 * input are closed implicitly.
 */
export function parse(tokens: Token[], endPos: number, options: ParseOptions): Result<Node> {
  let index = 0

  const peek = () => tokens[index]
  const malformed = (pos: number) => new ParseFailure(engineError('MALFORMED', pos))

  function closeParen() {
    const token = peek()
    if (token === undefined) return
    if (token.type !== 'rparen') throw malformed(token.pos)
    index++
  }

  function parsePrefix(): Node {
    const token = tokens[index++]
    if (token === undefined) throw malformed(endPos)

    switch (token.type) {
      case 'number':
        return { type: 'number', value: token.value }
      case 'operator':
        if (token.value !== '-') throw malformed(token.pos)
        return { type: 'negate', operand: parseExpression(NEGATE_PRECEDENCE) }
      case 'lparen': {
        const inner = parseExpression(0)
        closeParen()
        return inner
      }
      case 'identifier': {
        if (options.isConstant(token.value)) return { type: 'constant', name: token.value }
        if (!options.isFunction(token.value)) throw malformed(token.pos)
        const open = tokens[index++]
        if (open === undefined) throw malformed(endPos)
        if (open.type !== 'lparen') throw malformed(open.pos)
        const argument = parseExpression(0)
        closeParen()
        return { type: 'call', name: token.value, argument }
      }
      case 'rparen':
        throw malformed(token.pos)
    }
  }

  function parseExpression(minPrecedence: number): Node {
    let left = parsePrefix()

    for (;;) {
      const token = peek()
      if (token === undefined || token.type === 'rparen') break

      if (token.type === 'number') throw malformed(token.pos)

      if (token.type === 'lparen' || token.type === 'identifier') {
        if (IMPLICIT_MULTIPLY_PRECEDENCE < minPrecedence) break
        const right = parseExpression(IMPLICIT_MULTIPLY_PRECEDENCE + 1)
        left = { type: 'binary', operator: '*', left, right }
        continue
      }

      const operator = token.value
      if (isPostfix(operator)) {
        if (POSTFIX_OPERATORS[operator].precedence < minPrecedence) break
        index++
        left = { type: 'postfix', operator, operand: left }
        continue
      }

      if (isBinary(operator)) {
        const { precedence, rightAssoc } = BINARY_OPERATORS[operator]
        if (precedence < minPrecedence) break
        index++
        const right = parseExpression(rightAssoc ? precedence : precedence + 1)
        if ((operator === '+' || operator === '-') && isPercent(right)) {
          left = { type: 'percentOf', operator, left, percent: right.operand }
        } else {
          left = { type: 'binary', operator, left, right }
        }
        continue
      }

      throw malformed(token.pos)
    }

    return left
  }

  try {
    const tree = parseExpression(0)
    const leftover = peek()
    if (leftover !== undefined) throw malformed(leftover.pos)
    return ok(tree)
  } catch (error) {
    if (error instanceof ParseFailure) return fail(error.detail)
    // Pathologically deep nesting can exhaust the stack; treat it as bad input.
    return fail(engineError('MALFORMED'))
  }
}

function isPercent(node: Node): node is Extract<Node, { type: 'postfix' }> {
  return node.type === 'postfix' && node.operator === '%'
}
