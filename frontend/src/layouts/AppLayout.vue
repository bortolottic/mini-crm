<script setup lang="ts">
/**
 * Moldura da aplicação autenticada: trilho de navegação à esquerda, barra
 * superior e área de conteúdo (SPEC §11.2, PRD §13).
 *
 * Escrito para o CRM em vez de copiado: o `AppLayout` do Vision.AI carrega
 * mural de vídeo, central de notificações e permissões por módulo, nada disso
 * existe aqui. A gramática visual (tokens, réguas, raio, foco) é a mesma.
 *
 * Abaixo de 960 px o trilho vira gaveta, aberta pelo botão de menu.
 */
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { Menu, Monitor, Moon, Sun, X } from 'lucide-vue-next'

import VToasts from '@/components/ui/VToasts.vue'
import { isEnabled } from '@/config/features'
import { navigation } from '@/config/navigation'
import { useUiStore } from '@/stores/ui'

const { t } = useI18n()
const route = useRoute()
const ui = useUiStore()

const drawerOpen = ref(false)
watch(() => route.fullPath, () => (drawerOpen.value = false))

const groups = computed(() =>
  navigation
    .map((group) => ({ ...group, items: group.items.filter((item) => isEnabled(item.feature)) }))
    .filter((group) => group.items.length > 0),
)

const themeIcon = computed(() => ({ system: Monitor, light: Sun, dark: Moon })[ui.theme])
const themeLabel = computed(() => t('theme.label', { mode: t(`theme.${ui.theme}`) }))
</script>

<template>
  <div class="shell" :class="{ 'shell--drawer': drawerOpen }">
    <aside class="rail" :aria-label="t('nav.menu')">
      <div class="rail__brand">
        <span class="rail__dot" aria-hidden="true" />
        <span class="rail__name">{{ t('app.name') }}</span>
        <button
          class="rail__close"
          type="button"
          :aria-label="t('common.dismiss')"
          @click="drawerOpen = false"
        >
          <X :size="18" aria-hidden="true" />
        </button>
      </div>

      <nav class="rail__nav">
        <section v-for="(group, index) in groups" :key="index" class="rail__group">
          <h2 v-if="group.label" class="rail__group-label">{{ t(group.label) }}</h2>
          <RouterLink
            v-for="item in group.items"
            :key="item.name"
            :to="item.path"
            class="rail__link"
            active-class=""
            exact-active-class="rail__link--on"
          >
            <component :is="item.icon" :size="16" :stroke-width="2" aria-hidden="true" />
            <span>{{ t(item.label) }}</span>
          </RouterLink>
        </section>
      </nav>
    </aside>

    <div class="backdrop" aria-hidden="true" @click="drawerOpen = false" />

    <div class="main">
      <header class="topbar">
        <button
          class="topbar__menu v-button v-button--ghost v-button--small"
          type="button"
          :aria-label="t('nav.menu')"
          :aria-expanded="drawerOpen"
          @click="drawerOpen = true"
        >
          <Menu :size="16" aria-hidden="true" />
        </button>
        <div class="topbar__spacer" />
        <button
          class="v-button v-button--ghost v-button--small"
          type="button"
          :title="themeLabel"
          :aria-label="themeLabel"
          @click="ui.cycleTheme()"
        >
          <component :is="themeIcon" :size="16" aria-hidden="true" />
        </button>
      </header>

      <main class="content">
        <RouterView />
      </main>
    </div>

    <VToasts />
  </div>
</template>

<style scoped>
.shell {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  min-height: 100vh;
}

.rail {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow-y: auto;
  background: var(--v-surface);
  border-right: 1px solid var(--v-rule);
}

.rail__brand {
  display: flex;
  align-items: center;
  gap: var(--v-space-2xs);
  padding: var(--v-space-sm);
  border-bottom: 1px solid var(--v-rule-light);
}

.rail__dot {
  width: 12px;
  height: 12px;
  background: var(--v-accent);
  border-radius: 50%;
}

.rail__name { font-weight: var(--v-weight-bold); letter-spacing: -0.01em; }

.rail__close {
  display: none;
  margin-left: auto;
  padding: var(--v-space-4xs);
  color: var(--v-ink-60);
  background: none;
  border: 0;
  cursor: pointer;
}

.rail__nav { display: flex; flex-direction: column; gap: var(--v-space-xs); padding: var(--v-space-xs); }

.rail__group { display: flex; flex-direction: column; gap: var(--v-space-5xs); }

.rail__group-label {
  margin: 0;
  padding: var(--v-space-4xs) var(--v-space-2xs);
  font-size: var(--v-text-3xs);
  font-weight: var(--v-weight-medium);
  color: var(--v-ink-40);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.rail__link {
  display: flex;
  align-items: center;
  gap: var(--v-space-2xs);
  padding: var(--v-space-3xs) var(--v-space-2xs);
  font-size: var(--v-text-sm);
  color: var(--v-ink);
  border-radius: var(--v-radius);
  text-decoration: none;
}

.rail__link:hover { background: var(--v-ink-07); text-decoration: none; }

.rail__link--on {
  color: var(--v-accent-text);
  font-weight: var(--v-weight-medium);
  background: var(--v-accent-100);
}

.main { display: flex; flex-direction: column; min-width: 0; }

.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: var(--v-space-2xs);
  height: 52px;
  padding: 0 var(--v-gutter);
  background: var(--v-surface);
  border-bottom: 1px solid var(--v-rule);
}

.topbar__menu { display: none; }
.topbar__spacer { flex: 1; }

.content { flex: 1; padding: var(--v-space-lg) var(--v-gutter); }

.backdrop { display: none; }

@media (max-width: 960px) {
  .shell { grid-template-columns: minmax(0, 1fr); }

  .rail {
    position: fixed;
    inset: 0 auto 0 0;
    z-index: 40;
    width: min(280px, 85vw);
    transform: translateX(-100%);
    transition: transform 0.18s ease;
    box-shadow: var(--v-shadow-lg);
  }

  .rail__close,
  .topbar__menu { display: inline-flex; }

  .shell--drawer .rail { transform: none; }

  .shell--drawer .backdrop {
    position: fixed;
    inset: 0;
    z-index: 30;
    display: block;
    background: hsl(0 0% 0% / 0.35);
  }
}

@media (prefers-reduced-motion: reduce) {
  .rail { transition: none; }
}
</style>
