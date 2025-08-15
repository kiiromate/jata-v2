import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Database } from '../../../../packages/common/types/database';

type Resume = Database['public']['Tables']['resumes']['Row'];

const ProfilePage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [resumeName, setResumeName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchResumes = async (): Promise<Resume[]> => {
    if (!user) throw new Error('User not authenticated');
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  };

  const { data: resumes, isLoading, isError, error } = useQuery<Resume[], Error>({
    queryKey: ['resumes', user?.id],
    queryFn: fetchResumes,
    enabled: !!user && !authLoading,
  });

  const uploadResumeMutation = useMutation<Response, Error, FormData>({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('http://localhost:54321/functions/v1/upload-resume', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await supabase.auth.getSession().then(s => s.data.session?.access_token)}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload resume');
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      setResumeName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      alert('Resume uploaded successfully!');
    },
    onError: (err) => {
      alert(`Error uploading resume: ${err.message}`);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('You must be logged in to upload a resume.');
      return;
    }

    if (!resumeName.trim()) {
      alert('Please enter a resume name.');
      return;
    }

    if (!fileInputRef.current || !fileInputRef.current.files || fileInputRef.current.files.length === 0) {
      alert('Please select a file to upload.');
      return;
    }

    const file = fileInputRef.current.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('resumeName', resumeName);

    uploadResumeMutation.mutate(formData);
  };

  if (authLoading) {
    return <div>Loading authentication...</div>;
  }

  if (!user) {
    return <div>Please log in to view your resume vault.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">My Resume Vault</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Upload New Resume</CardTitle>
          <CardDescription>Upload your resume file (PDF or DOCX) and give it a name.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="resumeName">Resume Name</Label>
              <Input
                id="resumeName"
                type="text"
                value={resumeName}
                onChange={(e) => setResumeName(e.target.value)}
                placeholder="e.g., My Software Engineer Resume"
                required
              />
            </div>
            <div>
              <Label htmlFor="resumeFile">Resume File (PDF or DOCX)</Label>
              <Input
                id="resumeFile"
                type="file"
                accept=".pdf,.docx"
                ref={fileInputRef}
                required
              />
            </div>
            <Button type="submit" disabled={uploadResumeMutation.isPending}>
              {uploadResumeMutation.isPending ? 'Uploading...' : 'Upload Resume'}
            </Button>
            {uploadResumeMutation.isError && (
              <p className="text-red-500 text-sm mt-2">Error: {uploadResumeMutation.error?.message}</p>
            )}
            {uploadResumeMutation.isSuccess && (
              <p className="text-green-500 text-sm mt-2">Resume uploaded successfully!</p>
            )}
          </form>
        </CardContent>
      </Card>

      <h2 className="text-2xl font-bold mb-4">Your Stored Resumes</h2>
      {isLoading ? (
        <div>Loading resumes...</div>
      ) : isError ? (
        <div className="text-red-500">Error loading resumes: {error?.message}</div>
      ) : resumes && resumes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resumes.map((resume) => (
            <Card key={resume.id}>
              <CardHeader>
                <CardTitle>{resume.resume_name}</CardTitle>
                <CardDescription>
                  Uploaded on: {new Date(resume.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* You can add more details here if needed, e.g., a download link */}
                <p className="text-sm text-gray-500">ID: {resume.id}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p>No resumes found. Upload one to get started!</p>
      )}
    </div>
  );
};

export default ProfilePage;
