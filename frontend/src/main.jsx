import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'
import { GoogleOAuthProvider } from '@react-oauth/google'

// Register Service Worker and handle updates
registerSW({
  onNeedRefresh() {
    if ('setAppBadge' in navigator) {
      navigator.setAppBadge(1).catch(() => {});
    }
  },
  onOfflineReady() {
  },
});

const GOOGLE_CLIENT_ID = '687528189146-64gpt46kkdipv6rcdeclrn9cuepnqaoj.apps.googleusercontent.com'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
)
