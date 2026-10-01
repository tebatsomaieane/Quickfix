import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './components/ui/ToastProvider'
import ConnectionBanner from './components/ui/ConnectionBanner'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ToastProvider>
        {/* Sits outside App so a crashed route cannot hide the reason the app
            stopped loading data in the first place. */}
        <ConnectionBanner />
        <App />
      </ToastProvider>
    </AuthProvider>
  </StrictMode>,
)
