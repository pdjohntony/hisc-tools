import { createApp } from 'vue'
import App from './App.vue'
import router from './router.ts'

import * as Sentry from '@sentry/vue'

const app = createApp(App)

if (import.meta.env.PROD) {
  Sentry.init({
    app,
    environment: import.meta.env.MODE,
    dsn: 'https://32fede3305b37204bcfee6dff8f03ca0@o4508095743852544.ingest.us.sentry.io/4509112422694912',
    integrations: [Sentry.browserTracingIntegration({ router }), Sentry.replayIntegration()],
    // Tracing
    tracesSampleRate: 1.0,
    tracePropagationTargets: ['localhost'],
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0
  })
}

app.use(router).mount('#app')
