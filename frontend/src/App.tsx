import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "./styles/general.css"
import MainPage from './components/MainPage'
import { registerSW } from 'virtual:pwa-register'

// Register service worker for PWA
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New version available! Reload to update?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('App is ready to work offline')
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MainPage />
  </StrictMode>,
)

export default function App() {
  return <MainPage />
}

