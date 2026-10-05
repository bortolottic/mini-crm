/** Menu principal (PRD §13 / SPEC §11.2).
 *
 * `phase` indica a fase do PLANO.md que entrega a tela. Enquanto a fase não
 * chega, a rota cai no `PlaceholderView`, que diz isso — melhor que menu vazio
 * ou link quebrado durante o desenvolvimento.
 */
import type { Component } from 'vue'
import {
  Building2,
  CalendarDays,
  CircleCheckBig,
  Contact,
  FileText,
  Home,
  KanbanSquare,
  LayoutDashboard,
  Mail,
  Package,
  Settings,
  Sparkles,
  Target,
  UserRoundCheck,
  UserRoundSearch,
} from 'lucide-vue-next'

import type { Feature } from '@/config/features'

export interface NavItem {
  /** Nome da rota (vue-router). */
  name: string
  path: string
  /** Chave i18n do rótulo. */
  label: string
  icon: Component
  phase: string
  feature?: Feature
  adminOnly?: boolean
}

export interface NavGroup {
  label?: string
  items: NavItem[]
}

export const navigation: NavGroup[] = [
  {
    items: [
      { name: 'home', path: '/', label: 'nav.home', icon: Home, phase: 'F0' },
      { name: 'dashboard', path: '/dashboard', label: 'nav.dashboard', icon: LayoutDashboard, phase: 'P1', feature: 'dashboard' },
    ],
  },
  {
    label: 'nav.groups.crm',
    items: [
      { name: 'leads', path: '/leads', label: 'nav.leads', icon: Sparkles, phase: 'F3' },
      { name: 'prospects', path: '/prospects', label: 'nav.prospects', icon: UserRoundSearch, phase: 'F3' },
      { name: 'customers', path: '/customers', label: 'nav.customers', icon: UserRoundCheck, phase: 'F3' },
      { name: 'companies', path: '/companies', label: 'nav.companies', icon: Building2, phase: 'F3' },
      { name: 'contacts', path: '/contacts', label: 'nav.contacts', icon: Contact, phase: 'F3' },
    ],
  },
  {
    label: 'nav.groups.sales',
    items: [
      { name: 'pipeline', path: '/pipeline', label: 'nav.pipeline', icon: KanbanSquare, phase: 'F5' },
      { name: 'opportunities', path: '/opportunities', label: 'nav.opportunities', icon: Target, phase: 'F5' },
      { name: 'proposals', path: '/proposals', label: 'nav.proposals', icon: FileText, phase: 'F7' },
    ],
  },
  {
    label: 'nav.groups.activities',
    items: [
      { name: 'activities', path: '/activities', label: 'nav.activities', icon: CircleCheckBig, phase: 'F6' },
      { name: 'agenda', path: '/agenda', label: 'nav.agenda', icon: CalendarDays, phase: 'P1', feature: 'agenda' },
    ],
  },
  {
    label: 'nav.groups.communication',
    items: [
      { name: 'emails', path: '/emails', label: 'nav.emails', icon: Mail, phase: 'P1', feature: 'communication' },
    ],
  },
  {
    label: 'nav.groups.catalog',
    items: [{ name: 'products', path: '/products', label: 'nav.products', icon: Package, phase: 'F7' }],
  },
  {
    label: 'nav.groups.settings',
    items: [{ name: 'settings', path: '/settings', label: 'nav.settings', icon: Settings, phase: 'F1' }],
  },
]
