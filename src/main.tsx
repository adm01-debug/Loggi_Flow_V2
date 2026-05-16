import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import './i18n';
import './index.css';

// Unregister stale service workers in Lovable preview/sandbox to avoid
// the app being stuck on an old cached splash screen.
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const host = window.location.hostname;
  const isPreview =
    host.includes('lovableproject.com') ||
    host.includes('lovable.app') ||
    host.includes('lovable.dev') ||
    host === 'localhost';
  if (isPreview) {
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => regs.forEach((r) => r.unregister()))
      .catch(() => {});
    if (window.caches) {
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => {});
    }
  }
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);