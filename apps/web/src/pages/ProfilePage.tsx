import React, { useState, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSupabaseFunctionUrl, supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@jata/common';

type Resume = Database['public']['Tables']['resumes']['Row'];

const ProfilePage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
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
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(getSupabaseFunctionUrl('upload-resume'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
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
      toast({
        title: 'Success',
        description: 'Resume uploaded successfully.',
      });
    },
    onError: (err) => {
      toast({
        title: 'Upload failed',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'You must be logged in to upload a resume.',
        variant: 'destructive',
      });
      return;
    }

    if (!resumeName.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please enter a resume name.',
        variant: 'destructive',
      });
      return;
    }

    if (!fileInputRef.current || !fileInputRef.current.files || fileInputRef.current.files.length === 0) {
      toast({
        title: 'Missing file',
        description: 'Please select a file to upload.',
        variant: 'destructive',
      });
      return;
    }

    const file = fileInputRef.current.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('resumeName', resumeName);

    uploadResumeMutation.mutate(formData);
  };

  if (authLoading) {
    return (
      <div className="container mx-auto p-sm sm:p-md lg:p-lg">
        <Skeleton className="h-10 w-64 mb-md" />
        <div className="space-y-md">
          <Card>
            <CardHeader>
              <Skeleton className="h-7 w-48 mb-2" />
              <Skeleton className="h-5 w-96" />
            </CardHeader>
            <CardContent>
              <div className="space-y-sm">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-10 w-32" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-7 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-sm sm:p-md lg:p-lg">
        <p className="text-center text-gray-600">Please log in to view your resume vault.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-sm sm:p-md lg:p-lg">
      <h1 className="text-3xl font-bold mb-md">My Resume Vault</h1>

      <Card className="mb-md">
        <CardHeader>
          <CardTitle>Upload New Resume</CardTitle>
          <CardDescription>Upload your resume file (PDF or DOCX) and give it a name.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-sm">
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
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Resumes</CardTitle>
        </CardHeader>
        <CardContent>
          {resumesLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : resumes && resumes.length > 0 ? (
            <ul className="space-y-2">
              {resumes.map((resume) => (
                <li key={resume.id} className="p-2 border rounded-md">
                  {resume.filename}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">You haven't uploaded any resumes yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
