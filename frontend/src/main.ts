import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from '@/App.vue'
import { i18n } from '@/i18n'
import { router } from '@/router'
import { useUiStore } from '@/stores/ui'
import '@/styles/main.css'

const app = createApp(App)
app.use(createPinia())
app.use(i18n)
app.use(router)

// Aplica o tema antes do primeiro paint de conteúdo.
useUiStore()

app.mount('#app')
