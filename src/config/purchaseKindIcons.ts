import type { Component } from 'vue'
import { Book, Mail, Layers, Boxes } from '@lucide/vue'

export const purchaseKindIcons: Record<string, Component> = {
  book: Book,
  envelope: Mail,
  stack: Layers,
  stack3d: Boxes,
}
