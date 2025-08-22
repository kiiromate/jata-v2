import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import React from 'react';

interface PostHogProviderProps {
  children: React.ReactNode;
}

const PostHogWrapper: React.FC<PostHogProviderProps> = ({ children }) => {
  const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
  const posthogHost = import.meta.env.VITE_PUBLIC_POSTHOG_HOST;

  if (posthogKey && posthogHost) {
    posthog.init(posthogKey, {
      api_host: posthogHost,
      person_profiles: 'identified_only',
    });

    return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
  }

  return <>{children}</>;
};

export default PostHogWrapper;
