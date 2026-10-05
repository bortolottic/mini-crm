<script setup lang="ts">
/**
 * Ícone discreto ao lado do label de um campo, que mostra a explicação sob
 * demanda em vez de sempre — padrão para campos de formulário com observação.
 *
 * O gatilho reage a **hover e a toque/clique**, e não só a hover: um balão que
 * só abre com o mouse não existe em tablet, e parte desta interface é operada
 * assim. `click` alterna (serve ao toque, sem `:hover` do CSS), e o balão
 * também fecha ao perder o foco ou com Escape, para não ficar preso aberto.
 */
import { ref } from 'vue'
import { CircleHelp } from 'lucide-vue-next'

defineProps<{ texto: string }>()

const aberto = ref(false)

function fechar() {
  aberto.value = false
}

function aoTeclado(evento: KeyboardEvent) {
  if (evento.key === 'Escape') fechar()
}
</script>

<template>
  <span class="v-field-hint">
    <button
      type="button"
      class="v-field-hint__gatilho"
      aria-label="Ajuda sobre este campo"
      :aria-expanded="aberto"
      @mouseenter="aberto = true"
      @mouseleave="fechar"
      @click="aberto = !aberto"
      @blur="fechar"
      @keydown="aoTeclado"
    >
      <CircleHelp :size="13" :stroke-width="2" aria-hidden="true" />
    </button>
    <span v-if="aberto" class="v-field-hint__balao" role="tooltip">{{ texto }}</span>
  </span>
</template>

<style scoped>
.v-field-hint { position: relative; display: inline-flex; }

.v-field-hint__gatilho {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: var(--v-ink-40);
  background: none;
  border: 0;
  cursor: help;
}

.v-field-hint__gatilho:hover,
.v-field-hint__gatilho:focus-visible { color: var(--v-accent-text); }

.v-field-hint__balao {
  position: absolute;
  z-index: 4;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  width: max-content;
  max-width: 260px;
  padding: var(--v-space-2xs) var(--v-space-xs);
  font-size: var(--v-text-2xs);
  font-weight: var(--v-weight-medium);
  line-height: 1.4;
  color: var(--v-surface);
  background: var(--v-ink);
  border-radius: var(--v-radius);
  box-shadow: var(--v-shadow-sm);
}
</style>
