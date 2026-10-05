import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { i18n } from '@/i18n'
import AppLayout from '@/layouts/AppLayout.vue'
import { routes } from '@/router'

async function mountAt(path: string) {
  const router = createRouter({ history: createMemoryHistory(), routes })
  await router.push(path)
  const wrapper = mount(AppLayout, { global: { plugins: [router, i18n] } })
  await flushPromises()
  return wrapper
}

describe('AppLayout', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('mostra os itens do MVP e esconde os de P1', async () => {
    const text = (await mountAt('/')).find('nav').text()
    expect(text).toContain('Leads')
    expect(text).toContain('Pipeline')
    expect(text).toContain('Propostas')
    expect(text).not.toContain('Dashboard')
    expect(text).not.toContain('E-mails')
  })

  it('marca o item da rota atual', async () => {
    const active = (await mountAt('/pipeline')).find('.rail__link--on')
    expect(active.text()).toBe('Pipeline')
  })

  it('tela de fase futura informa a fase', async () => {
    const wrapper = await mountAt('/proposals')
    expect(wrapper.text()).toContain('fase F7')
  })

  it('rota desconhecida cai no 404', async () => {
    const wrapper = await mountAt('/nao-existe')
    expect(wrapper.text()).toContain('Página não encontrada')
  })
})
