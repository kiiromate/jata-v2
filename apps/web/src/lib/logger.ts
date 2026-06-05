import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry error tracking and performance monitoring.
 * It will run only if VITE_SENTRY_DSN is defined in the environment.
 */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (dsn) {
    Sentry.init({
      dsn,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration()
      ],
      tracesSampleRate: 1.0,
      replaysOnErrorSampleRate: 1.0,
      environment: import.meta.env.PROD ? 'production' : 'development',
    });
  } else if (!import.meta.env.PROD) {
    console.warn('[Sentry] VITE_SENTRY_DSN is not configured. Sentry is disabled.');
  }
}

/**
 * Logs an error to the console and reports it to Sentry if configured.
 * 
 * @param error The error object or unknown error type.
 * @param context Key-value pairs of metadata context.
 * @param scopeName A namespace context name for the error (e.g. 'feedback', 'contact', 'auth').
 */
export function logError(
  error: Error | unknown,
  context?: Record<string, unknown>,
  scopeName: string = 'general'
): void {
  // Always log to console for local developer debugging
  console.error(`[Logger] [${scopeName}]`, {
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error,
    context,
    timestamp: new Date().toISOString(),
  });

  // Report to Sentry
  try {
    Sentry.captureException(error, {
      contexts: {
        [scopeName]: context || {},
      },
    });
  } catch (sentryError) {
    console.error('[Logger] Failed to send error to Sentry:', sentryError);
  }
}
