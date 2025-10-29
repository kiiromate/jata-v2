import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import React from 'react';

interface PostHogProviderProps {
  children: React.ReactNode;
}

const PostHogWrapper: React.FC<PostHogProviderProps> = ({ children }) => {
  const posthogKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
  const posthogHost = import.meta.env.VITE_PUBLIC_POSTHOG_HOST;

  if (posthogKey && posthogHost) {
    if (!posthog.__loaded) {
      posthog.init(posthogKey, {
        api_host: posthogHost,
        person_profiles: 'identified_only',
        capture_pageview: false, // Disable automatic pageview capture
        disable_session_recording: true, // Disable session recording in dev
      });
    }

    return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
  }

  // Return children without PostHog if not configured
  console.warn('[PostHog] Not initialized - missing environment variables');
  return <>{children}</>;
};

export default PostHogWrapper;
