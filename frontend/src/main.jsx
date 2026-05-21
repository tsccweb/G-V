import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// Register Service Worker and handle updates
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('New content available, click to refresh');
    if ('setAppBadge' in navigator) {
      navigator.setAppBadge(1).catch(() => {});
    }
  },
  onOfflineReady() {
    console.log('App ready for offline use');
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
