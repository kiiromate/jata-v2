import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import {
  archiveCapture,
  promoteToShortlist,
  generatePackLater,
} from '@/services/captureInboxService';
import type { CaptureInboxItem } from '@jata/common';
import {
  ConfidenceBadge,
  DuplicateStatusBadge,
  ParseStatusBadge,
  ScoreStatusBadge,
} from './CaptureStatusBadges';

interface CaptureQueueTableProps {
  items: CaptureInboxItem[];
  userId: string;
  isLoading: boolean;
  isError: boolean;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const Th: React.FC<{ children?: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <th
    className={cn(
      'px-3 py-2 text-left font-mono text-[10px] uppercase tracking-widest text-jata-text-muted',
      className
    )}
  >
    {children}
  </th>
);

interface CaptureRowProps {
  item: CaptureInboxItem;
  onArchive: () => void;
  onShortlist: () => void;
  onPackLater: () => void;
  onGeneratePack: () => void;
  isArchiving: boolean;
  isShortlisting: boolean;
  isPacking: boolean;
}

const CaptureRow: React.FC<CaptureRowProps> = ({
  item,
  onArchive,
  onShortlist,
  onPackLater,
  onGeneratePack,
  isArchiving,
  isShortlisting,
  isPacking,
}) => {
  const anyPending = isArchiving || isShortlisting || isPacking;
  const scoreValue = (item.scoreResult as { score?: number } | null)?.score;

  return (
    <tr className="border-b border-jata-border/50 hover:bg-jata-graphite-mist/10 transition-colors">
      <td className="px-3 py-3">
        <div className="font-medium text-jata-text-primary text-sm leading-tight">
          {item.title || <span className="text-jata-text-muted">—</span>}
        </div>
        <div className="font-mono text-[10px] text-jata-text-muted mt-0.5">
          {item.company || '—'}
        </div>
      </td>

      <td className="px-3 py-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-jata-text-muted">
          {item.source}
        </span>
      </td>

      <td className="px-3 py-3">
        <DuplicateStatusBadge status={item.duplicateStatus} />
      </td>

      <td className="px-3 py-3">
        <ParseStatusBadge status={item.parseStatus} />
      </td>

      <td className="px-3 py-3">
        <ConfidenceBadge label={item.parsedPayload?.metadata?.confidenceLabel as string | undefined} />
      </td>

      <td className="px-3 py-3">
        <ScoreStatusBadge status={item.scoreStatus} />
      </td>

      <td className="px-3 py-3">
        {scoreValue != null ? (
          <span className="font-mono text-[10px] text-jata-status-offer">{scoreValue}</span>
        ) : (
          <span className="font-mono text-[10px] text-jata-text-muted">—</span>
        )}
      </td>

      <td className="px-3 py-3">
        <span className="font-mono text-[10px] text-jata-text-muted">
          {formatDate(item.createdAt)}
        </span>
      </td>

      <td className="px-3 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-11 w-11 p-0 text-jata-text-muted hover:text-jata-text-primary"
              disabled={anyPending}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-jata-bg-surface border-jata-border text-jata-text-primary"
          >
            <DropdownMenuItem
              onClick={onGeneratePack}
              className="font-mono text-[11px] uppercase tracking-widest cursor-pointer hover:bg-jata-graphite-mist text-jata-accent-lime focus:text-jata-accent-lime"
            >
              Generate Pack
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onShortlist}
              disabled={isShortlisting}
              className="font-mono text-[11px] uppercase tracking-widest cursor-pointer hover:bg-jata-graphite-mist"
            >
              Shortlist
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onPackLater}
              disabled={isPacking}
              className="font-mono text-[11px] uppercase tracking-widest cursor-pointer hover:bg-jata-graphite-mist"
            >
              Pack Later
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onArchive}
              disabled={isArchiving}
              className="font-mono text-[11px] uppercase tracking-widest cursor-pointer hover:bg-jata-graphite-mist text-jata-status-rejected focus:text-jata-status-rejected"
            >
              Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
};

export const CaptureQueueTable: React.FC<CaptureQueueTableProps> = ({
  items,
  userId,
  isLoading,
  isError,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['capture-inbox', userId] });

  const archiveMutation = useMutation({
    mutationFn: (captureId: string) => archiveCapture(supabase, captureId),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Archived', description: 'Capture moved to archive.' });
    },
    onError: (err: Error) =>
      toast({ title: 'Archive failed', description: err.message, variant: 'destructive' }),
  });

  const shortlistMutation = useMutation({
    mutationFn: (captureId: string) => promoteToShortlist(supabase, captureId),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Shortlisted', description: 'Capture promoted to shortlist.' });
    },
    onError: (err: Error) =>
      toast({ title: 'Shortlist failed', description: err.message, variant: 'destructive' }),
  });

  const packMutation = useMutation({
    mutationFn: (captureId: string) => generatePackLater(supabase, captureId),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Pack queued', description: 'Application pack will be generated.' });
    },
    onError: (err: Error) =>
      toast({ title: 'Pack request failed', description: err.message, variant: 'destructive' }),
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded border border-jata-status-rejected/20 bg-jata-status-rejected/5 text-jata-status-rejected">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <p className="font-mono text-[10px] uppercase tracking-widest">
          Failed to load captures. Check your connection and retry.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto border border-jata-border rounded-lg">
      <table className="w-full text-sm">
        <thead className="border-b border-jata-border bg-jata-bg-surface">
          <tr>
            <Th>Role / Company</Th>
            <Th>Source</Th>
            <Th>Duplicate</Th>
            <Th>Parse</Th>
            <Th>Confidence</Th>
            <Th>Score</Th>
            <Th>Band</Th>
            <Th>Captured</Th>
            <Th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <CaptureRow
              key={item.id}
              item={item}
              onArchive={() => archiveMutation.mutate(item.id)}
              onShortlist={() => shortlistMutation.mutate(item.id)}
              onPackLater={() => packMutation.mutate(item.id)}
              onGeneratePack={() => navigate(`/resume-tailor/${item.id}`)}
              isArchiving={archiveMutation.isPending}
              isShortlisting={shortlistMutation.isPending}
              isPacking={packMutation.isPending}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
