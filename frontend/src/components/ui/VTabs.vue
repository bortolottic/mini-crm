<script setup lang="ts">
/**
 * Fita de abas — a divisão padrão de toda tela com informação demais.
 *
 * **O estado mora na URL, e não no componente.** Três coisas dependem disso e
 * nenhuma é enfeite:
 *
 * * **recarregar não perde o lugar.** A tela do pipeline recarrega depois de
 *   salvar; sem a aba na URL, quem salvou uma zona voltava para "Visão geral" e
 *   precisava reencontrar o caminho;
 * * **o link aponta para a aba certa.** "Olha a regra que está disparando" é um
 *   link colado no chat, e ele precisa abrir em Regras;
 * * **o voltar do navegador funciona**, porque cada aba é uma entrada de
 *   histórico — `replace` seria mais limpo na barra e faria o voltar sair da
 *   tela inteira, que é o oposto do que o gesto promete.
 *
 * A aba desconhecida cai na primeira em vez de mostrar tela vazia: URL antiga,
 * aba renomeada e permissão que escondeu a aba dão todos o mesmo sintoma, e
 * nenhum deles é culpa de quem clicou.
 */
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export interface Aba {
  id: string
  label: string
  /** Quantos itens a aba guarda. `null` não desenha o contador. */
  conta?: number | string | null
  /** Esconde a aba sem removê-la da lista — permissão, pipeline ainda não salvo. */
  oculta?: boolean
}

const props = withDefaults(
  defineProps<{
    abas: Aba[]
    /** Nome do parâmetro na query. Vazio desliga a sincronia com a URL. */
    parametro?: string
    rotulo?: string
  }>(),
  { parametro: 'aba', rotulo: 'Seções da tela' },
)

const atual = defineModel<string>({ required: true })

const route = useRoute()
const router = useRouter()

const visiveis = computed(() => props.abas.filter((aba) => !aba.oculta))

function valida(id: string | undefined): string {
  const existe = visiveis.value.some((aba) => aba.id === id)
  return existe ? id! : (visiveis.value[0]?.id ?? '')
}

function ir(id: string) {
  if (id === atual.value) return
  atual.value = id
  if (!props.parametro) return
  router.push({ query: { ...route.query, [props.parametro]: id } })
}

onMounted(() => {
  const daUrl = props.parametro ? (route.query[props.parametro] as string | undefined) : undefined
  atual.value = valida(daUrl ?? atual.value)
})

// Voltar no navegador troca a query sem passar por `ir`; sem isto a fita
// continuaria marcando a aba anterior enquanto o conteúdo já teria mudado.
watch(
  () => (props.parametro ? route.query[props.parametro] : undefined),
  (valor) => {
    if (typeof valor === 'string') atual.value = valida(valor)
  },
)

// A aba corrente pode sumir debaixo do pé: "Zonas" só existe depois de salvar o
// pipeline, "Regras" some para quem não enxerga o módulo. Cair na primeira é
// melhor que ficar em uma aba que não está mais na fita.
watch(visiveis, () => {
  atual.value = valida(atual.value)
})
</script>

<template>
  <div class="v-tabs" role="tablist" :aria-label="rotulo">
    <button
      v-for="aba in visiveis"
      :key="aba.id"
      class="v-tab"
      :class="{ 'v-tab--on': aba.id === atual }"
      type="button"
      role="tab"
      :aria-selected="aba.id === atual"
      @click="ir(aba.id)"
    >
      {{ aba.label }}
      <span v-if="aba.conta !== undefined && aba.conta !== null" class="v-tab__conta">
        {{ aba.conta }}
      </span>
    </button>
  </div>
</template>
