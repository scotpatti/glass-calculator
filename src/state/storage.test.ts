import { describe, expect, it } from 'vitest'
import {
  loadPersisted,
  loadPreference,
  savePersisted,
  savePreference,
  STORAGE_KEY,
  STORAGE_VERSION,
  type PersistedState,
} from './storage'

function memoryStore(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  }
}

const brokenStore = {
  getItem: () => {
    throw new Error('blocked')
  },
  setItem: () => {
    throw new Error('quota exceeded')
  },
  removeItem: () => {
    throw new Error('blocked')
  },
}

const sample: PersistedState = {
  memory: 4.5,
  angleUnit: 'rad',
  history: [{ id: 1, tokens: ['2', '+', '3'], value: 5, angleUnit: 'deg' }],
}

describe('persistence (E7-S6)', () => {
  it('round-trips history, memory and angle unit', () => {
    const store = memoryStore()
    savePersisted(sample, store)
    expect(loadPersisted(store)).toEqual(sample)
  })

  it('returns null when nothing is stored', () => {
    expect(loadPersisted(memoryStore())).toBeNull()
  })

  it('discards data from an unrecognized version', () => {
    const stored = JSON.stringify({ ...sample, version: STORAGE_VERSION + 1 })
    expect(loadPersisted(memoryStore({ [STORAGE_KEY]: stored }))).toBeNull()
  })

  it.each([
    ['not json', '{oops'],
    ['wrong shape', JSON.stringify({ version: STORAGE_VERSION, memory: 'lots' })],
    [
      'bad history entry',
      JSON.stringify({ ...sample, version: STORAGE_VERSION, history: [{ id: 'x' }] }),
    ],
    ['a bare value', '42'],
  ])('discards corrupt data: %s', (_, stored) => {
    expect(loadPersisted(memoryStore({ [STORAGE_KEY]: stored }))).toBeNull()
  })

  it('carries on when storage is unavailable or full', () => {
    expect(loadPersisted(null)).toBeNull()
    expect(loadPersisted(brokenStore)).toBeNull()
    expect(() => savePersisted(sample, brokenStore)).not.toThrow()
    expect(() => savePersisted(sample, null)).not.toThrow()
  })
})

describe('preferences', () => {
  it('round-trips an allowed value and rejects others', () => {
    const store = memoryStore()
    savePreference('theme', 'dark', store)
    expect(loadPreference('theme', ['light', 'dark'], store)).toBe('dark')
    expect(loadPreference('theme', ['light'], store)).toBeNull()
    savePreference('theme', null, store)
    expect(loadPreference('theme', ['light', 'dark'], store)).toBeNull()
  })

  it('carries on when storage is unavailable', () => {
    expect(loadPreference('theme', ['light'], brokenStore)).toBeNull()
    expect(() => savePreference('theme', 'dark', brokenStore)).not.toThrow()
  })
})
