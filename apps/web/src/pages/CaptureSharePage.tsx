import React, { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Share2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { QuickCaptureForm, type QuickCaptureInitialValues } from '@/components/capture/QuickCaptureForm';
import { parseSharedOpportunity } from '@jata/common';

const CaptureSharePage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const userId = user?.id ?? '';

  const initialValues = useMemo<QuickCaptureInitialValues>(() => {
    const parsed = parseSharedOpportunity({
      title: searchParams.get('title'),
      text: searchParams.get('text'),
      url: searchParams.get('url'),
    });

    return {
      roleTitle: parsed.roleTitle,
      sourceUrl: parsed.sourceUrl,
      sourceLabel: 'pwa_share',
      jobDescription: parsed.rawText,
      notes: 'Captured from PWA share target.',
    };
  }, [searchParams]);

  if (!user) {
    return (
      <div className="p-sm sm:p-md lg:p-lg space-y-6 max-w-4xl min-w-0">
        <div className="flex items-center gap-2 text-jata-accent-lime">
          <Share2 className="h-4 w-4 shrink-0" />
          <span className="font-mono text-[10px] uppercase tracking-widest">Mobile Share</span>
        </div>
        <div className="border border-jata-border rounded-lg bg-jata-bg-surface px-5 py-8 text-center space-y-3">
          <p className="text-sm text-jata-text-secondary">Sign in to save this opportunity to your Capture Inbox.</p>
          <Link
            to={`/signin?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`}
            className="inline-block font-mono text-[11px] uppercase tracking-widest px-4 py-2 rounded border border-jata-accent-lime text-jata-accent-lime hover:bg-jata-accent-lime/10 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-sm sm:p-md lg:p-lg space-y-6 max-w-4xl min-w-0">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-jata-accent-lime">
          <Share2 className="h-4 w-4 shrink-0" />
          <span className="font-mono text-[10px] uppercase tracking-widest">
            Mobile Share
          </span>
        </div>
        <h1 className="text-2xl font-headline font-semibold text-jata-text-primary mt-2">
          Capture Shared Opportunity
        </h1>
        <p className="text-sm text-jata-text-secondary mt-1 max-w-2xl">
          Review the shared link or text, then save it into the same Capture Inbox queue.
        </p>
      </div>

      <QuickCaptureForm
        userId={userId}
        source="pwa_share"
        method="share"
        initialValues={initialValues}
      />
    </div>
  );
};

export default CaptureSharePage;
