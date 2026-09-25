import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider } from './auth/AuthContext'
import App from './App'
import './index.css'
import kbnLogo from './assets/kbn logo.jpg'

const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]') ?? document.createElement('link')
favicon.rel = 'icon'
favicon.type = 'image/jpeg'
favicon.href = kbnLogo
document.head.appendChild(favicon)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)
