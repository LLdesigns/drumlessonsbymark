import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css' // Imports design-tokens.css automatically
import App from './App.tsx'
import { useThemeStore } from './store/themeStore'

// Apply stored theme before first paint
useThemeStore.getState().init()

// Service worker registration is handled by vite-plugin-pwa (injectRegister: 'auto' in vite.config.ts)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
