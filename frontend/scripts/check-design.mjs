/**
 * Lint de conformidade com o sistema de design (SPEC §14 — adaptado do Vision.AI).
 *
 * Falha o build quando alguém foge da gramática dos tokens:
 *   raio e sombra só da escala, nenhuma fonte remota, nenhuma cor literal.
 * `src/styles/tokens.css` é a única fonte de valor literal do projeto.
 *
 * As checagens estruturais do Vision.AI (catálogo de nós do editor de regras)
 * não se aplicam ao CRM e foram removidas.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const SRC = join(ROOT, 'src')
const TOKENS = join(SRC, 'styles', 'tokens.css')

const RULES = [
  {
    id: 'raio-do-sistema',
    pattern: /border-radius:(?!\s*(?:0|50%|var\(--v-radius(?:-sm|-lg|-xl)?\))\s*[;}])/g,
    message: 'raio fora da escala: use var(--v-radius[-sm|-lg|-xl]), 0 ou 50%',
  },
  {
    id: 'sombra-do-sistema',
    pattern: /box-shadow:(?!\s*(?:none|var\(--v-shadow(?:-sm|-lg)?\))\s*[;}])/g,
    message: 'sombra fora da escala: use var(--v-shadow[-sm|-lg]) ou none',
  },
  {
    id: 'sem-fonte-remota',
    // Instalação offline/self-hosted: a Inter é servida de /public/fonts (SPEC §12.2).
    pattern: /fonts\.googleapis\.com|fonts\.gstatic\.com|@import\s+url\(/g,
    message: 'fonte remota: a Inter é servida localmente de /public/fonts',
  },
  {
    id: 'cor-literal',
    pattern: /(?:color|background|border-color|fill|stroke):\s*[^;]*#[0-9a-fA-F]{3,8}/g,
    message: 'cor literal: use um token (--v-ink, --v-accent, --v-state-*)',
  },
]

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}

const findings = []
for (const file of walk(SRC)) {
  if (!['.vue', '.css', '.ts'].includes(extname(file))) continue
  if (file === TOKENS) continue

  const content = readFileSync(file, 'utf8')
  for (const rule of RULES) {
    rule.pattern.lastIndex = 0
    let match
    while ((match = rule.pattern.exec(content)) !== null) {
      const line = content.slice(0, match.index).split('\n').length
      findings.push(`${relative(ROOT, file)}:${line} [${rule.id}] ${rule.message}`)
    }
  }
}

if (findings.length) {
  console.error(`\nConformidade de design — ${findings.length} ocorrência(s):\n`)
  findings.forEach((finding) => console.error('  ' + finding))
  console.error('\nTokens em src/styles/tokens.css.\n')
  process.exit(1)
}

console.log('conformidade de design: ok')
