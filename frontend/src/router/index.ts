/** Rotas (SPEC §11.2).
 *
 * As telas das fases seguintes entram como `PlaceholderView` geradas a partir
 * do menu (config/navigation.ts); cada fase substitui as suas pela tela real.
 * Os guards de autenticação/papel chegam na F1 (`meta.public`, `meta.adminOnly`).
 */
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import { isEnabled } from '@/config/features'
import { navigation } from '@/config/navigation'
import AppLayout from '@/layouts/AppLayout.vue'

const placeholders: RouteRecordRaw[] = navigation
  .flatMap((group) => group.items)
  .filter((item) => item.name !== 'home' && isEnabled(item.feature))
  .map((item) => ({
    path: item.path.slice(1),
    name: item.name,
    component: () => import('@/views/PlaceholderView.vue'),
    meta: { label: item.label, phase: item.phase, adminOnly: item.adminOnly ?? false },
  }))

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: AppLayout,
    children: [
      { path: '', name: 'home', component: () => import('@/views/HomeView.vue') },
      ...placeholders,
      { path: 'forbidden', name: 'forbidden', component: () => import('@/views/ForbiddenView.vue') },
      { path: ':pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue') },
    ],
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
