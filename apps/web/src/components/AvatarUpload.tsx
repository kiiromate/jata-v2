import React, { useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { Button } from './ui/button';
import { Input } from './ui/input';
// import Avatar from '../Avatar'; // Custom Avatar component
import { useToast } from '../hooks/use-toast'; // Corrected path for useToast

export const AvatarUpload = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Query to fetch current user data
  // Assuming there's a query key for fetching the current user
  // You might need to adjust 'currentUser' based on your actual implementation
  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user;
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error('User not logged in.');

      const fileExtension = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExtension}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (!publicUrlData || !publicUrlData.publicUrl) {
        throw new Error('Could not get public URL for the uploaded avatar.');
      }

      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrlData.publicUrl },
      });

      if (updateError) throw updateError;

      return publicUrlData.publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] }); // Invalidate to refetch user data
      toast({
        title: 'Success!',
        description: 'Your avatar has been updated.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update avatar: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      uploadAvatarMutation.mutate(event.target.files[0]);
    }
  };

  if (isUserLoading) {
    return <div>Loading avatar...</div>;
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* <Avatar avatarUrl={user?.user_metadata?.avatar_url} name={user?.user_metadata?.full_name} className="w-24 h-24" /> */}
      <Input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploadAvatarMutation.isPending}
      >
        {uploadAvatarMutation.isPending ? 'Uploading...' : 'Change Photo'}
      </Button>
    </div>
  );
};
