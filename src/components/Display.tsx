import { useLayoutEffect, useRef, type CSSProperties } from 'react'
import { formatNumber, missingClosers, type AngleUnit } from '../engine'
import { previewValue, type Status } from '../state/calculator'
import { speakExpression, speakNumber } from '../state/speech'
import { toDisplayString, toEngineString, type InputToken } from '../state/tokens'
import { useFittedText } from './useFittedText'

interface DisplayProps {
  tokens: InputToken[]
  status: Status
  angleUnit: AngleUnit
  memory: number
  showAngleUnit: boolean
  onToggleAngleUnit: () => void
}

type ResultKind = 'idle' | 'preview' | 'result' | 'error'

interface ResultView {
  kind: ResultKind
  /** Ways to write the value, most precise first. */
  candidates: string[]
  spoken: string
}

function numberCandidates(value: number): string[] {
  return [
    formatNumber(value),
    formatNumber(value, { scientificDigits: 10 }),
    formatNumber(value, { scientificDigits: 7 }),
    formatNumber(value, { scientificDigits: 4 }),
  ]
}

function resultView(tokens: InputToken[], status: Status, angleUnit: AngleUnit): ResultView {
  if (status.kind === 'error') {
    return { kind: 'error', candidates: [status.error.message], spoken: status.error.message }
  }
  if (status.kind === 'result') {
    return {
      kind: 'result',
      candidates: numberCandidates(status.value),
      spoken: speakNumber(status.value),
    }
  }
  if (tokens.length === 0) return { kind: 'idle', candidates: ['0'], spoken: '0' }

  const preview = previewValue(tokens, angleUnit)
  if (preview === null) return { kind: 'preview', candidates: [' '], spoken: '' }
  return { kind: 'preview', candidates: numberCandidates(preview), spoken: speakNumber(preview) }
}

export function Display({
  tokens,
  status,
  angleUnit,
  memory,
  showAngleUnit,
  onToggleAngleUnit,
}: DisplayProps) {
  const expressionRef = useRef<HTMLDivElement>(null)
  const expression = toDisplayString(tokens)
  const pendingClosers =
    status.kind === 'editing' ? ')'.repeat(missingClosers(toEngineString(tokens))) : ''

  const view = resultView(tokens, status, angleUnit)
  const { boxRef, probeRef, text, scale } = useFittedText(view.candidates)

  // Keep the most recent input in view when the expression is wider than the display.
  useLayoutEffect(() => {
    const element = expressionRef.current
    if (element !== null) element.scrollLeft = element.scrollWidth
  }, [expression])

  return (
    <div
      className="display"
      role="group"
      aria-label="Display"
      tabIndex={0}
      data-status={status.kind}
    >
      <div className="display__status">
        {memory !== 0 && (
          <span className="badge" title="A value is stored in memory">
            <span aria-hidden="true">M</span>
            <span className="sr-only">Memory holds {speakNumber(memory)}</span>
          </span>
        )}
        {showAngleUnit && (
          <button
            type="button"
            className="badge"
            aria-label={`Angle unit: ${angleUnit === 'deg' ? 'degrees' : 'radians'}. Switch to ${
              angleUnit === 'deg' ? 'radians' : 'degrees'
            }`}
            onClick={onToggleAngleUnit}
          >
            {angleUnit === 'deg' ? 'DEG' : 'RAD'}
          </button>
        )}
      </div>

      <div className="display__expression" ref={expressionRef} data-testid="expression">
        <span className="sr-only">
          {tokens.length === 0 ? 'No expression' : `Expression: ${speakExpression(tokens)}`}
        </span>
        <span aria-hidden="true">
          {expression}
          {pendingClosers !== '' && <span className="display__ghost">{pendingClosers}</span>}
        </span>
      </div>

      <div className="display__result" ref={boxRef}>
        <span className="sr-only">
          {view.kind === 'error' ? `Error: ${view.spoken}` : `Result: ${view.spoken}`}
        </span>
        <span
          // Remounting on each new final result or error replays its animation.
          key={
            view.kind === 'result' || view.kind === 'error' ? `${view.kind}:${expression}` : 'live'
          }
          className="display__value"
          data-kind={view.kind}
          data-testid="result"
          aria-hidden="true"
          style={{ '--fit-scale': scale } as CSSProperties}
        >
          {text}
        </span>
        <span className="display__probe" ref={probeRef} aria-hidden="true" />
      </div>
    </div>
  )
}
