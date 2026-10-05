import { useEffect, useRef, useState } from 'react'
import { formatNumber } from '../engine'
import type { HistoryEntry } from '../state/calculator'
import { speakExpression, speakNumber } from '../state/speech'
import { toDisplayString } from '../state/tokens'

interface HistoryPanelProps {
  id: string
  entries: HistoryEntry[]
  onUseResult: (id: number) => void
  onUseExpression: (id: number) => void
  onRemove: (id: number) => void
  onClear: () => void
  onClose: () => void
}

export function HistoryPanel({
  id,
  entries,
  onUseResult,
  onUseExpression,
  onRemove,
  onClear,
  onClose,
}: HistoryPanelProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  return (
    <section className="history" id={id} aria-label="History">
      <header className="history__header">
        <h2 className="history__title">History</h2>
        <button
          type="button"
          className="icon-button"
          aria-label="Close history"
          ref={closeRef}
          onClick={onClose}
        >
          <span aria-hidden="true">×</span>
        </button>
      </header>

      {entries.length === 0 ? (
        <p className="history__empty">No calculations yet.</p>
      ) : (
        <ul className="history__list">
          {entries.map((entry) => {
            const spoken = speakExpression(entry.tokens)
            return (
              <li key={entry.id} className="history__entry">
                <button
                  type="button"
                  className="history__button history__button--expression"
                  aria-label={`Edit expression: ${spoken}`}
                  onClick={() => onUseExpression(entry.id)}
                >
                  {toDisplayString(entry.tokens)}
                </button>
                <button
                  type="button"
                  className="history__button history__button--result"
                  aria-label={`Use result: ${speakNumber(entry.value)}`}
                  onClick={() => onUseResult(entry.id)}
                >
                  = {formatNumber(entry.value)}
                </button>
                <button
                  type="button"
                  className="icon-button history__remove"
                  aria-label={`Remove from history: ${spoken}`}
                  onClick={() => onRemove(entry.id)}
                >
                  <span aria-hidden="true">×</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {entries.length > 0 && (
        <footer className="history__footer">
          {confirming ? (
            <>
              <span className="history__prompt">Clear all history?</span>
              <button
                type="button"
                className="tool"
                onClick={() => {
                  setConfirming(false)
                  onClear()
                  closeRef.current?.focus()
                }}
              >
                Clear
              </button>
              <button type="button" className="tool" onClick={() => setConfirming(false)}>
                Cancel
              </button>
            </>
          ) : (
            <button type="button" className="tool" onClick={() => setConfirming(true)}>
              Clear history
            </button>
          )}
        </footer>
      )}
    </section>
  )
}
