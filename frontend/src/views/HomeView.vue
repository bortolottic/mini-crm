<script setup lang="ts">
/**
 * Página inicial. No MVP será "Minhas tarefas / follow-ups" (SPEC §11.2, F6);
 * na F0 mostra o estado da API — é o teste de ponta a ponta do scaffold:
 * navegador → Vite/nginx → API → PostgreSQL.
 */
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { getHealth, type Health } from '@/services/health'
import { toApiError } from '@/services/http'

const { t } = useI18n()

const loading = ref(true)
const health = ref<Health | null>(null)
const failure = ref('')

async function load() {
  loading.value = true
  failure.value = ''
  try {
    health.value = await getHealth()
  } catch (error) {
    health.value = null
    failure.value = toApiError(error).message
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="v-head">
    <div class="v-head__texto">
      <h1 class="v-title">{{ t('home.title') }}</h1>
      <p class="v-muted">{{ t('home.subtitle') }}</p>
    </div>
  </div>

  <section class="v-block">
    <header class="v-block__header">
      <h2 class="v-subtitle">{{ t('home.apiStatus') }}</h2>
      <button class="v-button v-button--ghost v-button--small" type="button" :disabled="loading" @click="load">
        {{ t('common.retry') }}
      </button>
    </header>
    <div class="v-block__body" aria-live="polite">
      <p v-if="loading" class="v-muted">{{ t('common.loading') }}</p>
      <p v-else-if="health?.status === 'ok'" data-testid="api-status">
        <span class="v-state v-state--normal">OK</span>
        {{ t('home.apiOk', { version: health.version }) }}
      </p>
      <p v-else-if="health" data-testid="api-status">
        <span class="v-state v-state--warning">!</span>
        {{ t('home.apiDegraded') }}
      </p>
      <p v-else class="v-banner v-banner--error" data-testid="api-status">
        {{ t('home.apiDown', { message: failure }) }}
      </p>
    </div>
  </section>
</template>
