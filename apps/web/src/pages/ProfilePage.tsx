import React, { useState, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Database } from '@jata/common';

type Resume = Database['public']['Tables']['resumes']['Row'];

const ProfilePage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [resumeName, setResumeName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: resumes, isLoading: resumesLoading } = useQuery<Resume[], Error>({
    queryKey: ['resumes', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!user,
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setResumeName(e.target.value)}
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

      <Card>
        <CardHeader>
          <CardTitle>Your Resumes</CardTitle>
        </CardHeader>
        <CardContent>
          {resumesLoading ? (
            <p>Loading resumes...</p>
          ) : resumes && resumes.length > 0 ? (
            <ul className="space-y-2">
              {resumes.map((resume) => (
                <li key={resume.id} className="p-2 border rounded-md">
                  {resume.resume_name}
                </li>
              ))}
            </ul>
          ) : (
            <p>You haven't uploaded any resumes yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
