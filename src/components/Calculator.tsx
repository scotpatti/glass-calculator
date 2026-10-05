import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { calculatorReducer, initialState, type CalculatorState } from '../state/calculator'
import { speakResult } from '../state/speech'
import { loadPersisted, loadPreference, savePersisted, savePreference } from '../state/storage'
import { Display } from './Display'
import { HistoryPanel } from './HistoryPanel'
import { Keypad } from './Keypad'
import {
  keyForKeyboard,
  MEMORY_KEYS,
  SCIENTIFIC_KEYS,
  STANDARD_KEYS,
  type KeyDefinition,
} from './keys'
import { useTheme } from './useTheme'

type Mode = 'standard' | 'scientific'

const MODE_KEY = 'glass-calculator:mode'
const MODES = ['standard', 'scientific'] as const
const HISTORY_PANEL_ID = 'history-panel'
/** How long an on-screen key stays lit after a keyboard press. */
const KEY_FLASH_MS = 140

function loadInitialState(): CalculatorState {
  return { ...initialState, ...loadPersisted() }
}

function isTextEntry(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  )
}

function isControl(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.closest('button, a[href], summary') !== null
}

export function Calculator() {
  const [state, dispatch] = useReducer(calculatorReducer, undefined, loadInitialState)
  const [mode, setMode] = useState<Mode>(() => loadPreference(MODE_KEY, MODES) ?? 'standard')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [pressedId, setPressedId] = useState<string | null>(null)
  const { theme, toggle: toggleTheme } = useTheme()
  const historyButtonRef = useRef<HTMLButtonElement>(null)
  const flashTimer = useRef<number | undefined>(undefined)
  const usingKeyboard = useRef(false)
  const focusCameFromKeyboard = useRef(false)

  const { history, memory, angleUnit } = state
  useEffect(() => {
    savePersisted({ history, memory, angleUnit })
  }, [history, memory, angleUnit])

  const press = useCallback((definition: KeyDefinition) => dispatch(definition.action), [])

  const closeHistory = useCallback(() => {
    setHistoryOpen(false)
    historyButtonRef.current?.focus()
  }, [])

  const toggleMode = () => {
    const next: Mode = mode === 'standard' ? 'scientific' : 'standard'
    setMode(next)
    savePreference(MODE_KEY, next)
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || isTextEntry(event.target)) return

      if (event.key === 'Escape' && historyOpen) {
        event.preventDefault()
        closeHistory()
        return
      }
      // Leave Enter and Space to activate a control the user reached by keyboard.
      // A control that was only clicked does not count, so Enter still means "equals".
      const activatesControl = isControl(event.target) && focusCameFromKeyboard.current
      if ((event.key === 'Enter' || event.key === ' ') && activatesControl) return

      const definition = keyForKeyboard(event.key)
      if (definition === undefined) return

      event.preventDefault()
      dispatch(definition.action)
      setPressedId(definition.id)
      window.clearTimeout(flashTimer.current)
      flashTimer.current = window.setTimeout(() => setPressedId(null), KEY_FLASH_MS)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [historyOpen, closeHistory])

  // Track whether the focused element got its focus from the keyboard or the pointer.
  useEffect(() => {
    const onKey = () => (usingKeyboard.current = true)
    const onPointer = () => (usingKeyboard.current = false)
    const onFocus = () => (focusCameFromKeyboard.current = usingKeyboard.current)

    window.addEventListener('keydown', onKey, true)
    window.addEventListener('pointerdown', onPointer, true)
    window.addEventListener('focusin', onFocus, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('pointerdown', onPointer, true)
      window.removeEventListener('focusin', onFocus, true)
    }
  }, [])

  useEffect(() => () => window.clearTimeout(flashTimer.current), [])

  const { status, tokens } = state
  const announcement = status.kind === 'result' ? speakResult(tokens, status.value) : ''
  const alert = status.kind === 'error' ? status.error.message : ''

  return (
    <div className="stage" data-mode={mode} data-history={historyOpen ? 'open' : 'closed'}>
      <div className="calculator glass">
        <div className="toolbar" role="toolbar" aria-label="Calculator options">
          <button
            type="button"
            className="tool"
            aria-pressed={mode === 'scientific'}
            onClick={toggleMode}
          >
            Scientific
          </button>
          <span className="toolbar__spacer" />
          <button
            type="button"
            className="tool"
            aria-label="History"
            aria-expanded={historyOpen}
            aria-controls={historyOpen ? HISTORY_PANEL_ID : undefined}
            ref={historyButtonRef}
            onClick={() => (historyOpen ? closeHistory() : setHistoryOpen(true))}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 12a9 9 0 1 0 3-6.7" />
              <path d="M3 4v5h5" />
              <path d="M12 7v5l3 2" />
            </svg>
          </button>
          <button
            type="button"
            className="tool"
            aria-label="Dark theme"
            aria-pressed={theme === 'dark'}
            onClick={toggleTheme}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
            </svg>
          </button>
        </div>

        <Display
          tokens={tokens}
          status={status}
          angleUnit={angleUnit}
          memory={memory}
          showAngleUnit={mode === 'scientific'}
          onToggleAngleUnit={() =>
            dispatch({ type: 'setAngleUnit', angleUnit: angleUnit === 'deg' ? 'rad' : 'deg' })
          }
        />

        <Keypad
          label="Memory"
          kind="memory"
          keys={MEMORY_KEYS}
          pressedId={pressedId}
          onPress={press}
        />
        {mode === 'scientific' && (
          <Keypad
            label="Scientific functions"
            kind="scientific"
            keys={SCIENTIFIC_KEYS}
            pressedId={pressedId}
            onPress={press}
          />
        )}
        <Keypad
          label="Keypad"
          kind="standard"
          keys={STANDARD_KEYS}
          pressedId={pressedId}
          onPress={press}
        />
      </div>

      {historyOpen && (
        <HistoryPanel
          id={HISTORY_PANEL_ID}
          entries={history}
          onUseResult={(id) => dispatch({ type: 'historyUseResult', id })}
          onUseExpression={(id) => dispatch({ type: 'historyUseExpression', id })}
          onRemove={(id) => dispatch({ type: 'historyRemove', id })}
          onClear={() => dispatch({ type: 'historyClear' })}
          onClose={closeHistory}
        />
      )}

      <div className="sr-only" role="status" aria-live="polite" data-testid="announcement">
        {announcement}
      </div>
      <div className="sr-only" role="alert" data-testid="alert">
        {alert}
      </div>
    </div>
  )
}
