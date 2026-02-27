import { useEffect } from 'react';
import { useAuth } from './useAuth';

/**
 * Hook to sync the Supabase session with the JATA browser extension.
 * It posts a window message 'JATA_SYNC_SESSION' which the extension content script listens for.
 */
export const useExtensionSync = () => {
  const { session } = useAuth();

  useEffect(() => {
    if (session) {
      // Send the session to the extension
      // We use window.postMessage so the content script can pick it up
      // regardless of the extension ID (which changes in dev)
      window.postMessage(
        {
          type: 'JATA_SYNC_SESSION',
          session: {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            user: session.user,
            expires_in: session.expires_in,
            token_type: session.token_type
          }
        },
        window.location.origin
      );
      
      console.log('JATA: Synced session to extension');
    }
  }, [session]);
};
