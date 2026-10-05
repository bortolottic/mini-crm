/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    port: 3100,
    strictPort: true,
    // Em produção quem faz este desvio é o nginx (docker/nginx/nginx.conf).
    // 127.0.0.1 e não localhost: o Node resolve localhost para ::1 primeiro e
    // o uvicorn do launch.json escuta em IPv4 (0.0.0.0).
    proxy: {
      '/api': { target: 'http://127.0.0.1:3300', changeOrigin: true },
    },
  },
  preview: { port: 3100 },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
    restoreMocks: true,
  },
})
