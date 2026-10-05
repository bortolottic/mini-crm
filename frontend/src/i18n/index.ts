/** i18n (RN-16): pt-BR é o idioma padrão e o único completo no MVP. */
import { createI18n } from 'vue-i18n'

import ptBR from '@/i18n/pt-BR'

export type MessageSchema = typeof ptBR

export const i18n = createI18n<[MessageSchema], 'pt-BR'>({
  legacy: false,
  locale: 'pt-BR',
  fallbackLocale: 'pt-BR',
  messages: { 'pt-BR': ptBR },
})
