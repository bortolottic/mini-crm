<script setup lang="ts">
/**
 * Pilha de avisos no canto inferior direito.
 *
 * Adaptado do `VToasts` do Vision.AI: mesma gramática (régua de tom à esquerda,
 * título sempre em texto — tom nunca só por cor), sem o vínculo com a central
 * de notificações, que o CRM não tem. `aria-live` assertivo só para erro.
 */
import { X } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import { useToastStore } from '@/stores/toasts'

const store = useToastStore()
const { t } = useI18n()
</script>

<template>
  <div class="pilha" aria-live="polite" aria-relevant="additions">
    <TransitionGroup name="aviso">
      <article
        v-for="toast in store.toasts"
        :key="toast.id"
        class="aviso"
        :class="`aviso--${toast.tone}`"
        :role="toast.tone === 'erro' ? 'alert' : 'status'"
        :aria-live="toast.tone === 'erro' ? 'assertive' : 'polite'"
      >
        <div class="aviso__corpo">
          <span class="aviso__titulo">{{ toast.title }}</span>
          <span v-if="toast.body" class="aviso__texto">{{ toast.body }}</span>
        </div>
        <button
          class="aviso__fechar"
          type="button"
          :title="t('common.dismiss')"
          :aria-label="t('common.dismiss')"
          @click="store.dismiss(toast.id)"
        >
          <X :size="14" :stroke-width="2" aria-hidden="true" />
        </button>
      </article>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.pilha {
  position: fixed;
  right: var(--v-space-sm);
  bottom: var(--v-space-sm);
  z-index: 60;
  display: flex;
  flex-direction: column;
  gap: var(--v-space-2xs);
  width: min(360px, calc(100vw - 2 * var(--v-space-sm)));
  pointer-events: none;
}

.aviso {
  display: flex;
  align-items: flex-start;
  gap: var(--v-space-4xs);
  padding: var(--v-space-2xs) var(--v-space-2xs) var(--v-space-2xs) var(--v-space-xs);
  background: var(--v-surface);
  border: 1px solid var(--v-rule);
  border-left: 3px solid var(--v-neutral-400);
  border-radius: var(--v-radius);
  box-shadow: var(--v-shadow-lg);
  pointer-events: auto;
}

.aviso--sucesso { border-left-color: var(--v-state-normal); }
.aviso--atencao { border-left-color: var(--v-state-warning); }
.aviso--erro { border-left-color: var(--v-state-critical); }

.aviso__corpo {
  display: flex;
  flex-direction: column;
  gap: var(--v-space-5xs);
  flex: 1;
  min-width: 0;
}

.aviso__titulo { font-size: var(--v-text-sm); font-weight: var(--v-weight-medium); }

.aviso__texto {
  font-size: var(--v-text-2xs);
  color: var(--v-ink-60);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.aviso__fechar {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  color: var(--v-ink-40);
  background: none;
  border: 0;
  border-radius: var(--v-radius-sm);
  cursor: pointer;
}

.aviso__fechar:hover { color: var(--v-ink); background: var(--v-surface-2); }

.aviso-enter-active,
.aviso-leave-active { transition: opacity 0.18s ease, transform 0.18s ease; }

.aviso-enter-from,
.aviso-leave-to { opacity: 0; transform: translateX(12px); }

.aviso-move { transition: transform 0.18s ease; }

@media (prefers-reduced-motion: reduce) {
  .aviso-enter-active,
  .aviso-leave-active,
  .aviso-move { transition: none; }
}

@media (max-width: 720px) {
  .pilha { left: var(--v-space-2xs); right: var(--v-space-2xs); width: auto; }
}
</style>
