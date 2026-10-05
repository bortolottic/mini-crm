/** Contrato do envelope da API (SPEC §7.1). */

export interface PageMeta {
  page: number
  page_size: number
  total: number
  total_pages: number
}

export interface SuccessEnvelope<T> {
  success: true
  data: T
  meta?: PageMeta
}

export interface ErrorDetail {
  field?: string
  code?: string
  message?: string
  [key: string]: unknown
}

export interface ErrorEnvelope {
  success: false
  error: { code: string; message: string; details: ErrorDetail[] }
}

export interface Page<T> {
  items: T[]
  meta: PageMeta
}

export interface ListParams {
  page?: number
  page_size?: number
  sort?: string
  q?: string
  [filter: string]: string | number | boolean | undefined
}
