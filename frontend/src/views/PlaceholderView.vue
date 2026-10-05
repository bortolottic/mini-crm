<script setup lang="ts">
/** Tela reservada para uma fase futura do PLANO.md (ver config/navigation.ts). */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const { t } = useI18n()
const route = useRoute()

const screen = computed(() => t(String(route.meta.label ?? 'app.name')))
const phase = computed(() => String(route.meta.phase ?? '?'))
</script>

<template>
  <div class="v-head">
    <div class="v-head__texto">
      <h1 class="v-title">{{ t('placeholder.title', { screen }) }}</h1>
      <p class="v-muted">{{ t('placeholder.body', { phase }) }}</p>
    </div>
  </div>
</template>
