import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'

// In production the frontend can live on a different domain from the backend:
// set VITE_API_URL (e.g. https://solvibly-ai-backend.onrender.com) at build time.
// In development it stays empty and Vite proxies /api to the local backend.
axios.defaults.baseURL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
