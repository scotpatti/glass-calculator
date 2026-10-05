import type { EngineError } from './errors'

export type Result<T> = { ok: true; value: T } | { ok: false; error: EngineError }

export function ok<T>(value: T): Result<T> {
  return { ok: true, value }
}

export function fail<T>(error: EngineError): Result<T> {
  return { ok: false, error }
}
