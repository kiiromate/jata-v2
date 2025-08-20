import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { GoogleDriveService } from '../services/googleDriveService';
import Avatar from '../components/Avatar';

const Settings = () => {
  const { session } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [activeView, setActiveView] = useState('profile');
  const [driveConnected, setDriveConnected] = useState(false);
  const [connectingDrive, setConnectingDrive] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (session?.user) {
        const { data, error } = await supabase
          .from('users')
          .select('avatar_url, full_name, display_name, bio')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
        } else if (data) {
          setAvatarUrl(data.avatar_url);
          setDisplayName((data.full_name as string) || (data.display_name as string) || '');
          setBio((data.bio as string) || '');
        }
      }
    };

    fetchProfile();
  }, [session]);

  const handleSaveProfile = async () => {
    if (!session?.user) return;
    try {
      setSavingProfile(true);
      // Try multiple common column names for display name.
      const updates: Record<string, string> = { bio };
      if (displayName) {
        updates['display_name'] = displayName;
        updates['full_name'] = displayName;
      }
      const { error } = await supabase.from('users').update(updates).eq('id', session.user.id);
      if (error) throw error;
      
      // Show success message
      alert('Profile saved successfully!');
    } catch (e) {
      console.error('Save profile error:', e);
    } finally {
      setSavingProfile(false);
    }
  };

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

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${session!.user.id}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', session!.user.id);

      if (updateError) {
        throw updateError;
      }

      setAvatarUrl(publicUrl);
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Account Settings</h1>
      <div className="flex flex-col md:flex-row gap-12">
        <aside className="md:w-1/4 lg:w-1/5">
          <nav className="flex flex-col space-y-2">
            <button
              onClick={() => setActiveView('profile')}
              className={`text-left p-2 rounded-md transition-colors ${activeView === 'profile' ? 'bg-secondary text-secondary-foreground' : 'hover:bg-secondary/80'}`}>
              Profile
            </button>
            <button
              onClick={() => setActiveView('integrations')}
              className={`text-left p-2 rounded-md transition-colors ${activeView === 'integrations' ? 'bg-secondary text-secondary-foreground' : 'hover:bg-secondary/80'}`}>
              Integrations
            </button>
            <button
              onClick={() => setActiveView('danger')}
              className={`text-left p-2 rounded-md transition-colors ${activeView === 'danger' ? 'bg-red-500/10 text-red-500' : 'hover:bg-secondary/80'}`}>
              Danger Zone
            </button>
          </nav>
        </aside>

        <main className="flex-1 space-y-8">
          {activeView === 'profile' && (
            <section className="rounded-lg border p-6 space-y-6">
              <h2 className="text-xl font-semibold">Profile</h2>
              <div className="flex items-start gap-6">
                <div className="w-24 h-24 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <Avatar avatarUrl={null} userId={displayName || session?.user?.email || 'User'} />
                  )}
                </div>
                <div className="space-y-4 flex-1">
                  <div>
                    <label className="block text-sm font-medium mb-1">Display Name</label>
                    <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2" placeholder="Your name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Bio</label>
                    <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2" rows={3} placeholder="A short description about yourself" />
                  </div>
                  <div className="flex items-center gap-4 pt-2">
                    <label htmlFor="avatar-upload" className="cursor-pointer bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium">
                      {uploading ? 'Uploading...' : 'Upload New Avatar'}
                    </label>
                    <input id="avatar-upload" type="file" accept="image/*" onChange={handleUpload} disabled={uploading} className="hidden" />
                    <button onClick={handleSaveProfile} disabled={savingProfile} className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50">
                      {savingProfile ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeView === 'integrations' && (
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
          )}

          {activeView === 'danger' && (
            <section className="rounded-lg border border-destructive p-6">
              <h2 className="text-xl font-semibold text-destructive mb-4">Danger Zone</h2>
              <p className="text-muted-foreground">Permanently remove your account and all associated data. This action cannot be undone.</p>
              <div className="mt-4 flex items-center gap-4">
                <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="Type DELETE to confirm" className="rounded-md border bg-background px-3 py-2 w-1/2" />
                <button onClick={handleDeleteAccount} disabled={deleting || confirmText !== 'DELETE'} className="bg-destructive text-destructive-foreground px-4 py-2 rounded-md font-medium disabled:opacity-50">
                  {deleting ? 'Deleting...' : 'Delete My Account'}
                </button>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default Settings;
