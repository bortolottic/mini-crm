/** Cliente HTTP único (SPEC §11.1).
 *
 * * `baseURL = /api/v1` relativo — em dev o Vite faz proxy, em produção o nginx.
 * * Desembrulha o envelope: quem chama recebe `data` (ou `{ items, meta }`).
 * * Normaliza todo erro em `ApiError { code, message, details, status }`.
 * * Em `401 TOKEN_EXPIRED` faz **um** refresh — requisições concorrentes esperam
 *   o mesmo refresh — e repete a original uma vez. Falhou o refresh: chama o
 *   handler de não autenticado (logout + /login).
 *
 * A F1 (auth) registra os ganchos `tokenProvider`, `refresh` e `onUnauthorized`
 * via `configureAuth`; até lá eles são no-op.
 */
import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios'

import type { ErrorDetail, ErrorEnvelope, ListParams, Page, SuccessEnvelope } from '@/types/api'

export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly details: ErrorDetail[] = [],
    readonly requestId?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }

  /** Mensagem do campo, para mapear `details[]` nos formulários. */
  fieldMessage(field: string): string | undefined {
    return this.details.find((d) => d.field === field)?.message
  }
}

export interface AuthHooks {
  tokenProvider: () => string | null
  /** Renova o access token; devolve o novo ou `null` se a sessão acabou. */
  refresh: () => Promise<string | null>
  onUnauthorized: () => void
}

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean }

function isErrorEnvelope(body: unknown): body is ErrorEnvelope {
  return typeof body === 'object' && body !== null && (body as ErrorEnvelope).success === false
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (error instanceof AxiosError) {
    const status = error.response?.status ?? 0
    const requestId = error.response?.headers?.['x-request-id'] as string | undefined
    const body: unknown = error.response?.data
    if (isErrorEnvelope(body)) {
      const { code, message, details } = body.error
      return new ApiError(code, message, status, details, requestId)
    }
    if (!error.response) {
      return new ApiError('NETWORK_ERROR', 'Não foi possível falar com o servidor.', 0)
    }
    return new ApiError('HTTP_ERROR', 'Erro inesperado na resposta do servidor.', status, [], requestId)
  }
  return new ApiError('UNKNOWN_ERROR', 'Erro inesperado.', 0)
}

export function createHttp(config: AxiosRequestConfig = {}) {
  const instance: AxiosInstance = axios.create({
    baseURL: '/api/v1',
    timeout: 30_000,
    withCredentials: true,
    ...config,
  })

  let hooks: AuthHooks = {
    tokenProvider: () => null,
    refresh: async () => null,
    onUnauthorized: () => {},
  }
  let refreshing: Promise<string | null> | null = null

  instance.interceptors.request.use((req) => {
    const token = hooks.tokenProvider()
    if (token) req.headers.set('Authorization', `Bearer ${token}`)
    return req
  })

  instance.interceptors.response.use(undefined, async (error: unknown) => {
    const apiError = toApiError(error)
    const original = (error as AxiosError).config as RetriableConfig | undefined
    // 401 de /auth/* (credencial errada, refresh inválido) é resposta, não sessão expirada.
    if (original?.url?.startsWith('/auth/')) return Promise.reject(apiError)

    if (
      apiError.status === 401 &&
      apiError.code === 'TOKEN_EXPIRED' &&
      original &&
      !original._retried
    ) {
      original._retried = true
      // Fila única: todas as requisições que receberem 401 agora esperam o mesmo refresh.
      refreshing ??= hooks.refresh().finally(() => {
        refreshing = null
      })
      const token = await refreshing.catch(() => null)
      if (token) return instance.request(original)
      hooks.onUnauthorized()
    } else if (apiError.status === 401) {
      hooks.onUnauthorized()
    }
    return Promise.reject(apiError)
  })

  async function unwrap<T>(promise: Promise<{ data: SuccessEnvelope<T> }>): Promise<T> {
    const response = await promise
    return response.data.data
  }

  return {
    instance,
    configureAuth(next: Partial<AuthHooks>) {
      hooks = { ...hooks, ...next }
    },
    get: <T>(url: string, params?: object) => unwrap<T>(instance.get(url, { params })),
    post: <T>(url: string, body?: unknown, extra?: AxiosRequestConfig) =>
      unwrap<T>(instance.post(url, body, extra)),
    put: <T>(url: string, body?: unknown, extra?: AxiosRequestConfig) =>
      unwrap<T>(instance.put(url, body, extra)),
    patch: <T>(url: string, body?: unknown, extra?: AxiosRequestConfig) =>
      unwrap<T>(instance.patch(url, body, extra)),
    async delete(url: string, extra?: AxiosRequestConfig): Promise<void> {
      await instance.delete(url, extra)
    },
    async list<T>(url: string, params?: ListParams): Promise<Page<T>> {
      const { data } = await instance.get<SuccessEnvelope<T[]>>(url, { params })
      if (!data.meta) throw new ApiError('INVALID_RESPONSE', 'Resposta sem paginação.', 200)
      return { items: data.data, meta: data.meta }
    },
  }
}

export type Http = ReturnType<typeof createHttp>

export const http = createHttp()
