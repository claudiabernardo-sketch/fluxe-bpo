import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/react'
import App from './App.jsx'
// FontAwesome carregado via CDN no index.html — não duplicar aqui
import './index.css'

// ── Monitoramento de erros (Sentry) ─────────────────────────────────
// Configure VITE_SENTRY_DSN no Vercel → Settings → Environment Variables
// Obtenha o DSN em: sentry.io → Settings → Projects → [seu-projeto] → Client Keys
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,         // 'production' ou 'development'
    release: import.meta.env.VITE_APP_VERSION, // opcional
    tracesSampleRate: 0.1,   // captura 10% das transações (performance)
    replaysOnErrorSampleRate: 1.0, // replay completo em erros
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
    ],
    // Ignora erros de rede/timeout esperados
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Network request failed',
    ],
    // Não envia dados pessoais
    beforeSend(event) {
      if (event.user) delete event.user.email
      return event
    },
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
 
