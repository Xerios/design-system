// The page's theme: system (follow the OS), light or dark. Kept in localStorage ('ks-theme'); index.html applies it
// before the first paint, and this reads it back from <html data-theme>.

export const THEMES = [
  { value: 'system', label: 'System', icon: 'monitor' },
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'dark', label: 'Dark', icon: 'moon' },
]

export const theme = $state({ value: document.documentElement.dataset.theme ?? 'system' })

/** @param {string} value */
export function setTheme(value) {
  theme.value = value
  if (value === 'system') delete document.documentElement.dataset.theme
  else document.documentElement.dataset.theme = value
  try {
    if (value === 'system') localStorage.removeItem('ks-theme')
    else localStorage.setItem('ks-theme', value)
  } catch {
    // Storage blocked (private mode, policy): the choice lasts until reload.
  }
}
