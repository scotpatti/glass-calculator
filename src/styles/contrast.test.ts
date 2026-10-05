import { describe, expect, it } from 'vitest'
import tokensCss from './tokens.css?raw'

/**
 * Checks text and border contrast against the design tokens (E6-S4).
 *
 * Glass surfaces are translucent, so what sits behind the text varies. Blurring
 * only averages the backdrop, so every backdrop color lies between the lightest
 * and darkest palette colors; checking each palette color on its own therefore
 * covers the extremes.
 */

type Rgba = [r: number, g: number, b: number, a: number]
type Theme = 'light' | 'dark'

function parseColor(text: string): Rgba {
  const value = text.trim()
  const hex = /^#([0-9a-f]{6})$/i.exec(value)
  if (hex?.[1] !== undefined) {
    const n = Number.parseInt(hex[1], 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1]
  }
  const rgb = /^rgb\(\s*(\d+)\s+(\d+)\s+(\d+)(?:\s*\/\s*([\d.]+))?\s*\)$/.exec(value)
  if (rgb !== null) {
    return [
      Number(rgb[1]),
      Number(rgb[2]),
      Number(rgb[3]),
      rgb[4] === undefined ? 1 : Number(rgb[4]),
    ]
  }
  throw new Error(`Unsupported color: ${value}`)
}

/** Splits `light-dark(a, b)` on the comma that is not inside a nested function. */
function splitPair(body: string): [string, string] {
  let depth = 0
  for (let i = 0; i < body.length; i++) {
    const ch = body[i]
    if (ch === '(') depth++
    else if (ch === ')') depth--
    else if (ch === ',' && depth === 0) return [body.slice(0, i), body.slice(i + 1)]
  }
  throw new Error(`Not a pair: ${body}`)
}

function token(name: string, theme: Theme): Rgba {
  // The first declaration is the base value; later ones are media-query overrides.
  const match = new RegExp(`--${name}:\\s*([^;]+);`).exec(tokensCss)
  if (match?.[1] === undefined) throw new Error(`Missing token --${name}`)
  const value = match[1].trim()
  const pair = /^light-dark\((.*)\)$/s.exec(value)
  if (pair?.[1] === undefined) return parseColor(value)
  const [light, dark] = splitPair(pair[1])
  return parseColor(theme === 'light' ? light : dark)
}

/** Paints a translucent color over an opaque one. */
function over(top: Rgba, bottom: Rgba): Rgba {
  const a = top[3]
  const mix = (t: number, b: number) => t * a + b * (1 - a)
  return [mix(top[0], bottom[0]), mix(top[1], bottom[1]), mix(top[2], bottom[2]), 1]
}

function luminance([r, g, b]: Rgba): number {
  const channel = (value: number) => {
    const c = value / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function contrast(a: Rgba, b: Rgba): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

const BACKDROPS = ['bg-1', 'bg-2', 'bg-3', 'blob-1', 'blob-2', 'blob-3']
const TEXT = 4.5
const NON_TEXT = 3

describe.each(['light', 'dark'] as const)('%s theme', (theme) => {
  const t = (name: string) => token(name, theme)

  describe.each(['glass-fill', 'glass-fill-solid'])('panel filled with --%s', (panelFill) => {
    describe.each(BACKDROPS)('over --%s', (backdrop) => {
      const panel = over(t(panelFill), t(backdrop))
      const inset = over(t('glass-fill-inset'), panel)
      const overlay = over(t('glass-fill-overlay'), panel)
      const keys = ['key-fill', 'key-fill-function', 'key-fill-operator'].map(
        (fill) => [fill, over(t(fill), panel)] as const,
      )

      it('display text is readable', () => {
        expect(contrast(t('text'), inset)).toBeGreaterThanOrEqual(TEXT)
        expect(contrast(t('text-muted'), inset)).toBeGreaterThanOrEqual(TEXT)
        expect(contrast(t('text-danger'), inset)).toBeGreaterThanOrEqual(TEXT)
      })

      it('key labels are readable at rest, on hover and when pressed', () => {
        for (const [, key] of keys) {
          expect(contrast(t('text'), key)).toBeGreaterThanOrEqual(TEXT)
          expect(contrast(t('text'), over(t('key-fill-hover'), key))).toBeGreaterThanOrEqual(TEXT)
          expect(contrast(t('text'), over(t('key-fill-pressed'), key))).toBeGreaterThanOrEqual(TEXT)
        }
      })

      it('badge and history text are readable', () => {
        const badge = over(t('key-fill-function'), inset)
        expect(contrast(t('text-muted'), badge)).toBeGreaterThanOrEqual(TEXT)
        const entry = over(t('key-fill'), overlay)
        expect(contrast(t('text'), entry)).toBeGreaterThanOrEqual(TEXT)
        expect(contrast(t('text-muted'), entry)).toBeGreaterThanOrEqual(TEXT)
        expect(contrast(t('text-muted'), overlay)).toBeGreaterThanOrEqual(TEXT)
      })

      it('key borders stand out from the key and the panel', () => {
        for (const [, key] of keys) {
          const border = over(t('key-border'), key)
          expect(contrast(border, key)).toBeGreaterThanOrEqual(NON_TEXT)
          expect(contrast(border, panel)).toBeGreaterThanOrEqual(NON_TEXT)
        }
      })
    })
  })

  it('text on the accent color is readable', () => {
    expect(contrast(t('text-on-accent'), t('accent-1'))).toBeGreaterThanOrEqual(TEXT)
    expect(contrast(t('text-on-accent'), t('accent-2'))).toBeGreaterThanOrEqual(TEXT)
  })

  it('the two-tone focus ring always has a visible edge', () => {
    expect(contrast(t('focus-ring'), t('focus-halo'))).toBeGreaterThanOrEqual(NON_TEXT)
  })
})
