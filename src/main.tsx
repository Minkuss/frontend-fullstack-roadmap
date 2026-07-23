import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { ProgressProvider } from './app/ProgressProvider'
import './styles/global.css'

createRoot(document.getElementById('root')!).render(
  <ProgressProvider>
    <StrictMode>
      <App />
    </StrictMode>
  </ProgressProvider>,
)
