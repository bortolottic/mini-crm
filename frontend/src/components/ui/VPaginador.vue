<script setup lang="ts">
/**
 * Paginador de lista — "26–50 de 194", anterior, próxima, tamanho da página.
 *
 * ## Por que existe como componente
 *
 * A central de notificações tem **duas** listas paginadas na mesma tela, com
 * regras idênticas e estados independentes. Escrever o rodapé duas vezes seria
 * garantir que um dia elas divergissem — e a divergência aqui não é estética:
 * é o botão "próxima" ficar habilitado numa e não na outra no mesmo caso.
 *
 * ## O intervalo, e não o número da página
 *
 * "Página 3 de 8" obriga a multiplicar de cabeça para saber o que se está
 * vendo. "51–75 de 194" responde a pergunta que a pessoa tem: quanto já passou
 * e quanto falta. O número da página é um detalhe de implementação do
 * paginador, não uma informação sobre os dados.
 *
 * ## O que ele **não** faz
 *
 * Não busca nada. Ele emite `update:offset` e quem hospeda recarrega — é o que
 * permite usar o mesmo rodapé com duas rotas diferentes, e o que mantém o
 * tratamento de erro onde ele já existe.
 */
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    /** Quantas linhas o filtro corrente alcança — não o tamanho da página. */
    total: number
    limit: number
    offset: number
    /** Desabilita a navegação enquanto a página anterior ainda está vindo. */
    carregando?: boolean
    /** Tamanhos oferecidos. Poucos de propósito: é um ajuste, não um painel. */
    tamanhos?: number[]
    /** O que está sendo contado, no plural. Vai para o rodapé e para a leitura. */
    rotulo?: string
  }>(),
  { carregando: false, tamanhos: () => [25, 50, 100], rotulo: 'itens' },
)

const emit = defineEmits<{
  (e: 'update:offset', offset: number): void
  (e: 'update:limit', limit: number): void
}>()

/** 1-based e inclusivo, que é como se lê — some quando não há nada. */
const primeiro = computed(() => (props.total ? props.offset + 1 : 0))
const ultimo = computed(() => Math.min(props.offset + props.limit, props.total))

const temAnterior = computed(() => props.offset > 0)
const temProxima = computed(() => props.offset + props.limit < props.total)

function anterior() {
  if (!temAnterior.value) return
  emit('update:offset', Math.max(0, props.offset - props.limit))
}

function proxima() {
  if (!temProxima.value) return
  emit('update:offset', props.offset + props.limit)
}

/**
 * Trocar o tamanho volta para o começo.
 *
 * Manter o `offset` ao passar de 25 para 100 pularia três páginas sem que
 * ninguém tivesse pedido: quem mexe no tamanho quer ver *mais do mesmo*, não
 * saltar adiante.
 */
function trocarTamanho(evento: Event) {
  const valor = Number((evento.target as HTMLSelectElement).value)
  if (!valor || valor === props.limit) return
  emit('update:limit', valor)
  emit('update:offset', 0)
}
</script>

<template>
  <div class="paginador">
    <!-- `aria-live`: quem navega por teclado e leitor de tela precisa ouvir
         que a página mudou. Sem isto o clique em "próxima" não anuncia nada e
         a lista troca em silêncio. -->
    <span class="contagem v-muted" aria-live="polite">
      <template v-if="total">{{ primeiro }}–{{ ultimo }} de {{ total }} {{ rotulo }}</template>
      <template v-else>nenhum resultado</template>
    </span>

    <label class="tamanho v-muted">
      por página
      <select
        class="v-select tamanho__select"
        :value="limit"
        :disabled="carregando"
        @change="trocarTamanho"
      >
        <option v-for="opcao in tamanhos" :key="opcao" :value="opcao">{{ opcao }}</option>
      </select>
    </label>

    <div class="setas">
      <button
        class="seta"
        type="button"
        title="Página anterior"
        aria-label="Página anterior"
        :disabled="!temAnterior || carregando"
        @click="anterior"
      >
        <ChevronLeft :size="15" :stroke-width="2" aria-hidden="true" />
      </button>
      <button
        class="seta"
        type="button"
        title="Próxima página"
        aria-label="Próxima página"
        :disabled="!temProxima || carregando"
        @click="proxima"
      >
        <ChevronRight :size="15" :stroke-width="2" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.paginador {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  /* **O tamanho vem daqui, e não de uma classe `small`.** Cada view do projeto
     declara a sua `.small` dentro de `<style scoped>`, e estilo escopado do pai
     não alcança o interior de um componente filho: dentro deste arquivo a
     classe não existiria, e o rodapé sairia no corpo de texto — foi assim que o
     ensaio o mostrou, com "1–25 de 208" do tamanho de um título. */
  font-size: var(--v-text-2xs);
  border-top: var(--v-rule-hair) solid var(--v-rule);
}

/* A contagem empurra o resto para a direita: ela é a informação, o controle é
   o acessório. */
.contagem { margin-right: auto; }

.tamanho { display: flex; align-items: center; gap: 6px; }

/* O `.v-select` do sistema ocupa a largura toda — é o certo num formulário e
   errado num rodapé, onde ele é um ajuste ao lado da contagem. Só a largura e
   a altura mudam; cor, borda, raio e foco continuam vindo do sistema. */
.tamanho__select {
  width: auto;
  height: 28px;
  padding: 0 var(--v-space-2xs);
  font-size: var(--v-text-2xs);
}

.setas { display: flex; gap: 4px; }

.seta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  color: var(--v-ink);
  background: transparent;
  border: var(--v-rule-hair) solid var(--v-rule);
  border-radius: var(--v-radius);
  cursor: pointer;
}

.seta:hover:not(:disabled) { background: var(--v-ink-07); }

/* Desabilitado **visível**, e não escondido: sumir com o botão no fim da lista
   faria a barra mudar de largura a cada página, e quem já mirou o ponteiro ali
   clicaria no que tivesse tomado o lugar. */
.seta:disabled {
  color: var(--v-ink-40);
  cursor: default;
}

@media (max-width: 640px) {
  /* No celular o seletor de tamanho é o primeiro a sair: a contagem e as setas
     são o que resolve a navegação. */
  .tamanho { display: none; }
}
</style>
