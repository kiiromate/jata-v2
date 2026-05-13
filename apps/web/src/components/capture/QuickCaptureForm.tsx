import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, AlertTriangle, Loader2, ClipboardPaste } from 'lucide-react';
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
import type { CaptureInboxItem, CaptureMethod, CaptureSource } from '@jata/common';

type ActiveAction = 'save' | 'shortlist' | 'pack_later' | 'save_score' | null;

const EMPTY_FIELDS = {
  roleTitle: '',
  company: '',
  sourceUrl: '',
  sourceLabel: 'manual',
  industry: '',
  jobDescription: '',
  location: '',
  deadline: '',
  notes: '',
};

type QuickCaptureFields = typeof EMPTY_FIELDS;
export type QuickCaptureInitialValues = Partial<QuickCaptureFields>;

interface QuickCaptureFormProps {
  userId: string;
  source?: CaptureSource;
  method?: CaptureMethod;
  initialValues?: QuickCaptureInitialValues;
  onSuccess?: () => void;
}

const SOURCE_OPTIONS = [
  { value: 'manual', label: 'Manual Entry' },
  { value: 'browser_extension', label: 'Browser Extension' },
  { value: 'pwa_share', label: 'PWA Share' },
  { value: 'mobile_share', label: 'Mobile Share' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'indeed', label: 'Indeed' },
  { value: 'greenhouse', label: 'Greenhouse' },
  { value: 'lever', label: 'Lever' },
  { value: 'workday', label: 'Workday' },
  { value: 'company_website', label: 'Company Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'email', label: 'Email' },
  { value: 'other', label: 'Other' },
];

const INDUSTRY_OPTIONS = [
  'Technology',
  'Software / SaaS',
  'AI / Data',
  'Fintech',
  'Health / Life Sciences',
  'Climate / Sustainability',
  'Agriculture / Food',
  'Education',
  'Consulting',
  'Nonprofit / NGO',
  'Government / Public Sector',
  'Media / Communications',
  'E-commerce / Retail',
  'Manufacturing',
  'Logistics / Supply Chain',
];

function mergeInitialValues(initialValues?: QuickCaptureInitialValues): QuickCaptureFields {
  return {
    ...EMPTY_FIELDS,
    ...Object.fromEntries(
      Object.entries(initialValues ?? {}).map(([key, value]) => [key, value ?? '']),
    ),
  } as QuickCaptureFields;
}

export const QuickCaptureForm: React.FC<QuickCaptureFormProps> = ({
  userId,
  source = 'manual',
  method = 'manual',
  initialValues,
  onSuccess,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);
  const initialFields = useMemo(() => mergeInitialValues(initialValues), [initialValues]);
  const [fields, setFields] = useState(initialFields);
  const [activeAction, setActiveAction] = useState<ActiveAction>(null);
  const [lastCaptureId, setLastCaptureId] = useState<string | null>(null);

  useEffect(() => {
    setFields(initialFields);
    setIsOpen(true);
  }, [initialFields]);

  const set = (key: keyof typeof EMPTY_FIELDS) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setFields((f) => ({ ...f, [key]: e.target.value }));

  const resetForm = () => {
    setFields(EMPTY_FIELDS);
    setActiveAction(null);
  };

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['capture-inbox', userId] });

  const buildInput = (): CreateCaptureInput => ({
    userId,
    source,
    method,
    title: fields.roleTitle.trim() || undefined,
    company: fields.company.trim() || undefined,
    url: fields.sourceUrl.trim() || undefined,
    rawText: fields.jobDescription.trim() || undefined,
    industry: fields.industry.trim() || undefined,
    sourceLabel: fields.sourceLabel.trim() || undefined,
    metadata: {
      sourceLabel: fields.sourceLabel.trim() || undefined,
      location: fields.location.trim() || undefined,
      deadline: fields.deadline.trim() || undefined,
      notes: fields.notes.trim() || undefined,
    },
  });

  const validate = (): boolean => {
    if (!fields.roleTitle.trim() && !fields.jobDescription.trim() && !fields.sourceUrl.trim()) {
      toast({
        title: 'Nothing to capture',
        description: 'Provide at least a role title, source URL, or job description.',
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
    setLastCaptureId(null);
    setActiveAction('save');
    createMutation.mutate(buildInput(), {
      onSuccess: (item: CaptureInboxItem) => {
        invalidate();
        setLastCaptureId(item.id);
        toast({
          title: 'Captured',
          description: 'Added to Capture Inbox and visible on Dashboard as Saved.',
        });
        resetForm();
        onSuccess?.();
      },
    });
  };

  const handleSaveAndScore = () => {
    if (!validate()) return;
    setLastCaptureId(null);
    setActiveAction('save_score');
    createMutation.mutate(buildInput(), {
      onSuccess: (item: CaptureInboxItem) => {
        invalidate();
        onSuccess?.();
        navigate(`/resume-tailor/${item.id}`);
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

  const handlePasteFromClipboard = async () => {
    if (!navigator.clipboard?.readText) {
      toast({
        title: 'Paste unavailable',
        description: 'Paste the link or message into Quick Capture manually.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const value = (await navigator.clipboard.readText()).trim();
      if (!value) return;
      const looksLikeUrl = /^https?:\/\//i.test(value);
      setFields((current) => ({
        ...current,
        sourceUrl: looksLikeUrl ? value : current.sourceUrl,
        jobDescription: looksLikeUrl ? current.jobDescription : value,
      }));
    } catch {
      toast({
        title: 'Paste blocked',
        description: 'Your browser blocked clipboard access. Paste into the field manually.',
        variant: 'destructive',
      });
    }
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
        <div className="px-4 pb-4 space-y-4 border-t border-jata-border min-w-0">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="sourceLabel"
                className="font-mono text-[10px] uppercase tracking-widest text-jata-text-secondary"
              >
                Source
              </Label>
              <select
                id="sourceLabel"
                value={fields.sourceLabel}
                onChange={set('sourceLabel')}
                className="flex h-9 w-full rounded-md border border-jata-border bg-jata-deep-carbon px-3 py-1 text-sm text-jata-text-primary shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-jata-accent-lime"
              >
                {SOURCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="industry"
                className="font-mono text-[10px] uppercase tracking-widest text-jata-text-secondary"
              >
                Industry
              </Label>
              <Input
                id="industry"
                list="quick-capture-industry-options"
                value={fields.industry}
                onChange={set('industry')}
                placeholder="e.g. Technology"
                className="bg-jata-deep-carbon border-jata-border text-jata-text-primary placeholder:text-jata-text-muted"
              />
              <datalist id="quick-capture-industry-options">
                {INDUSTRY_OPTIONS.map((industry) => (
                  <option key={industry} value={industry} />
                ))}
              </datalist>
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
              AI analysis is available in Resume Tailor after saving.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              size="sm"
              type="button"
              variant="outline"
              onClick={handlePasteFromClipboard}
              disabled={isPending}
              className="border-jata-border text-jata-text-primary hover:bg-jata-graphite-mist font-mono text-[11px] uppercase tracking-widest"
            >
              <ClipboardPaste className="h-3.5 w-3.5 mr-1" />
              Paste
            </Button>

            <Button
              size="sm"
              onClick={handleSave}
              disabled={isPending}
              className="bg-jata-accent-lime text-jata-deep-carbon hover:bg-jata-accent-lime/90 font-mono text-[11px] uppercase tracking-widest"
            >
              {activeAction === 'save' && isPending ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : null}
              Save to Capture Inbox
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
              variant="outline"
              onClick={handleSaveAndScore}
              disabled={isPending}
              className="border-jata-accent-lime text-jata-accent-lime hover:bg-jata-accent-lime/10 font-mono text-[11px] uppercase tracking-widest"
            >
              {activeAction === 'save_score' && isPending ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : null}
              Save and Score
            </Button>
          </div>

          {lastCaptureId && (
            <div className="flex items-center gap-2 pt-1 font-mono text-[10px] text-jata-text-muted">
              <span>Captured.</span>
              <Link
                to={`/resume-tailor/${lastCaptureId}`}
                className="text-jata-accent-lime hover:underline"
              >
                Open in Resume Tailor →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
