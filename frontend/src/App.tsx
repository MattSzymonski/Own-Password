import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "./styles/general.css"
import MainPage from './components/MainPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MainPage />
  </StrictMode>,
)

export default function App() {
  return <MainPage />
}

