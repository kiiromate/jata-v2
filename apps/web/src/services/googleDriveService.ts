import { supabase } from '../lib/supabaseClient';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  modifiedTime: string;
  size?: string;
}

export class GoogleDriveService {
  private accessToken: string | null = null;

  constructor(accessToken?: string) {
    this.accessToken = accessToken || null;
  }

  /**
   * Initialize the service with the user's Google access token
   */
  async initialize(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.provider_token) {
        return false;
      }
      this.accessToken = session.provider_token;
      return true;
    } catch (error) {
      console.error('Failed to initialize Google Drive service:', error);
      return false;
    }
  }

  /**
   * Create or find the "JATA Resume Bank" folder in the user's Google Drive
   */
  async createOrFindResumeFolder(): Promise<string | null> {
    if (!this.accessToken) {
      throw new Error('Google Drive not initialized');
    }

    try {
      // First, search for existing folder
      const searchResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='JATA Resume Bank' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      const searchData = await searchResponse.json();
      
      if (searchData.files && searchData.files.length > 0) {
        // Folder exists, return its ID
        return searchData.files[0].id;
      }

      // Create new folder
      const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'JATA Resume Bank',
          mimeType: 'application/vnd.google-apps.folder',
          parents: ['root'],
        }),
      });

      const createData = await createResponse.json();
      return createData.id || null;
    } catch (error) {
      console.error('Error creating/finding resume folder:', error);
      return null;
    }
  }

  /**
   * List files in the resume folder
   */
  async listResumeFiles(folderId: string): Promise<DriveFile[]> {
    if (!this.accessToken) {
      throw new Error('Google Drive not initialized');
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and trashed=false&fields=files(id,name,mimeType,createdTime,modifiedTime,size)`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      const data = await response.json();
      return data.files || [];
    } catch (error) {
      console.error('Error listing resume files:', error);
      return [];
    }
  }

  /**
   * Upload a file to the resume folder
   */
  async uploadResume(file: File, folderId: string): Promise<string | null> {
    if (!this.accessToken) {
      throw new Error('Google Drive not initialized');
    }

    try {
      // Create file metadata
      const metadata = {
        name: file.name,
        parents: [folderId],
      };

      // Create form data for multipart upload
      const formData = new FormData();
      formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      formData.append('file', file);

      const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
          body: formData,
        }
      );

      const data = await response.json();
      return data.id || null;
    } catch (error) {
      console.error('Error uploading resume:', error);
      return null;
    }
  }

  /**
   * Download a file from Google Drive
   */
  async downloadFile(fileId: string): Promise<Blob | null> {
    if (!this.accessToken) {
      throw new Error('Google Drive not initialized');
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (response.ok) {
        return await response.blob();
      }
      return null;
    } catch (error) {
      console.error('Error downloading file:', error);
      return null;
    }
  }

  /**
   * Delete a file from Google Drive
   */
  async deleteFile(fileId: string): Promise<boolean> {
    if (!this.accessToken) {
      throw new Error('Google Drive not initialized');
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  /**
   * Store the folder ID in the user's profile
   */
  async storeFolderIdInProfile(folderId: string): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return false;

      const { error } = await supabase
        .from('users')
        .update({ drive_folder_id: folderId })
        .eq('id', session.user.id);

      return !error;
    } catch (error) {
      console.error('Error storing folder ID:', error);
      return false;
    }
  }
}
