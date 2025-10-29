import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { ProfileFormSkeleton } from './ProfileFormSkeleton';

interface UserProfile {
  id: string;
  name: string;
  professional_summary: string;
  // Add other user fields as needed
}

export function ProfileForm() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { session } = useAuth(); // Get session to access user ID

  const [name, setName] = useState('');
  const [professionalSummary, setProfessionalSummary] = useState('');

  // Fetch current user data
  const { data: userData, isLoading, isError, error } = useQuery<UserProfile, Error>({
    queryKey: ['currentUserProfile', session?.user?.id], // Include user ID in query key
    queryFn: async () => {
      if (!session?.user?.id) {
        throw new Error('User not authenticated.');
      }
      const { data, error } = await supabase
        .from('users') // Assuming your user profiles are in a 'users' table
        .select('id, name, professional_summary')
        .eq('id', session.user.id)
        .single();

      if (error) {
        throw error;
      }
      return data as UserProfile;
    },
    enabled: !!session?.user?.id, // Only run query if user is authenticated
  });

  // Update form fields when user data is loaded
  useEffect(() => {
    if (userData) {
      setName(userData.name || '');
      setProfessionalSummary(userData.professional_summary || '');
    }
  }, [userData]);

  // Mutation for updating user data
  const updateProfileMutation = useMutation<UserProfile, Error, Partial<UserProfile>>({
    mutationFn: async (updates) => {
      if (!session?.user?.id) {
        throw new Error('User not authenticated.');
      }
      const { data, error } = await supabase
        .from('users') // Assuming your user profiles are in a 'users' table
        .update(updates)
        .eq('id', session.user.id)
        .select() // Select the updated row to return
        .single();

      if (error) {
        throw error;
      }
      return data as UserProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast({
        title: 'Profile Updated',
        description: 'Your profile information has been successfully saved.',
      });
    },
    onError: (err) => {
      toast({
        title: 'Update Failed',
        description: `There was an error updating your profile: ${err.message}`,
        variant: 'destructive',
      });
    },
  });

  

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({ name, professional_summary: professionalSummary });
  };

  if (isLoading) {
    return <ProfileFormSkeleton />;
  }

  if (isError) {
    return (
      <div className="space-y-4 p-4 border rounded-lg shadow-sm border-red-200 bg-red-50">
        <p className="text-red-600 font-medium">Error loading profile</p>
        <p className="text-red-500 text-sm">{error?.message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-4">Edit Profile</h2>

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your Name"
          disabled={updateProfileMutation.isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="professional_summary">Professional Summary</Label>
        <Textarea
          id="professional_summary"
          value={professionalSummary}
          onChange={(e) => setProfessionalSummary(e.target.value)}
          placeholder="Tell us about your professional background..."
          rows={5}
          disabled={updateProfileMutation.isPending}
        />
      </div>

      <Button type="submit" disabled={updateProfileMutation.isPending}>
        {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  );
}
