<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { Ellipsis as EllipsisIcon } from '@lucide/vue'
import { tabItems, moreItems } from '@/config/navigation'

const route = useRoute()
const isMoreActive = () => moreItems.some((item) => route.path.startsWith(item.path))
</script>

<template>
  <nav class="tab-bar">
    <RouterLink
      v-for="item in tabItems"
      :key="item.key"
      :to="item.path"
      class="tab"
      :class="{ active: route.path.startsWith(item.path) }"
    >
      <component :is="item.icon" :size="22" />
      <span>{{ $t(item.titleKey) }}</span>
    </RouterLink>
    <RouterLink to="/more" class="tab" :class="{ active: isMoreActive() || route.path === '/more' }">
      <EllipsisIcon :size="22" />
      <span>{{ $t('nav.more') }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.tab-bar {
  display: flex;
  position: sticky;
  bottom: 0;
  z-index: var(--z-shell);
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-elevated);
  padding-bottom: var(--safe-bottom);
}

.tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: var(--space-2) 0 6px;
  color: var(--color-text-tertiary);
  font-size: 10px;
}

.tab.active {
  color: var(--color-accent);
}
</style>
