import { useLayoutEffect, useRef, useState } from 'react'

/** Font scales tried in order; 0.6 is the smallest the result text may get. */
const SCALES = [1, 0.9, 0.8, 0.7, 0.6]

interface Fit {
  index: number
  scale: number
}

/**
 * Picks how to show a value in a fixed-width box. Each candidate is tried in
 * turn (most precise first), shrinking the font in steps; if a candidate does
 * not fit even at the smallest scale, the next, shorter candidate is used.
 */
export function useFittedText(candidates: readonly string[]) {
  const boxRef = useRef<HTMLDivElement>(null)
  const probeRef = useRef<HTMLSpanElement>(null)
  const [fit, setFit] = useState<Fit>({ index: 0, scale: 1 })
  const signature = candidates.join('\n')

  useLayoutEffect(() => {
    const box = boxRef.current
    const probe = probeRef.current
    if (box === null || probe === null) return

    const options = signature.split('\n')
    const measure = () => {
      const available = box.clientWidth
      let next: Fit = { index: 0, scale: 1 }
      if (available > 0) {
        for (const [index, option] of options.entries()) {
          probe.textContent = option
          const width = probe.getBoundingClientRect().width
          const scale = SCALES.find((candidate) => width * candidate <= available)
          next = { index, scale: scale ?? SCALES[SCALES.length - 1] ?? 1 }
          if (scale !== undefined) break
        }
        probe.textContent = ''
      }
      setFit((previous) =>
        previous.index === next.index && previous.scale === next.scale ? previous : next,
      )
    }

    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(box)
    return () => observer.disconnect()
  }, [signature])

  const index = Math.min(fit.index, candidates.length - 1)
  return { boxRef, probeRef, text: candidates[index] ?? '', scale: fit.scale }
}
