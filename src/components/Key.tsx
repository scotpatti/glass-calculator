import type { KeyDefinition } from './keys'

interface KeyProps {
  definition: KeyDefinition
  pressed: boolean
  onPress: (definition: KeyDefinition) => void
}

export function Key({ definition, pressed, onPress }: KeyProps) {
  return (
    <button
      type="button"
      className={`key key--${definition.variant}`}
      aria-label={definition.name}
      data-key={definition.id}
      data-pressed={pressed}
      // Keep focus where it is on pointer presses, so Enter still means "equals"
      // after clicking a key. Keyboard users can still Tab to every key.
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => onPress(definition)}
    >
      <span aria-hidden="true">{definition.label}</span>
    </button>
  )
}
