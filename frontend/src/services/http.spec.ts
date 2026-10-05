import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { AxiosError } from 'axios'
import { describe, expect, it, vi } from 'vitest'

import { ApiError, createHttp } from '@/services/http'

type Reply = { status: number; data: unknown }

/** Adapter falso: cada chamada consome a próxima resposta da fila do URL. */
function fakeAdapter(routes: Record<string, Reply[]>) {
  const calls: InternalAxiosRequestConfig[] = []
  const adapter: AxiosAdapter = async (config) => {
    calls.push(config)
    const reply = routes[config.url ?? '']?.shift() ?? { status: 404, data: {} }
    const response = {
      data: reply.data,
      status: reply.status,
      statusText: '',
      headers: { 'x-request-id': 'req-1' },
      config,
    } as AxiosResponse
    if (reply.status >= 400) {
      throw new AxiosError('fail', String(reply.status), config, null, response)
    }
    return response
  }
  return { adapter, calls }
}

const expired = {
  status: 401,
  data: { success: false, error: { code: 'TOKEN_EXPIRED', message: 'Expirado', details: [] } },
}

describe('http', () => {
  it('desembrulha o envelope de sucesso', async () => {
    const { adapter } = fakeAdapter({ '/x': [{ status: 200, data: { success: true, data: { a: 1 } } }] })
    const http = createHttp({ adapter })
    await expect(http.get('/x')).resolves.toEqual({ a: 1 })
  })

  it('devolve items e meta em listas', async () => {
    const meta = { page: 1, page_size: 20, total: 1, total_pages: 1 }
    const { adapter } = fakeAdapter({ '/l': [{ status: 200, data: { success: true, data: [1], meta } }] })
    const http = createHttp({ adapter })
    await expect(http.list('/l')).resolves.toEqual({ items: [1], meta })
  })

  it('normaliza o envelope de erro em ApiError', async () => {
    const body = {
      success: false,
      error: { code: 'DUPLICATE_EMAIL', message: 'Já existe', details: [{ field: 'email', message: 'duplicado' }] },
    }
    const { adapter } = fakeAdapter({ '/e': [{ status: 409, data: body }] })
    const http = createHttp({ adapter })
    const error = await http.get('/e').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ code: 'DUPLICATE_EMAIL', status: 409, requestId: 'req-1' })
    expect((error as ApiError).fieldMessage('email')).toBe('duplicado')
  })

  it('envia o token do provider', async () => {
    const { adapter, calls } = fakeAdapter({ '/x': [{ status: 200, data: { success: true, data: 1 } }] })
    const http = createHttp({ adapter })
    http.configureAuth({ tokenProvider: () => 'abc' })
    await http.get('/x')
    expect(calls[0]?.headers.Authorization).toBe('Bearer abc')
  })

  it('faz um único refresh para 401 concorrentes e repete as requisições', async () => {
    const ok = { status: 200, data: { success: true, data: 'ok' } }
    const { adapter, calls } = fakeAdapter({ '/a': [expired, ok], '/b': [expired, ok] })
    const http = createHttp({ adapter })
    let token = 'velho'
    const refresh = vi.fn(async () => {
      token = 'novo'
      return token
    })
    http.configureAuth({ tokenProvider: () => token, refresh })

    await expect(Promise.all([http.get('/a'), http.get('/b')])).resolves.toEqual(['ok', 'ok'])
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(calls.filter((c) => c.headers.Authorization === 'Bearer novo')).toHaveLength(2)
  })

  it('chama onUnauthorized quando o refresh falha', async () => {
    const { adapter } = fakeAdapter({ '/a': [expired] })
    const http = createHttp({ adapter })
    const onUnauthorized = vi.fn()
    http.configureAuth({ refresh: async () => null, onUnauthorized })
    await expect(http.get('/a')).rejects.toMatchObject({ code: 'TOKEN_EXPIRED' })
    expect(onUnauthorized).toHaveBeenCalledOnce()
  })

  it('não trata 401 de /auth/* como sessão expirada', async () => {
    const bad = {
      status: 401,
      data: { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'x', details: [] } },
    }
    const { adapter } = fakeAdapter({ '/auth/login': [bad] })
    const http = createHttp({ adapter })
    const onUnauthorized = vi.fn()
    http.configureAuth({ onUnauthorized })
    await expect(http.post('/auth/login', {})).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' })
    expect(onUnauthorized).not.toHaveBeenCalled()
  })

  it('erro de rede vira NETWORK_ERROR', async () => {
    const adapter: AxiosAdapter = async (config) => {
      throw new AxiosError('down', 'ERR_NETWORK', config)
    }
    const http = createHttp({ adapter })
    await expect(http.get('/x')).rejects.toMatchObject({ code: 'NETWORK_ERROR', status: 0 })
  })
})
