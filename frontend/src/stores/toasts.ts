/** Avisos efêmeros (toasts) — erros globais e confirmações (SPEC §11.3). */
import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastTone = 'info' | 'sucesso' | 'atencao' | 'erro'

export interface Toast {
  id: number
  tone: ToastTone
  title: string
  body?: string
}

const DURATION_MS: Record<ToastTone, number> = {
  info: 4000,
  sucesso: 4000,
  atencao: 6000,
  erro: 8000,
}

export const useToastStore = defineStore('toasts', () => {
  const toasts = ref<Toast[]>([])
  let nextId = 1

  function dismiss(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  function push(tone: ToastTone, title: string, body?: string): number {
    const id = nextId++
    toasts.value.push({ id, tone, title, body })
    // No máximo 4 na tela: o mais antigo sai primeiro.
    if (toasts.value.length > 4) toasts.value.shift()
    setTimeout(() => dismiss(id), DURATION_MS[tone])
    return id
  }

  return {
    toasts,
    dismiss,
    info: (title: string, body?: string) => push('info', title, body),
    success: (title: string, body?: string) => push('sucesso', title, body),
    warning: (title: string, body?: string) => push('atencao', title, body),
    error: (title: string, body?: string) => push('erro', title, body),
  }
})
