import { expect, test } from '@playwright/test'

// Fumaça da F0: o navegador chega no frontend, que chega na API, que chega no banco.
// O fluxo principal Lead → Cliente (SPEC §15) entra aqui na F10.
test('início mostra API e banco respondendo', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Minhas tarefas' })).toBeVisible()
  await expect(page.getByTestId('api-status')).toContainText('API e banco respondendo')
})

test('rota da SPA funciona com recarga direta (fallback do nginx)', async ({ page }) => {
  await page.goto('/pipeline')
  await expect(page.getByRole('heading', { name: 'Pipeline' })).toBeVisible()
})

test('API responde atrás do proxy com request id', async ({ request }) => {
  const response = await request.get('/api/v1/health')
  expect(response.ok()).toBeTruthy()
  expect(response.headers()['x-request-id']).toBeTruthy()
})
