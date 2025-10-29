import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { GoogleDriveService } from '../services/googleDriveService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ProfileForm } from '../components/ProfileForm';
import { AvatarUpload } from '../components/AvatarUpload';
import { useToast } from '../hooks/use-toast';
import { settingsManager, UserSettings } from '../services/settingsManager';
import { useTheme } from '../components/ThemeProvider';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Sun, Moon, Laptop, Check, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';

const Settings = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [driveConnected, setDriveConnected] = useState(false);
  const [connectingDrive, setConnectingDrive] = useState(false);
  
  // Settings state
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoadingSettings(true);
        const loadedSettings = await settingsManager.loadSettings();
        setSettings(loadedSettings);
        setSettingsError(null);
      } catch (error) {
        console.error('Error loading settings:', error);
        setSettingsError('Failed to load settings. Using defaults.');
        setSettings(settingsManager.getDefaults());
      } finally {
        setLoadingSettings(false);
      }
    };

    loadSettings();
  }, []);

  // Sync theme with settings
  useEffect(() => {
    if (settings && settings.theme !== theme) {
      setTheme(settings.theme);
    }
  }, [settings?.theme]);

  // Handle settings changes with optimistic updates and rollback
  const handleSettingsChange = async (updates: Partial<UserSettings>) => {
    if (!settings) return;

    // Store previous settings for rollback
    const previousSettings = { ...settings };

    const updatedSettings = {
      ...settings,
      ...updates,
      notifications: {
        ...settings.notifications,
        ...(updates.notifications || {}),
      },
      privacy: {
        ...settings.privacy,
        ...(updates.privacy || {}),
      },
      integrations: {
        ...settings.integrations,
        ...(updates.integrations || {}),
      },
    };

    // Optimistic update
    setSettings(updatedSettings);
    setHasUnsavedChanges(true);

    try {
      setSavingSettings(true);
      await settingsManager.saveSettings(updates);
      setHasUnsavedChanges(false);
      setSettingsError(null);
      toast({
        title: 'Settings saved',
        description: 'Your preferences have been updated successfully.',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      // Rollback to previous settings on error
      setSettings(previousSettings);
      setSettingsError('Failed to save settings. Please try again.');
      toast({
        title: 'Save failed',
        description: 'Unable to save settings. Changes have been reverted.',
        variant: 'destructive',
      });
    } finally {
      setSavingSettings(false);
    }
  };

  // Handle theme change
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    handleSettingsChange({ theme: newTheme });
  };

  // Handle reset to defaults
  const handleResetToDefaults = async () => {
    try {
      setSavingSettings(true);
      await settingsManager.resetToDefaults();
      const defaults = settingsManager.getDefaults();
      setSettings(defaults);
      setTheme(defaults.theme);
      setHasUnsavedChanges(false);
      setShowResetDialog(false);
      toast({
        title: 'Settings reset',
        description: 'All settings have been restored to defaults.',
      });
    } catch (error) {
      console.error('Error resetting settings:', error);
      toast({
        title: 'Reset failed',
        description: 'Unable to reset settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingSettings(false);
    }
  };

  // Warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const connectGoogleDrive = async () => {
    try {
      setConnectingDrive(true);
      // Initiates OAuth with Google requesting Drive scope; requires provider enabled in Supabase
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'openid email profile https://www.googleapis.com/auth/drive.file',
          redirectTo: window.location.origin + '/settings',
        },
      });

      if (error) {
        console.error('OAuth error:', error);
        toast({
          title: 'Connection failed',
          description: 'Failed to connect to Google Drive. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Drive connection error:', error);
      toast({
        title: 'Connection failed',
        description: 'Failed to connect to Google Drive. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setConnectingDrive(false);
    }
  };

  // Check if Google Drive is connected on component mount
  useEffect(() => {
    const checkDriveConnection = async () => {
      if (session?.provider_token) {
        const driveService = new GoogleDriveService();
        const initialized = await driveService.initialize();
        setDriveConnected(initialized);

        if (initialized) {
          // Try to create/find the resume folder and store its ID
          const folderId = await driveService.createOrFindResumeFolder();
          if (folderId) {
            await driveService.storeFolderIdInProfile(folderId);
          }
        }
      }
    };

    checkDriveConnection();
  }, [session]);

  const handleDeleteAccount = async () => {
    if (!session?.user) return;
    if (confirmText !== 'DELETE') return;
    try {
      setDeleting(true);
      // Call an Edge Function with service role to delete the user securely
      const res = await fetch('http://127.0.0.1:54321/functions/v1/delete-user', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: session.user.id }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to delete account');
      }
      // Sign out after deletion request
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (e) {
      console.error('Delete account error:', e);
      toast({
        title: 'Deletion failed',
        description: 'Unable to delete account. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loadingSettings) {
    return (
      <div className="container mx-auto p-sm sm:p-md lg:p-lg">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-sm sm:p-md lg:p-lg">
      <div className="flex items-center justify-between mb-md">
        <h1 className="text-3xl font-bold">Account Settings</h1>
        {hasUnsavedChanges && (
          <div className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Unsaved changes</span>
          </div>
        )}
      </div>

      {settingsError && (
        <Alert variant="destructive" className="mb-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{settingsError}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="profile" className="flex flex-col md:flex-row gap-md">
        <TabsList className="flex flex-col md:w-1/4 lg:w-1/5 h-auto justify-start">
          <TabsTrigger value="profile" className="w-full text-left justify-start">Profile</TabsTrigger>
          <TabsTrigger value="appearance" className="w-full text-left justify-start">Appearance</TabsTrigger>
          <TabsTrigger value="notifications" className="w-full text-left justify-start">Notifications</TabsTrigger>
          <TabsTrigger value="privacy" className="w-full text-left justify-start">Privacy</TabsTrigger>
          <TabsTrigger value="integrations" className="w-full text-left justify-start">Integrations</TabsTrigger>
          <TabsTrigger value="danger" className="w-full text-left justify-start text-red-500 data-[state=active]:bg-red-500/10 data-[state=active]:text-red-500">Danger Zone</TabsTrigger>
        </TabsList>

        <div className="flex-1 space-y-md">
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Manage your profile information and avatar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-start gap-sm">
                  <AvatarUpload />
                  <ProfileForm />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize how JATA looks on your device</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-base font-medium mb-3 block">Theme</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Select your preferred theme or use system settings
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => handleThemeChange('light')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                        theme === 'light' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Sun className="h-6 w-6" />
                      <span className="text-sm font-medium">Light</span>
                      {theme === 'light' && <Check className="h-4 w-4 text-primary" />}
                    </button>
                    <button
                      onClick={() => handleThemeChange('dark')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                        theme === 'dark' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Moon className="h-6 w-6" />
                      <span className="text-sm font-medium">Dark</span>
                      {theme === 'dark' && <Check className="h-4 w-4 text-primary" />}
                    </button>
                    <button
                      onClick={() => handleThemeChange('system')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                        theme === 'system' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Laptop className="h-6 w-6" />
                      <span className="text-sm font-medium">System</span>
                      {theme === 'system' && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  </div>
                  {theme === 'system' && (
                    <p className="text-xs text-muted-foreground mt-3">
                      Currently using: {resolvedTheme === 'dark' ? 'Dark' : 'Light'} (from system)
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between pt-4 border-t">
                  <span className="text-sm text-muted-foreground">
                    {savingSettings ? 'Saving...' : 'Changes saved automatically'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Manage how you receive updates and alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications" className="text-base">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email updates about your applications
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={settings?.notifications.email ?? true}
                    onCheckedChange={(checked) => 
                      handleSettingsChange({ 
                        notifications: { ...settings!.notifications, email: checked } 
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="push-notifications" className="text-base">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Get browser notifications for important updates
                    </p>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={settings?.notifications.push ?? false}
                    onCheckedChange={(checked) => 
                      handleSettingsChange({ 
                        notifications: { ...settings!.notifications, push: checked } 
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="app-updates" className="text-base">Application Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify me when there are new features or updates
                    </p>
                  </div>
                  <Switch
                    id="app-updates"
                    checked={settings?.notifications.applicationUpdates ?? true}
                    onCheckedChange={(checked) => 
                      handleSettingsChange({ 
                        notifications: { ...settings!.notifications, applicationUpdates: checked } 
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between pt-4 border-t">
                  <span className="text-sm text-muted-foreground">
                    {savingSettings ? 'Saving...' : 'Changes saved automatically'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle>Privacy & Data</CardTitle>
                <CardDescription>Control how your data is used and shared</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="analytics" className="text-base">Analytics</Label>
                    <p className="text-sm text-muted-foreground">
                      Help us improve by sharing anonymous usage data
                    </p>
                  </div>
                  <Switch
                    id="analytics"
                    checked={settings?.privacy.analytics ?? true}
                    onCheckedChange={(checked) => 
                      handleSettingsChange({ 
                        privacy: { ...settings!.privacy, analytics: checked } 
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="error-reporting" className="text-base">Error Reporting</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically send error reports to help us fix issues
                    </p>
                  </div>
                  <Switch
                    id="error-reporting"
                    checked={settings?.privacy.errorReporting ?? true}
                    onCheckedChange={(checked) => 
                      handleSettingsChange({ 
                        privacy: { ...settings!.privacy, errorReporting: checked } 
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between pt-4 border-t">
                  <span className="text-sm text-muted-foreground">
                    {savingSettings ? 'Saving...' : 'Changes saved automatically'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations">
            <Card>
              <CardHeader>
                <CardTitle>Integrations</CardTitle>
                <CardDescription>Connect external services to enhance your experience</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-medium mb-2">Google Drive</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Connect Google Drive to store and access your resumes directly from your cloud storage.
                    </p>
                    {driveConnected ? (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-green-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="font-medium">Connected</span>
                        </div>
                        <Button
                          onClick={connectGoogleDrive}
                          disabled={connectingDrive}
                          variant="secondary"
                          size="sm"
                        >
                          Reconnect
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={connectGoogleDrive}
                        disabled={connectingDrive}
                      >
                        {connectingDrive ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          'Connect Google Drive'
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="danger">
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible actions that affect your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-base font-medium mb-2">Reset Settings</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Restore all settings to their default values
                  </p>
                  <Button
                    onClick={() => setShowResetDialog(true)}
                    variant="outline"
                    disabled={savingSettings}
                  >
                    Reset to Defaults
                  </Button>
                </div>
                <div className="pt-4 border-t">
                  <h3 className="text-base font-medium text-destructive mb-2">Delete Account</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Permanently remove your account and all associated data. This action cannot be undone.
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="Type DELETE to confirm"
                      className="rounded-md border bg-background text-foreground px-3 py-2 w-64"
                    />
                    <Button
                      onClick={handleDeleteAccount}
                      disabled={deleting || confirmText !== 'DELETE'}
                      variant="destructive"
                    >
                      {deleting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        'Delete My Account'
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      {/* Reset Confirmation Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Settings to Defaults?</DialogTitle>
            <DialogDescription>
              This will restore all your settings to their default values. Your profile information and integrations will not be affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResetDialog(false)}
              disabled={savingSettings}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResetToDefaults}
              disabled={savingSettings}
            >
              {savingSettings ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                'Reset Settings'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
