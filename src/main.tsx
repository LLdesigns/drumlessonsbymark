import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css' // Imports design-tokens.css automatically
import App from './App.tsx'
import { theme } from './lib/theme'

// Initialize theme from localStorage before rendering
const savedTheme = (typeof window !== 'undefined' && localStorage.getItem('theme')) as 'dark' | 'light' | null
if (savedTheme) {
  theme.setTheme(savedTheme)
} else {
  theme.setTheme('dark') // Default to dark theme
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
