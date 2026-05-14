import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Inbox } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { listCaptures } from '@/services/captureInboxService';
import { QuickCaptureForm } from '@/components/capture/QuickCaptureForm';
import { BulkLinkCapture } from '@/components/capture/BulkLinkCapture';
import { CaptureQueueTable } from '@/components/capture/CaptureQueueTable';

const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-jata-border rounded-lg">
    <Inbox className="h-10 w-10 text-jata-text-muted mb-4" strokeWidth={1} />
    <p className="font-mono text-[10px] uppercase tracking-widest text-jata-text-muted mb-2">
      No captures yet
    </p>
    <p className="text-sm text-jata-text-secondary text-center max-w-sm">
      Paste a job description above or capture from the browser extension. PWA share and
      optional Telegram intake use this same inbox.
    </p>
  </div>
);

const CaptureInboxPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id ?? '';

  const {
    data: captures,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['capture-inbox', userId],
    queryFn: () => listCaptures(supabase, { includeArchived: false, limit: 50, offset: 0 }),
    enabled: !!userId,
    staleTime: 30_000,
  });

  const isEmpty = !isLoading && !isError && (!captures || captures.length === 0);

  return (
    <div className="min-w-0 flex flex-col">
      {/* Sticky page header */}
      <div className="sticky top-0 z-10 bg-jata-deep-carbon px-sm sm:px-md lg:px-lg pt-sm sm:pt-md lg:pt-lg pb-4 border-b border-jata-border">
        <h1 className="text-2xl font-headline font-semibold text-jata-text-primary">
          Capture Inbox
        </h1>
        <p className="font-mono text-[10px] uppercase tracking-widest text-jata-text-muted mt-1">
          Jobs captured for review and triage
        </p>
        <p className="mt-2 max-w-2xl text-sm text-jata-text-secondary">
          Captures from manual entry, the browser extension, and future share flows land here first
          as Saved opportunities. They also appear on the Dashboard, but stay in this queue until you
          shortlist, request a pack, or archive them.
        </p>
      </div>

      {/* Scrollable content */}
      <div className="px-sm sm:px-md lg:px-lg pb-sm sm:pb-md lg:pb-lg space-y-6 pt-6">
        <QuickCaptureForm userId={userId} />

        <BulkLinkCapture userId={userId} />

        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-jata-text-muted">
            Queue ({captures?.length ?? 0})
          </span>
        </div>

        {isEmpty ? (
          <EmptyState />
        ) : (
          <CaptureQueueTable
            items={captures ?? []}
            userId={userId}
            isLoading={isLoading}
            isError={isError}
          />
        )}
      </div>
    </div>
  );
};

export default CaptureInboxPage;
