import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, Link2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { createCapture } from '@/services/captureInboxService';

interface BulkResult {
  url: string;
  status: 'created' | 'duplicate' | 'possible_duplicate' | 'failed';
  message?: string;
}

interface BulkLinkCaptureProps {
  userId: string;
}

function parseBulkInput(raw: string): string[] {
  return raw
    .split(/\n|,/)
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//i.test(s));
}

export const BulkLinkCapture: React.FC<BulkLinkCaptureProps> = ({ userId }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [raw, setRaw] = useState('');
  const [results, setResults] = useState<BulkResult[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['capture-inbox', userId] });

  const captureMutation = useMutation({
    mutationFn: (url: string) =>
      createCapture(supabase, {
        userId,
        source: 'manual',
        method: 'url',
        url,
        metadata: { captureSurface: 'bulk_paste' },
      }),
  });

  const handleImport = async () => {
    const urls = parseBulkInput(raw);
    if (urls.length === 0) {
      toast({
        title: 'No valid URLs',
        description: 'Paste one URL per line starting with http:// or https://',
        variant: 'destructive',
      });
      return;
    }

    if (urls.length > 20) {
      toast({
        title: 'Too many URLs',
        description: 'Paste up to 20 links at a time.',
        variant: 'destructive',
      });
      return;
    }

    setIsImporting(true);
    setResults([]);

    const batch: BulkResult[] = [];

    for (const url of urls) {
      try {
        const item = await captureMutation.mutateAsync(url);
        const dup = item.duplicateStatus;
        batch.push({
          url,
          status: dup === 'duplicate' ? 'duplicate' : dup === 'possible_duplicate' ? 'possible_duplicate' : 'created',
        });
      } catch (err) {
        batch.push({
          url,
          status: 'failed',
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    setResults(batch);
    setIsImporting(false);
    invalidate();

    const created = batch.filter((r) => r.status === 'created').length;
    const dupes = batch.filter((r) => r.status === 'duplicate' || r.status === 'possible_duplicate').length;
    const failed = batch.filter((r) => r.status === 'failed').length;

    toast({
      title: `Imported ${created} of ${urls.length}`,
      description: [
        created > 0 && `${created} added`,
        dupes > 0 && `${dupes} duplicate`,
        failed > 0 && `${failed} failed`,
      ]
        .filter(Boolean)
        .join(' · '),
      variant: failed > 0 && created === 0 ? 'destructive' : 'default',
    });

    if (created > 0) setRaw('');
  };

  const statusColor = (s: BulkResult['status']) =>
    s === 'created'
      ? 'text-jata-status-offer'
      : s === 'duplicate'
      ? 'text-jata-status-rejected'
      : s === 'possible_duplicate'
      ? 'text-jata-status-interview'
      : 'text-jata-status-rejected';

  const statusLabel = (s: BulkResult['status']) =>
    s === 'created' ? '✓' : s === 'duplicate' ? 'dup' : s === 'possible_duplicate' ? '~dup' : '✗';

  return (
    <div className="border border-jata-border rounded-lg bg-jata-bg-surface">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-jata-graphite-mist/30 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-2">
          <Link2 className="h-3.5 w-3.5 text-jata-text-muted" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-jata-text-secondary">
            Bulk Link Capture
          </span>
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform text-jata-text-muted',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-3 border-t border-jata-border">
          <p className="pt-3 text-xs text-jata-text-muted">
            Paste up to 20 job/opportunity links — one per line. Each will be queued as a weak
            capture for review. No auto-apply.
          </p>

          <Textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={5}
            placeholder={'https://boards.greenhouse.io/company/jobs/123\nhttps://jobs.lever.co/...'}
            className="bg-jata-deep-carbon border-jata-border text-jata-text-primary placeholder:text-jata-text-muted font-mono text-xs resize-none"
            disabled={isImporting}
          />

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              onClick={handleImport}
              disabled={isImporting || !raw.trim()}
              className="bg-jata-accent-lime text-jata-deep-carbon hover:bg-jata-accent-lime/90 font-mono text-[11px] uppercase tracking-widest"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  Importing...
                </>
              ) : (
                'Import Links'
              )}
            </Button>
            {raw.trim() && (
              <span className="font-mono text-[10px] text-jata-text-muted">
                {parseBulkInput(raw).length} valid URL{parseBulkInput(raw).length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {results.length > 0 && (
            <div className="space-y-1 pt-1">
              {results.map((r) => (
                <div
                  key={r.url}
                  className="flex items-start gap-2 font-mono text-[10px]"
                >
                  <span className={cn('shrink-0 w-8', statusColor(r.status))}>
                    {statusLabel(r.status)}
                  </span>
                  <span className="text-jata-text-muted truncate" title={r.url}>
                    {r.url.replace(/^https?:\/\//, '')}
                  </span>
                  {r.message && (
                    <span className="text-jata-status-rejected shrink-0">{r.message}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
