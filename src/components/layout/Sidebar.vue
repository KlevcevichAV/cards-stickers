<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { navItems } from '@/config/navigation'

const route = useRoute()
</script>

<template>
  <nav class="sidebar">
    <div class="brand">🏆 WC26</div>
    <ul>
      <li v-for="item in navItems" :key="item.key">
        <RouterLink :to="item.path" class="row" :class="{ active: route.path.startsWith(item.path) }">
          <component :is="item.icon" :size="18" />
          <span>{{ $t(item.titleKey) }}</span>
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.sidebar {
  width: 240px;
  flex-shrink: 0;
  height: 100dvh;
  position: sticky;
  top: 0;
  border-right: 1px solid var(--color-border);
  background: var(--color-bg-elevated);
  padding: var(--space-4) var(--space-2);
  overflow-y: auto;
}

.brand {
  font-weight: 700;
  font-size: 16px;
  padding: 0 var(--space-3);
  margin-bottom: var(--space-4);
}

.row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: 14px;
}

.row:hover {
  background: var(--color-bg-sunken);
}

.row.active {
  background: var(--color-accent);
  color: var(--color-accent-contrast);
}
</style>
