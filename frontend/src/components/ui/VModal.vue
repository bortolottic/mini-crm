<script setup lang="ts">
/**
 * Caixa modal — sobre `<dialog>` nativo, e não sobre uma `div` com `z-index`.
 *
 * O elemento nativo entrega de graça três coisas que uma `div` só consegue com
 * código frágil: a **camada superior** do navegador (nada da página fica por
 * cima, nem o mural em tela cheia), o **foco preso** dentro da caixa enquanto
 * ela está aberta, e a tecla **Esc** fechando. Tudo isso é acessibilidade que
 * um `v-if` com `position: fixed` costuma perder em silêncio.
 *
 * O que o nativo não decide por nós é o **cancelamento**: `Esc` dispara
 * `cancel`, e é preciso avisar quem hospeda para o estado do Vue acompanhar.
 * Sem isso a caixa fecha visualmente e o `v-model` continua `true` — e ela não
 * reabre no clique seguinte.
 */
import { ref, watch } from 'vue'
import { X } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    titulo: string
    subtitulo?: string
    /** `largo` para grafo e vídeo; o padrão serve a formulário. */
    tamanho?: 'padrao' | 'largo'
  }>(),
  { subtitulo: '', tamanho: 'padrao' },
)

const aberto = defineModel<boolean>({ required: true })
const caixa = ref<HTMLDialogElement | null>(null)

watch(aberto, (valor) => {
  const el = caixa.value
  if (!el) return
  // `showModal` e `close` são idempotentes no estado certo mas lançam quando
  // chamados no errado — daí a checagem em vez de chamar direto.
  if (valor && !el.open) el.showModal()
  if (!valor && el.open) el.close()
})

function aoCancelar(evento: Event) {
  // O `Esc` fecha o `<dialog>` por conta própria; isto é só para o estado do
  // Vue acompanhar, senão a caixa não reabre no clique seguinte.
  evento.preventDefault()
  aberto.value = false
}

/**
 * Clique no fundo fecha — mas só o clique **no fundo**.
 *
 * O `<dialog>` recebe o clique do backdrop como um clique em si mesmo, então a
 * comparação com `event.target` é o que separa "clicou fora" de "clicou num
 * campo lá dentro". Sem ela, qualquer clique dentro do formulário fecharia a
 * caixa.
 */
function aoClicar(evento: MouseEvent) {
  if (evento.target === caixa.value) aberto.value = false
}
</script>

<template>
  <dialog
    ref="caixa"
    class="modal"
    :class="{ 'modal--largo': tamanho === 'largo' }"
    @cancel="aoCancelar"
    @click="aoClicar"
  >
    <div class="modal__caixa">
      <header class="modal__cabeca">
        <div class="modal__texto">
          <h2 class="modal__titulo">{{ titulo }}</h2>
          <p v-if="subtitulo" class="v-muted small">{{ subtitulo }}</p>
        </div>
        <button class="fechar" type="button" title="Fechar" @click="aberto = false">
          <X :size="18" :stroke-width="2" />
        </button>
      </header>

      <div class="modal__corpo">
        <slot />
      </div>

      <footer v-if="$slots.rodape" class="modal__rodape">
        <slot name="rodape" />
      </footer>
    </div>
  </dialog>
</template>

<style scoped>
.modal {
  width: min(560px, calc(100vw - 2 * var(--v-gutter)));
  max-height: calc(100vh - 2 * var(--v-space-xl));
  padding: 0;
  color: var(--v-ink);
  background: var(--v-surface);
  border: 1px solid var(--v-rule);
  border-radius: var(--v-radius-xl);
  box-shadow: var(--v-shadow-lg);
  overflow: hidden;
}

.modal--largo { width: min(1100px, calc(100vw - 2 * var(--v-gutter))); }

.modal::backdrop { background: hsl(0 0% 0% / 0.45); }

.modal__caixa {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 2 * var(--v-space-xl));
}

.modal__cabeca {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--v-space-sm);
  padding: var(--v-space-sm);
  border-bottom: 1px solid var(--v-rule-light);
}

.modal__texto { display: flex; flex-direction: column; gap: 2px; min-width: 0; }

.modal__titulo {
  margin: 0;
  font-size: var(--v-text-lg);
  font-weight: var(--v-weight-bold);
  letter-spacing: -0.01em;
}

.modal__corpo {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--v-space-sm);
}

.modal__rodape {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--v-space-2xs);
  padding: var(--v-space-xs) var(--v-space-sm);
  border-top: 1px solid var(--v-rule-light);
  background: var(--v-surface-2);
}

.fechar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex: none;
  padding: 0;
  color: var(--v-ink-60);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--v-radius);
  cursor: pointer;
}

.fechar:hover { color: var(--v-accent-text); border-color: var(--v-rule); }

.small { font-size: var(--v-text-2xs); }
</style>
