/**
 * @file Supabase client configuration for the JATA browser extension.
 *
 * This file initializes and exports the Supabase client instance for use
 * within the browser extension. Environment variables are loaded from
 * chrome.storage.local to ensure they persist across sessions.
 */
import { createClient } from '@supabase/supabase-js';
console.log('Supabase Client Initializing...');
// These will be set during build time or loaded from chrome.storage
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
/**
 * The singleton Supabase client instance for the extension.
 *
 * @remarks
 * This client is used for all interactions with the Supabase backend,
 * providing authentication, database operations, and edge function calls.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        // Use storage adapter for extension
        storage: {
            getItem: async (key) => {
                return new Promise((resolve) => {
                    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                        chrome.storage.local.get([key], (result) => {
                            resolve(result[key] || null);
                        });
                    }
                    else {
                        // Fallback for dev environment
                        resolve(localStorage.getItem(key));
                    }
                });
            },
            setItem: async (key, value) => {
                return new Promise((resolve) => {
                    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                        chrome.storage.local.set({ [key]: value }, () => {
                            resolve();
                        });
                    }
                    else {
                        localStorage.setItem(key, value);
                        resolve();
                    }
                });
            },
            removeItem: async (key) => {
                return new Promise((resolve) => {
                    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                        chrome.storage.local.remove([key], () => {
                            resolve();
                        });
                    }
                    else {
                        localStorage.removeItem(key);
                        resolve();
                    }
                });
            },
        },
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
/**
 * Get the current authenticated user
 */
export const getCurrentUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
        console.error('Error getting current user:', error);
        return null;
    }
    return user;
};
/**
 * Check if user is authenticated
 */
export const isAuthenticated = async () => {
    const user = await getCurrentUser();
    return user !== null;
};
