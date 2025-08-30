import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import * as Sentry from '@sentry/react';
import { PostHogProvider } from 'posthog-js/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
  tracesSampleRate: 1.0,
  replaysOnErrorSampleRate: 1.0,
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PostHogProvider
      apiKey={import.meta.env.VITE_POSTHOG_KEY}
      options={{ api_host: import.meta.env.VITE_POSTHOG_HOST }}
    >
      <App />
    </PostHogProvider>
  </React.StrictMode>
);
