import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useStore } from './store/useStore'
import * as exportLib from './lib/export'

if (import.meta.env.DEV) {
  ;(window as unknown as { __store?: typeof useStore }).__store = useStore
  ;(window as unknown as { __export?: typeof exportLib }).__export = exportLib
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
