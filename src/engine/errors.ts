export const ERROR_MESSAGES = {
  DIVIDE_BY_ZERO: "Can't divide by zero",
  MALFORMED: 'Invalid expression',
  OVERFLOW: 'Number too large',
  DOMAIN: 'Not defined',
} as const

export type ErrorCode = keyof typeof ERROR_MESSAGES

export interface EngineError {
  code: ErrorCode
  message: string
  /** Index into the expression string where the problem was detected, when known. */
  position?: number
}

export function engineError(code: ErrorCode, position?: number): EngineError {
  return position === undefined
    ? { code, message: ERROR_MESSAGES[code] }
    : { code, message: ERROR_MESSAGES[code], position }
}
