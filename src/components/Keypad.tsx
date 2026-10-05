import { Key } from './Key'
import type { KeyDefinition } from './keys'

interface KeypadProps {
  label: string
  kind: 'memory' | 'scientific' | 'standard'
  keys: KeyDefinition[]
  pressedId: string | null
  onPress: (definition: KeyDefinition) => void
}

export function Keypad({ label, kind, keys, pressedId, onPress }: KeypadProps) {
  return (
    <div className={`keypad keypad--${kind}`} role="group" aria-label={label}>
      {keys.map((definition) => (
        <Key
          key={definition.id}
          definition={definition}
          pressed={pressedId === definition.id}
          onPress={onPress}
        />
      ))}
    </div>
  )
}
