/** Preferências de interface do usuário: tema (SPEC §11.4).
 *
 * `system` segue o SO via `prefers-color-scheme`; a escolha fica em
 * `localStorage` — conveniência por navegador, nunca estado de negócio. Todo
 * acesso ao storage é protegido: em janela privada ele pode lançar.
 */
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type ThemeChoice = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'minicrm.theme'

function readStored(): ThemeChoice {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : 'system'
  } catch {
    return 'system'
  }
}

function systemPrefersDark(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches
}

export const useUiStore = defineStore('ui', () => {
  const theme = ref<ThemeChoice>(readStored())

  function apply() {
    const dark = theme.value === 'dark' || (theme.value === 'system' && systemPrefersDark())
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  }

  function setTheme(next: ThemeChoice) {
    theme.value = next
  }

  function cycleTheme() {
    const order: ThemeChoice[] = ['system', 'light', 'dark']
    theme.value = order[(order.indexOf(theme.value) + 1) % order.length] ?? 'system'
  }

  watch(theme, (value) => {
    try {
      if (value === 'system') localStorage.removeItem(STORAGE_KEY)
      else localStorage.setItem(STORAGE_KEY, value)
    } catch {
      /* storage indisponível: a escolha vale só para esta sessão */
    }
    apply()
  })

  if (typeof window.matchMedia === 'function') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (theme.value === 'system') apply()
    })
  }

  apply()
  return { theme, setTheme, cycleTheme }
})
