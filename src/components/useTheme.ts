import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { loadPreference, savePreference } from '../state/storage'

export type Theme = 'light' | 'dark'

/** Also read by the inline script in index.html, which applies the theme before first paint. */
export const THEME_KEY = 'glass-calculator:theme'
const THEMES = ['light', 'dark'] as const
const DARK_QUERY = '(prefers-color-scheme: dark)'

function subscribeToSystemTheme(onChange: () => void) {
  if (typeof window.matchMedia !== 'function') return () => {}
  const query = window.matchMedia(DARK_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

const systemPrefersDark = () =>
  typeof window.matchMedia === 'function' && window.matchMedia(DARK_QUERY).matches

/** The theme follows the system until the user picks one; their pick is remembered. */
export function useTheme() {
  const [override, setOverride] = useState<Theme | null>(() => loadPreference(THEME_KEY, THEMES))
  const systemDark = useSyncExternalStore(subscribeToSystemTheme, systemPrefersDark)
  const theme: Theme = override ?? (systemDark ? 'dark' : 'light')

  useEffect(() => {
    if (override === null) delete document.documentElement.dataset.theme
    else document.documentElement.dataset.theme = override
  }, [override])

  const toggle = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setOverride(next)
    savePreference(THEME_KEY, next)
  }, [theme])

  return { theme, toggle }
}
