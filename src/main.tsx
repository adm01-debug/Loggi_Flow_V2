import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import "./i18n";
import "./index.css";

// Sentry só inicializa quando o DSN está configurado (opt-in por ambiente).
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
  });
}

// Unregister stale service workers in Lovable preview/sandbox to avoid
// the app being stuck on an old cached splash screen.
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  const host = window.location.hostname;
  const isPreview =
    host.includes("lovableproject.com") ||
    host.includes("lovable.app") ||
    host.includes("lovable.dev") ||
    host === "localhost";
  if (isPreview) {
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => regs.forEach((r) => r.unregister()))
      .catch(() => {});
    if (window.caches) {
      caches
        .keys()
        .then((keys) => keys.forEach((k) => caches.delete(k)))
        .catch(() => {});
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
  </StrictMode>,
);

// Remove branded splash screen once React has mounted.
// Uses rAF to wait for the first paint of the React tree, then fades it out.
const hideSplash = () => {
  const splash = document.getElementById("splash-screen");
  if (!splash) return;
  splash.classList.add("splash-hidden");
  window.setTimeout(() => splash.remove(), 400);
};
requestAnimationFrame(() => requestAnimationFrame(hideSplash));
// Safety net: ensure it never stays stuck even if rAF doesn't fire.
window.setTimeout(hideSplash, 5000);
