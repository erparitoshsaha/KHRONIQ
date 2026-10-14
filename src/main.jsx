import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Auto-recover from stale chunks after deployments
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  window.location.reload();
});

window.addEventListener('error', (event) => {
  const msg = event?.message || '';
  if (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('error loading dynamically imported module')
  ) {
    if (!sessionStorage.getItem('chunk_reload_attempted')) {
      sessionStorage.setItem('chunk_reload_attempted', 'true');
      window.location.reload();
    }
  }
});

// Auto-recover if CSS bundle fails to load after a fresh deployment
window.addEventListener('load', () => {
  const linkTags = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
  const hasFailedLink = linkTags.some(link => link.sheet === null && link.href.includes('/assets/'));
  if (hasFailedLink && !sessionStorage.getItem('css_reload_attempted')) {
    sessionStorage.setItem('css_reload_attempted', 'true');
    window.location.reload();
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
