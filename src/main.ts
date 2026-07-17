import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import ErrorView from './views/ErrorView.vue'
import { router } from './router'
import { i18n } from './i18n'
import { ensureSeeded } from './db/database'

async function bootstrap() {
  try {
    await ensureSeeded()
  } catch (error) {
    const app = createApp(ErrorView, {
      message: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
    })
    app.use(i18n)
    app.mount('#app')
    return
  }

  const app = createApp(App)
  app.use(createPinia())
  app.use(router)
  app.use(i18n)
  app.mount('#app')
}

bootstrap()
