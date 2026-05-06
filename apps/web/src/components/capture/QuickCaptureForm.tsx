import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import {
  createCapture,
  promoteToShortlist,
  generatePackLater,
  type CreateCaptureInput,
} from '@/services/captureInboxService';
import type { CaptureInboxItem } from '@jata/common';

interface QuickCaptureFormProps {
  userId: string;
  onSuccess?: () => void;
}

type ActiveAction = 'save' | 'shortlist' | 'pack_later' | null;

const EMPTY_FIELDS = {
  roleTitle: '',
  company: '',
  sourceUrl: '',
  jobDescription: '',
  location: '',
  deadline: '',
  notes: '',
};

export const QuickCaptureForm: React.FC<QuickCaptureFormProps> = ({ userId, onSuccess }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(true);
  const [fields, setFields] = useState(EMPTY_FIELDS);
  const [activeAction, setActiveAction] = useState<ActiveAction>(null);

  const set = (key: keyof typeof EMPTY_FIELDS) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setFields((f) => ({ ...f, [key]: e.target.value }));

  const resetForm = () => {
    setFields(EMPTY_FIELDS);
    setActiveAction(null);
  };

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['capture-inbox', userId] });

  const buildInput = (): CreateCaptureInput => ({
    userId,
    title: fields.roleTitle.trim() || undefined,
    company: fields.company.trim() || undefined,
    url: fields.sourceUrl.trim() || undefined,
    rawText: fields.jobDescription.trim() || undefined,
    metadata: {
      location: fields.location.trim() || undefined,
      deadline: fields.deadline.trim() || undefined,
      notes: fields.notes.trim() || undefined,
    },
  });

  const validate = (): boolean => {
    if (!fields.roleTitle.trim() && !fields.jobDescription.trim()) {
      toast({
        title: 'Nothing to capture',
        description: 'Provide at least a role title or job description.',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const promoteMutation = useMutation({
    mutationFn: (captureId: string) => promoteToShortlist(supabase, captureId),
  });

  const packMutation = useMutation({
    mutationFn: (captureId: string) => generatePackLater(supabase, captureId),
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateCaptureInput) => createCapture(supabase, input),
    onError: (error: Error) => {
      toast({ title: 'Capture failed', description: error.message, variant: 'destructive' });
      setActiveAction(null);
    },
  });

  const isPending =
    createMutation.isPending || promoteMutation.isPending || packMutation.isPending;

  const handleSave = () => {
    if (!validate()) return;
    setActiveAction('save');
    createMutation.mutate(buildInput(), {
      onSuccess: () => {
        invalidate();
        toast({ title: 'Captured', description: 'Added to your inbox.' });
        resetForm();
        onSuccess?.();
      },
    });
  };

  const handleShortlist = () => {
    if (!validate()) return;
    setActiveAction('shortlist');
    createMutation.mutate(buildInput(), {
      onSuccess: (item: CaptureInboxItem) => {
        promoteMutation.mutate(item.id, {
          onSuccess: () => {
            invalidate();
            toast({
              title: 'Shortlisted',
              description: `${item.title ?? 'Capture'} added to shortlist.`,
            });
            resetForm();
            onSuccess?.();
          },
          onError: (err: Error) => {
            invalidate();
            toast({
              title: 'Saved to inbox — shortlist failed',
              description: err.message,
              variant: 'destructive',
            });
            setActiveAction(null);
          },
        });
      },
    });
  };

  const handlePackLater = () => {
    if (!validate()) return;
    setActiveAction('pack_later');
    createMutation.mutate(buildInput(), {
      onSuccess: (item: CaptureInboxItem) => {
        packMutation.mutate(item.id, {
          onSuccess: () => {
            invalidate();
            toast({
              title: 'Pack queued',
              description: `${item.title ?? 'Capture'} will have a pack generated later.`,
            });
            resetForm();
            onSuccess?.();
          },
          onError: (err: Error) => {
            invalidate();
            toast({
              title: 'Saved to inbox — pack request failed',
              description: err.message,
              variant: 'destructive',
            });
            setActiveAction(null);
          },
        });
      },
    });
  };

  return (
    <div className="border border-jata-border rounded-lg bg-jata-bg-surface">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-jata-graphite-mist/30 transition-colors rounded-t-lg"
      >
        <span className="font-mono text-[10px] uppercase tracking-widest text-jata-text-secondary">
          Quick Capture
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform text-jata-text-muted',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-4 border-t border-jata-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="roleTitle"
                className="font-mono text-[10px] uppercase tracking-widest text-jata-text-secondary"
              >
                Role Title
              </Label>
              <Input
                id="roleTitle"
                value={fields.roleTitle}
                onChange={set('roleTitle')}
                placeholder="e.g. Senior Product Designer"
                className="bg-jata-deep-carbon border-jata-border text-jata-text-primary placeholder:text-jata-text-muted"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="company"
                className="font-mono text-[10px] uppercase tracking-widest text-jata-text-secondary"
              >
                Company
              </Label>
              <Input
                id="company"
                value={fields.company}
                onChange={set('company')}
                placeholder="e.g. Acme Corp"
                className="bg-jata-deep-carbon border-jata-border text-jata-text-primary placeholder:text-jata-text-muted"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="sourceUrl"
              className="font-mono text-[10px] uppercase tracking-widest text-jata-text-secondary"
            >
              Source URL
            </Label>
            <Input
              id="sourceUrl"
              type="url"
              value={fields.sourceUrl}
              onChange={set('sourceUrl')}
              placeholder="https://..."
              className="bg-jata-deep-carbon border-jata-border text-jata-text-primary placeholder:text-jata-text-muted"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="jobDescription"
              className="font-mono text-[10px] uppercase tracking-widest text-jata-text-secondary"
            >
              Job Description
            </Label>
            <Textarea
              id="jobDescription"
              value={fields.jobDescription}
              onChange={set('jobDescription')}
              rows={6}
              placeholder="Paste the full job description here..."
              className="bg-jata-deep-carbon border-jata-border text-jata-text-primary placeholder:text-jata-text-muted resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="location"
                className="font-mono text-[10px] uppercase tracking-widest text-jata-text-secondary"
              >
                Location
              </Label>
              <Input
                id="location"
                value={fields.location}
                onChange={set('location')}
                placeholder="e.g. Remote / London"
                className="bg-jata-deep-carbon border-jata-border text-jata-text-primary placeholder:text-jata-text-muted"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="deadline"
                className="font-mono text-[10px] uppercase tracking-widest text-jata-text-secondary"
              >
                Deadline
              </Label>
              <Input
                id="deadline"
                type="date"
                value={fields.deadline}
                onChange={set('deadline')}
                className="bg-jata-deep-carbon border-jata-border text-jata-text-primary"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="notes"
              className="font-mono text-[10px] uppercase tracking-widest text-jata-text-secondary"
            >
              Notes
            </Label>
            <Input
              id="notes"
              value={fields.notes}
              onChange={set('notes')}
              placeholder="Any quick notes..."
              className="bg-jata-deep-carbon border-jata-border text-jata-text-primary placeholder:text-jata-text-muted"
            />
          </div>

          <div className="flex items-start gap-2 px-3 py-2 rounded border border-jata-status-interview/20 bg-jata-status-interview/5">
            <AlertTriangle className="h-3.5 w-3.5 text-jata-status-interview mt-0.5 shrink-0" />
            <p className="font-mono text-[10px] text-jata-text-muted">
              AI scoring pipeline not yet connected. Use Save or Shortlist to capture now —
              score manually once the pipeline is wired.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isPending}
              className="bg-jata-accent-lime text-jata-deep-carbon hover:bg-jata-accent-lime/90 font-mono text-[11px] uppercase tracking-widest"
            >
              {activeAction === 'save' && isPending ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : null}
              Save
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleShortlist}
              disabled={isPending}
              className="border-jata-border text-jata-text-primary hover:bg-jata-graphite-mist font-mono text-[11px] uppercase tracking-widest"
            >
              {activeAction === 'shortlist' && isPending ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : null}
              Save to Shortlist
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handlePackLater}
              disabled={isPending}
              className="border-jata-border text-jata-text-primary hover:bg-jata-graphite-mist font-mono text-[11px] uppercase tracking-widest"
            >
              {activeAction === 'pack_later' && isPending ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : null}
              Generate Pack Later
            </Button>

            <Button
              size="sm"
              variant="ghost"
              disabled
              title="AI scoring not yet connected"
              className="opacity-40 cursor-not-allowed font-mono text-[11px] uppercase tracking-widest"
            >
              Save and Score
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
