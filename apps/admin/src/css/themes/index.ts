import { useAppStore } from '~/stores/app'
import { updateConfig } from '~/api/config'

export type Theme = 'light' | 'dark' | 'system'

function resolve(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return theme
}

function apply(resolved: 'light' | 'dark') {
  if (resolved === 'light') {
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.add('light')
  } else {
    document.documentElement.classList.remove('light')
    document.documentElement.classList.add('dark')
  }
}

export function getTheme(): Theme {
  return useAppStore().theme
}

export function setTheme(theme: Theme) {
  useAppStore().theme = theme
  apply(resolve(theme))
  updateConfig('appearance', { theme }).catch(() => {})
}

export function applyTheme() {
  apply(resolve(getTheme()))
}

export function initTheme() {
  applyTheme()
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getTheme() === 'system') applyTheme()
  })
}
