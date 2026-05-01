/**
 * @file Settings Manager Service
 * 
 * Centralized service for managing user settings with persistence to Supabase
 * and fallback to localStorage for offline access.
 */

import { supabase } from '../lib/supabaseClient';

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    applicationUpdates: boolean;
  };
  privacy: {
    analytics: boolean;
    errorReporting: boolean;
  };
  integrations: {
    googleDrive: boolean;
    googleDriveConnectedAt?: string;
  };
  ai?: {
    provider?: 'mock' | 'huggingface' | 'openrouter';
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'system',
  notifications: {
    email: true,
    push: false,
    applicationUpdates: true,
  },
  privacy: {
    analytics: true,
    errorReporting: true,
  },
  integrations: {
    googleDrive: false,
  },
};

const STORAGE_KEY = 'jata-user-settings';
const DEBOUNCE_DELAY = 500;

class SettingsManager {
  private saveTimeout: NodeJS.Timeout | null = null;

  /**
   * Load settings from Supabase user_metadata with fallback to localStorage
   */
  async loadSettings(): Promise<UserSettings> {
    try {
      // Try to load from Supabase first
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        console.warn('Could not load user from Supabase, using localStorage:', error?.message);
        return this.loadFromLocalStorage();
      }

      if (user?.user_metadata?.settings) {
        const settings = user.user_metadata.settings as UserSettings;
        // Merge with defaults to ensure all fields exist
        const mergedSettings = this.mergeWithDefaults(settings);
        // Cache in localStorage
        this.saveToLocalStorage(mergedSettings);
        return mergedSettings;
      }

      // If no settings in Supabase, try localStorage
      const localSettings = this.loadFromLocalStorage();
      
      // If we have local settings and user is authenticated, sync them to Supabase
      if (localSettings && user) {
        try {
          await this.syncToSupabase(localSettings);
        } catch (syncError) {
          console.warn('Could not sync settings to Supabase:', syncError);
          // Continue with local settings even if sync fails
        }
      }

      return localSettings;
    } catch (error) {
      console.error('Error loading settings:', error);
      return this.loadFromLocalStorage();
    }
  }

  /**
   * Save settings with debouncing to avoid excessive API calls
   */
  async saveSettings(settings: Partial<UserSettings>): Promise<void> {
    return new Promise((resolve, reject) => {
      // Clear existing timeout
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
      }

      // Debounce the save operation
      this.saveTimeout = setTimeout(async () => {
        try {
          // Load current settings
          const currentSettings = await this.loadSettings();
          
          // Merge with new settings
          const updatedSettings: UserSettings = {
            ...currentSettings,
            ...settings,
            notifications: {
              ...currentSettings.notifications,
              ...(settings.notifications || {}),
            },
            privacy: {
              ...currentSettings.privacy,
              ...(settings.privacy || {}),
            },
            integrations: {
              ...currentSettings.integrations,
              ...(settings.integrations || {}),
            },
          };

          // Validate settings
          const validation = this.validateSettings(updatedSettings);
          if (!validation.valid) {
            reject(new Error(Object.values(validation.errors).join(', ')));
            return;
          }

          // Save to localStorage immediately for offline access
          this.saveToLocalStorage(updatedSettings);

          // Try to save to Supabase
          await this.syncToSupabase(updatedSettings);

          resolve();
        } catch (error) {
          console.error('Error saving settings:', error);
          reject(error);
        }
      }, DEBOUNCE_DELAY);
    });
  }

  /**
   * Reset all settings to default values
   */
  async resetToDefaults(): Promise<void> {
    try {
      // Save defaults to localStorage
      this.saveToLocalStorage(DEFAULT_SETTINGS);

      // Sync to Supabase
      await this.syncToSupabase(DEFAULT_SETTINGS);
    } catch (error) {
      console.error('Error resetting settings:', error);
      throw error;
    }
  }

  /**
   * Validate settings before saving
   */
  validateSettings(settings: Partial<UserSettings>): ValidationResult {
    const errors: Record<string, string> = {};

    // Validate theme
    if (settings.theme && !['light', 'dark', 'system'].includes(settings.theme)) {
      errors.theme = 'Theme must be one of: light, dark, system';
    }

    // Validate notifications (must be booleans)
    if (settings.notifications) {
      if (typeof settings.notifications.email !== 'boolean') {
        errors['notifications.email'] = 'Email notification setting must be a boolean';
      }
      if (typeof settings.notifications.push !== 'boolean') {
        errors['notifications.push'] = 'Push notification setting must be a boolean';
      }
      if (typeof settings.notifications.applicationUpdates !== 'boolean') {
        errors['notifications.applicationUpdates'] = 'Application updates setting must be a boolean';
      }
    }

    // Validate privacy (must be booleans)
    if (settings.privacy) {
      if (typeof settings.privacy.analytics !== 'boolean') {
        errors['privacy.analytics'] = 'Analytics setting must be a boolean';
      }
      if (typeof settings.privacy.errorReporting !== 'boolean') {
        errors['privacy.errorReporting'] = 'Error reporting setting must be a boolean';
      }
    }

    // Validate integrations
    if (settings.integrations) {
      if (typeof settings.integrations.googleDrive !== 'boolean') {
        errors['integrations.googleDrive'] = 'Google Drive setting must be a boolean';
      }
    }

    // Validate optional AI provider preference.
    if (settings.ai?.provider && !['mock', 'huggingface', 'openrouter'].includes(settings.ai.provider)) {
      errors['ai.provider'] = 'AI provider must be one of: mock, huggingface, openrouter';
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Load settings from localStorage
   */
  private loadFromLocalStorage(): UserSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as UserSettings;
        return this.mergeWithDefaults(parsed);
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
    return DEFAULT_SETTINGS;
  }

  /**
   * Save settings to localStorage
   */
  private saveToLocalStorage(settings: UserSettings): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  /**
   * Sync settings to Supabase user_metadata
   */
  private async syncToSupabase(settings: UserSettings): Promise<void> {
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          settings,
        },
      });

      if (error) {
        console.error('Error syncing to Supabase:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error syncing to Supabase:', error);
      throw error;
    }
  }

  /**
   * Merge partial settings with defaults to ensure all fields exist
   */
  private mergeWithDefaults(settings: Partial<UserSettings>): UserSettings {
    return {
      theme: settings.theme || DEFAULT_SETTINGS.theme,
      notifications: {
        ...DEFAULT_SETTINGS.notifications,
        ...(settings.notifications || {}),
      },
      privacy: {
        ...DEFAULT_SETTINGS.privacy,
        ...(settings.privacy || {}),
      },
      integrations: {
        ...DEFAULT_SETTINGS.integrations,
        ...(settings.integrations || {}),
      },
      ai: settings.ai,
    };
  }

  /**
   * Get default settings
   */
  getDefaults(): UserSettings {
    return { ...DEFAULT_SETTINGS };
  }
}

// Export singleton instance
export const settingsManager = new SettingsManager();
