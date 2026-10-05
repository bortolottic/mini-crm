<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div class="v-head">
    <div class="v-head__texto">
      <h1 class="v-title">{{ t('errors.forbiddenTitle') }}</h1>
      <p class="v-muted">{{ t('errors.forbiddenBody') }}</p>
    </div>
  </div>
  <RouterLink to="/" class="v-button">{{ t('common.back') }}</RouterLink>
</template>
