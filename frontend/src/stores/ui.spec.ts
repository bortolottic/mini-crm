import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import { useUiStore } from '@/stores/ui'

describe('ui store — tema', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('começa em automático e aplica o tema do SO', () => {
    const ui = useUiStore()
    expect(ui.theme).toBe('system')
    expect(document.documentElement.getAttribute('data-theme')).toMatch(/light|dark/)
  })

  it('alterna automático → claro → escuro e persiste', async () => {
    const ui = useUiStore()
    ui.cycleTheme()
    await nextTick()
    expect(ui.theme).toBe('light')
    ui.cycleTheme()
    await nextTick()
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(localStorage.getItem('minicrm.theme')).toBe('dark')
  })

  it('recupera a escolha salva', () => {
    localStorage.setItem('minicrm.theme', 'dark')
    expect(useUiStore().theme).toBe('dark')
  })
})
