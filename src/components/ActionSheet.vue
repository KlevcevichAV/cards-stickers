<script setup lang="ts">
import type { SheetAction } from '@/types/ui'

defineProps<{
  open: boolean
  title?: string
  actions: SheetAction[]
}>()

const emit = defineEmits<{ close: [] }>()

function select(action: SheetAction) {
  action.onSelect()
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet-fade">
      <div v-if="open" class="backdrop" @click="emit('close')">
        <Transition name="sheet-slide" appear>
          <div class="sheet" @click.stop>
            <div v-if="title" class="sheet-title">{{ title }}</div>
            <button
              v-for="(action, i) in actions"
              :key="i"
              class="sheet-action"
              :class="{ destructive: action.style === 'destructive' }"
              @click="select(action)"
            >
              {{ action.label }}
            </button>
            <button class="sheet-action cancel" @click="emit('close')">
              {{ $t('common.cancel') }}
            </button>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: var(--z-overlay);
  padding: var(--space-3);
  padding-bottom: calc(var(--space-3) + var(--safe-bottom));
}

.sheet {
  width: 100%;
  max-width: 420px;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
}

.sheet-title {
  padding: var(--space-3);
  text-align: center;
  font-size: 12px;
  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-border);
}

.sheet-action {
  display: block;
  width: 100%;
  padding: var(--space-3);
  text-align: center;
  font-size: 16px;
  color: var(--color-accent);
  border-bottom: 1px solid var(--color-border);
}

.sheet-action:last-child {
  border-bottom: none;
}

.sheet-action.destructive {
  color: var(--color-danger);
}

.sheet-action.cancel {
  font-weight: 600;
  color: var(--color-text);
  margin-top: var(--space-2);
  border-radius: var(--radius-lg);
}

.sheet-fade-enter-active,
.sheet-fade-leave-active {
  transition: opacity 0.2s ease;
}
.sheet-fade-enter-from,
.sheet-fade-leave-to {
  opacity: 0;
}

.sheet-slide-enter-active,
.sheet-slide-leave-active {
  transition: transform 0.25s ease;
}
.sheet-slide-enter-from,
.sheet-slide-leave-to {
  transform: translateY(100%);
}
</style>
