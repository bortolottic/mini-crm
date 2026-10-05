<script setup lang="ts">
/**
 * Botão de ação de grade: **figura mais dica**, sem rótulo escrito.
 *
 * ## Por que trocar o texto por ícone
 *
 * A coluna de ações da tabela repete o mesmo trio em toda linha — editar,
 * desabilitar, excluir. Escrito por extenso, esse trio vira um parágrafo
 * horizontal que o olho tem de **ler** a cada linha para achar o botão certo, e
 * que ainda muda de largura conforme o estado ("Desabilitar" tem quatro letras
 * a mais que "Reativar", e a coluna dança entre as linhas). A figura é
 * reconhecida sem leitura e ocupa sempre o mesmo espaço.
 *
 * ## Por que a dica não é enfeite
 *
 * Ícone sozinho é adivinhação — e adivinhar qual botão exclui, numa tela de
 * operação, é caro. Por isso `label` é **obrigatório** e vai a três lugares de
 * uma vez:
 *
 * * `title`, que é a dica que aparece ao pousar o ponteiro;
 * * `aria-label`, que é o nome que o leitor de tela anuncia — a figura vai
 *   marcada como decorativa, senão ele leria o SVG e o rótulo;
 * * o `<title>` que o próprio Lucide desenha dentro do SVG, desligado aqui
 *   justamente para não duplicar o anúncio.
 *
 * `title` nativo, e não uma dica desenhada por nós: ela funciona sem script,
 * sem posicionamento a calcular, e não custa um pacote a mais numa instalação
 * air-gapped (RNF-POR-02).
 *
 * ## `tone`
 *
 * Só o que **destrói** recebe acento, e ainda assim no `hover` — a linha inteira
 * pintada de vermelho transformaria a tabela em alarme. A cor não é a única
 * portadora do significado (RNF-USA-03): a dica continua dizendo "Excluir", e a
 * confirmação continua sendo pedida por quem chama.
 */
import type { Component } from 'vue'

withDefaults(
  defineProps<{
    /** Figura do Lucide, consumida por `<component :is>`. */
    icon: Component
    /** O que o botão faz, em uma ou duas palavras. Vira dica e nome acessível. */
    label: string
    /** `danger` para ação destrutiva — acento no hover, nunca em repouso. */
    tone?: 'normal' | 'danger'
    disabled?: boolean
  }>(),
  { tone: 'normal', disabled: false },
)
</script>

<template>
  <button
    class="v-button v-button--ghost v-button--small acao"
    :class="{ 'acao--perigo': tone === 'danger' }"
    type="button"
    :title="label"
    :aria-label="label"
    :disabled="disabled"
  >
    <component :is="icon" :size="15" :stroke-width="2" aria-hidden="true" />
  </button>
</template>

<style scoped>
/*
 * Quadrado, e não retângulo: sem texto dentro, o padding lateral do botão
 * deixaria a figura nadando num campo largo demais e o alvo de clique
 * assimétrico. 28 px é a altura de `--small`, então a coluna de ações continua
 * com a mesma altura de linha das telas que ainda têm botão escrito.
 */
.acao {
  width: 28px;
  padding: 0;
  flex: none;
}

.acao--perigo:hover:not(:disabled) {
  color: var(--v-state-critical);
  border-color: var(--v-state-critical);
}
</style>
