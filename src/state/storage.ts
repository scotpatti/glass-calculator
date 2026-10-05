import type { AngleUnit } from '../engine'
import { HISTORY_LIMIT, type CalculatorState, type HistoryEntry } from './calculator'

export const STORAGE_KEY = 'glass-calculator:state'
export const STORAGE_VERSION = 1

export type PersistedState = Pick<CalculatorState, 'history' | 'memory' | 'angleUnit'>

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

/** Returns local storage, or null where it is blocked (for example in some private modes). */
export function getStore(): Store | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isAngleUnit = (value: unknown): value is AngleUnit => value === 'deg' || value === 'rad'

function isHistoryEntry(value: unknown): value is HistoryEntry {
  return (
    isRecord(value) &&
    typeof value.id === 'number' &&
    typeof value.value === 'number' &&
    Number.isFinite(value.value) &&
    isAngleUnit(value.angleUnit) &&
    Array.isArray(value.tokens) &&
    value.tokens.every((token) => typeof token === 'string')
  )
}

/** Reads saved history and memory. Missing, outdated or corrupt data yields null. */
export function loadPersisted(store: Store | null = getStore()): PersistedState | null {
  if (store === null) return null
  try {
    const raw = store.getItem(STORAGE_KEY)
    if (raw === null) return null
    const data: unknown = JSON.parse(raw)
    if (
      !isRecord(data) ||
      data.version !== STORAGE_VERSION ||
      typeof data.memory !== 'number' ||
      !Number.isFinite(data.memory) ||
      !isAngleUnit(data.angleUnit) ||
      !Array.isArray(data.history) ||
      !data.history.every(isHistoryEntry)
    ) {
      return null
    }
    return {
      memory: data.memory,
      angleUnit: data.angleUnit,
      history: data.history.slice(0, HISTORY_LIMIT),
    }
  } catch {
    return null
  }
}

/** Saves history and memory. Failure (storage full or blocked) is ignored. */
export function savePersisted(state: PersistedState, store: Store | null = getStore()): void {
  if (store === null) return
  try {
    store.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: STORAGE_VERSION,
        memory: state.memory,
        angleUnit: state.angleUnit,
        history: state.history,
      }),
    )
  } catch {
    // Keep running with in-session state only.
  }
}

/** Reads a single saved preference such as the theme or keypad mode. */
export function loadPreference<T extends string>(
  key: string,
  allowed: readonly T[],
  store: Store | null = getStore(),
): T | null {
  if (store === null) return null
  try {
    const value = store.getItem(key)
    return allowed.find((option) => option === value) ?? null
  } catch {
    return null
  }
}

export function savePreference(
  key: string,
  value: string | null,
  store: Store | null = getStore(),
): void {
  if (store === null) return
  try {
    if (value === null) store.removeItem(key)
    else store.setItem(key, value)
  } catch {
    // Preference simply will not persist.
  }
}
