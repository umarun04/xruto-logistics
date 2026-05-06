import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ToastProvider } from './ui/ToastContext.jsx'

// Dev: unregister any PWA service worker so it cannot intercept, clone, or cache large API
// responses (CacheStorage on analytics-sized JSON froze the whole tab). Production only: register.
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    for (const reg of regs) reg.unregister()
  })
} else if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((r) => console.log('SW registered', r.scope))
      .catch((e) => console.warn('SW registration failed', e))
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>,
)
