import { http } from '@/services/http'

export interface Health {
  status: 'ok' | 'degraded'
  db: 'ok' | 'fail'
  version: string
}

export const getHealth = () => http.get<Health>('/health')
