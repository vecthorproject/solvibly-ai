import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { configureApiBase } from './api.js'

// Where the API lives: VITE_API_URL at build time, otherwise relative URLs (Vite proxy in development,
// the host's rewrite rule in production, with a fallback to the known backend — see api.js).
configureApiBase()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
