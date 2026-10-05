import { describe, expect, it } from 'vitest'
import { engineError } from './errors'

describe('engineError', () => {
  it('pairs a stable code with a readable message', () => {
    expect(engineError('DIVIDE_BY_ZERO')).toEqual({
      code: 'DIVIDE_BY_ZERO',
      message: "Can't divide by zero",
    })
  })

  it('records the position when one is given', () => {
    expect(engineError('MALFORMED', 3).position).toBe(3)
  })
})
