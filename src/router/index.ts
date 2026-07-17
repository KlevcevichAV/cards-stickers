import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/album' },
    { path: '/album', name: 'album', component: () => import('@/views/AlbumView.vue') },
    { path: '/groups', name: 'groups', component: () => import('@/views/GroupsView.vue') },
    { path: '/more', name: 'more', component: () => import('@/views/MoreView.vue') },
    { path: '/stats', name: 'stats', component: () => import('@/views/StatsView.vue') },
    {
      path: '/achievements',
      name: 'achievements',
      component: () => import('@/views/AchievementsView.vue'),
    },
    {
      path: '/duplicates',
      name: 'duplicates',
      component: () => import('@/views/DuplicatesView.vue'),
    },
    {
      path: '/exchange',
      name: 'exchange',
      component: () => import('@/views/exchange/ExchangeListView.vue'),
    },
    {
      path: '/exchange/new',
      name: 'exchange-new',
      component: () => import('@/views/exchange/NewExchangeView.vue'),
    },
    {
      path: '/exchange/:id/edit',
      name: 'exchange-edit',
      component: () => import('@/views/exchange/EditExchangeView.vue'),
      props: true,
    },
    {
      path: '/exchange/:id/restore',
      name: 'exchange-restore',
      component: () => import('@/views/exchange/RestoreExchangeView.vue'),
      props: true,
    },
    {
      path: '/exchange/partners',
      name: 'exchange-partners',
      component: () => import('@/views/exchange/PartnerStatsView.vue'),
    },
    {
      path: '/trade-analysis',
      name: 'trade-analysis',
      component: () => import('@/views/TradeAnalysisView.vue'),
    },
    {
      path: '/trade-message',
      name: 'trade-message',
      component: () => import('@/views/TradeMessageView.vue'),
    },
    { path: '/finance', name: 'finance', component: () => import('@/views/FinanceView.vue') },
    {
      path: '/finance/add-purchase',
      name: 'finance-add-purchase',
      component: () => import('@/views/finance/AddPurchaseView.vue'),
    },
    {
      path: '/finance/add-sale',
      name: 'finance-add-sale',
      component: () => import('@/views/finance/AddSaleView.vue'),
    },
    { path: '/settings', name: 'settings', component: () => import('@/views/SettingsView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/album' },
  ],
})
