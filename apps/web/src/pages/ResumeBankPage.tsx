import React, { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Upload, Trash2, CheckCircle2, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { extractTextFromFile, uploadResume } from '@/services/fileUploadService';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

type Resume = {
  id: string;
  filename: string;
  content: string;
  extracted_text: string | null;
  created_at: string;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const ResumeBankPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { data: resumes, isLoading } = useQuery<Resume[]>({
    queryKey: ['resumes', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('resumes')
        .select('id, filename, content, extracted_text, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as Resume[];
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('resumes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['resumes', user?.id] });
      setConfirmDeleteId(null);
      toast({ title: 'Resume deleted' });
    },
    onError: () => {
      toast({
        title: 'Failed to delete',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    },
  });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setIsUploading(true);
    try {
      const result = await extractTextFromFile(file);
      if (!result.success) {
        toast({
          title: 'Upload failed',
          description: result.error ?? 'Could not process file.',
          variant: 'destructive',
        });
        return;
      }
      await uploadResume(file.name, result.text ?? '');
      void queryClient.invalidateQueries({ queryKey: ['resumes', user?.id] });
      toast({ title: 'Resume uploaded', description: file.name });
    } catch {
      toast({
        title: 'Upload failed',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  }

  const hasResumes = !isLoading && resumes && resumes.length > 0;

  return (
    <div className="p-sm sm:p-md lg:p-lg space-y-6 min-w-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-headline font-semibold text-jata-text-primary">
            My Resume Bank
          </h1>
          <p className="font-mono text-[10px] uppercase tracking-widest text-jata-text-muted mt-1">
            Uploaded resumes for pack generation
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            className="sr-only"
            onChange={handleFileChange}
            aria-label="Upload resume file"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            size="sm"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? 'Uploading…' : 'Upload New'}
          </Button>
        </div>
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="space-y-3">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="h-[76px] rounded-lg border border-jata-border bg-jata-bg-surface animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !hasResumes && (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-jata-border rounded-lg">
          <FileText className="h-10 w-10 text-jata-text-muted mb-4" strokeWidth={1} />
          <p className="font-mono text-[10px] uppercase tracking-widest text-jata-text-muted mb-2">
            No resumes yet
          </p>
          <p className="text-sm text-jata-text-secondary text-center max-w-sm">
            Upload your first resume to start generating application packs.
          </p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Resume
          </Button>
        </div>
      )}

      {/* Resume list */}
      {hasResumes && (
        <div className="space-y-3">
          {resumes!.map(resume => (
            <div
              key={resume.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-jata-border bg-jata-bg-surface px-4 py-3"
            >
              <div className="flex items-start gap-3 min-w-0">
                <FileText className="h-5 w-5 text-jata-text-muted shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-medium text-jata-text-primary text-sm truncate">
                    {resume.filename}
                  </p>
                  <p className="text-xs text-jata-text-muted mt-0.5">
                    Uploaded {formatDate(resume.created_at)}
                  </p>
                  <div className="mt-1">
                    {resume.extracted_text ? (
                      <span className="inline-flex items-center gap-1 text-jata-status-offer text-xs font-mono">
                        <CheckCircle2 className="h-3 w-3" />
                        Text extracted
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-jata-text-muted text-xs font-mono">
                        <Clock className="h-3 w-3" />
                        Extraction pending
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {confirmDeleteId === resume.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-jata-text-secondary font-mono">Delete?</span>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteMutation.mutate(resume.id)}
                      disabled={deleteMutation.isPending}
                    >
                      Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmDeleteId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-11 w-11 p-0 text-jata-text-muted hover:text-jata-status-rejected"
                    onClick={() => setConfirmDeleteId(resume.id)}
                    aria-label={`Delete ${resume.filename}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResumeBankPage;
