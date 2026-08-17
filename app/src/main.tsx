/**
 * main.tsx — Where the app starts.
 *
 * Two things happen here:
 *  1. The React app is mounted into the page.
 *  2. The service worker is registered: that's what makes the app
 *     installable on Android and usable offline (see public/sw.js).
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);

// Register the offline service worker (only in the built app, not in dev).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // Offline support is a bonus; if registration fails the app still works online.
    });
  });

  // When a NEW version of the app takes over (the server was updated),
  // reload once so the user immediately sees it. The guard skips the very
  // first install, where no service worker was controlling the page before.
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController) window.location.reload();
  });
}
