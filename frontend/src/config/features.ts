/** Feature flags (SPEC §11.2): itens P1 ficam fora do menu e das rotas até existirem. */
export const features = {
  dashboard: false,
  agenda: false,
  communication: false,
  tags: false,
} as const

export type Feature = keyof typeof features

export function isEnabled(feature?: Feature): boolean {
  return feature === undefined || features[feature]
}
