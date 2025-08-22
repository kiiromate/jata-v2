import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { GoogleDriveService } from '../services/googleDriveService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ProfileForm } from '../components/ProfileForm';
import { AvatarUpload } from '../components/AvatarUpload';

const Settings = () => {
  const { session } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [driveConnected, setDriveConnected] = useState(false);
  const [connectingDrive, setConnectingDrive] = useState(false);

  // Removed useEffect for fetching profile data

  // Removed handleSaveProfile function

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
        alert('Failed to connect to Google Drive. Please try again.');
      }
    } catch (error) {
      console.error('Drive connection error:', error);
      alert('Failed to connect to Google Drive. Please try again.');
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
      alert('Unable to delete account. Please try again later.');
    } finally {
      setDeleting(false);
    }
  };

  // Removed handleUpload function

  // Removed loadingProfile and profileError checks as ProfileForm handles its own loading/errors

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Account Settings</h1>
      <Tabs defaultValue="profile" className="flex flex-col md:flex-row gap-12">
        <TabsList className="flex flex-col md:w-1/4 lg:w-1/5 h-auto justify-start">
          <TabsTrigger value="profile" className="w-full text-left justify-start">Profile</TabsTrigger>
          <TabsTrigger value="integrations" className="w-full text-left justify-start">Integrations</TabsTrigger>
          <TabsTrigger value="danger" className="w-full text-left justify-start text-red-500 data-[state=active]:bg-red-500/10 data-[state=active]:text-red-500">Danger Zone</TabsTrigger>
        </TabsList>

        <div className="flex-1 space-y-8"> {/* This div replaces <main> */}
          <TabsContent value="profile">
            <section className="rounded-lg border p-6 space-y-6">
              <h2 className="text-xl font-semibold">Profile</h2>
              <div className="flex flex-col md:flex-row items-start gap-6 mb-6">
                <AvatarUpload />
                <ProfileForm />
              </div>
            </section>
          </TabsContent>

          <TabsContent value="integrations">
            <section className="rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Integrations</h2>
              <p className="text-muted-foreground mb-4">Connect Google Drive to store and access your resumes directly from your cloud storage.</p>
              {driveConnected ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium">Google Drive Connected</span>
                  </div>
                  <button 
                    onClick={connectGoogleDrive} 
                    disabled={connectingDrive}
                    className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md font-medium text-sm"
                  >
                    Reconnect
                  </button>
                </div>
              ) : (
                <button 
                  onClick={connectGoogleDrive} 
                  disabled={connectingDrive}
                  className="bg-soft-olive text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
                >
                  {connectingDrive ? 'Connecting...' : 'Connect Google Drive'}
                </button>
              )}
            </section>
          </TabsContent>

          <TabsContent value="danger">
            <section className="rounded-lg border p-6">
              <h2 className="text-xl font-semibold text-destructive mb-4">Danger Zone</h2>
              <p className="text-muted-foreground">Permanently remove your account and all associated data. This action cannot be undone.</p>
              <div className="mt-4 flex items-center gap-4">
                <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="Type DELETE to confirm" className="rounded-md border bg-background text-foreground px-3 py-2 w-1/2" />
                <button onClick={handleDeleteAccount} disabled={deleting || confirmText !== 'DELETE'} className="bg-destructive text-destructive-foreground px-4 py-2 rounded-md font-medium disabled:opacity-50">
                  {deleting ? 'Deleting...' : 'Delete My Account'}
                </button>
              </div>
            </section>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default Settings;