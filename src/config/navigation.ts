import type { Component } from 'vue'
import {
  BookOpen,
  Rows3,
  ChartColumn,
  Medal,
  Layers,
  ArrowLeftRight,
  Repeat,
  MessageSquareText,
  Banknote,
  Settings as SettingsIcon,
} from '@lucide/vue'

export interface NavItem {
  key: string
  path: string
  icon: Component
  titleKey: string
  subtitleKey?: string
  /** Shown in the mobile bottom tab bar. */
  primary?: boolean
}

/** Single source of truth for navigation, shared by the tab bar, sidebar and the "More" list. */
export const navItems: NavItem[] = [
  { key: 'groups', path: '/groups', icon: Rows3, titleKey: 'nav.groups', primary: true },
  { key: 'album', path: '/album', icon: BookOpen, titleKey: 'nav.album', primary: true },
  {
    key: 'stats',
    path: '/stats',
    icon: ChartColumn,
    titleKey: 'nav.stats',
    subtitleKey: 'nav.statsSubtitle',
  },
  {
    key: 'achievements',
    path: '/achievements',
    icon: Medal,
    titleKey: 'nav.achievements',
    subtitleKey: 'nav.achievementsSubtitle',
  },
  {
    key: 'duplicates',
    path: '/duplicates',
    icon: Layers,
    titleKey: 'nav.duplicates',
    subtitleKey: 'nav.duplicatesSubtitle',
  },
  {
    key: 'exchange',
    path: '/exchange',
    icon: ArrowLeftRight,
    titleKey: 'nav.exchange',
    subtitleKey: 'nav.exchangeSubtitle',
  },
  {
    key: 'tradeAnalysis',
    path: '/trade-analysis',
    icon: Repeat,
    titleKey: 'nav.tradeAnalysis',
    subtitleKey: 'nav.tradeAnalysisSubtitle',
  },
  {
    key: 'tradeMessage',
    path: '/trade-message',
    icon: MessageSquareText,
    titleKey: 'nav.tradeMessage',
    subtitleKey: 'nav.tradeMessageSubtitle',
  },
  {
    key: 'finance',
    path: '/finance',
    icon: Banknote,
    titleKey: 'nav.finance',
    subtitleKey: 'nav.financeSubtitle',
  },
  {
    key: 'settings',
    path: '/settings',
    icon: SettingsIcon,
    titleKey: 'nav.settings',
    subtitleKey: 'nav.settingsSubtitle',
  },
]

export const tabItems = navItems.filter((item) => item.primary)
export const moreItems = navItems.filter((item) => !item.primary)
