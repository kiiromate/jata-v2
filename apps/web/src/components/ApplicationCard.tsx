import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  defaultNextAction,
  getApplicationFollowUpDate,
  isTerminalPipelineStatus,
  normalizePipelineStatus,
  type Database,
  type Json,
} from '@jata/common';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button.tsx';
import { Input } from './ui/input.tsx';
import { StatusBadge } from './StatusBadge.tsx';

type Application = Database['public']['Tables']['applications']['Row'];

interface ApplicationCardProps {
  application: Application;
}

function readObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function readActionLog(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value.filter((item) => item && typeof item === 'object') as Array<Record<string, unknown>> : [];
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({ application }) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  const normalizedStatus = normalizePipelineStatus(application.status, application.capture_status);
  const followUpDateFromData = getApplicationFollowUpDate(application);
  const [followUpDate, setFollowUpDate] = useState(followUpDateFromData ?? '');
  const nextAction = followUpDateFromData
    ? followUpDateFromData <= new Date().toISOString().slice(0, 10)
      ? 'Follow up now'
      : 'Follow up'
    : defaultNextAction(application.status, application.capture_status);
  const appliedDate = new Date(application.date_applied);
  const formattedAppliedDate = Number.isNaN(appliedDate.getTime())
    ? application.date_applied
    : appliedDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
  const today = new Date().toISOString().slice(0, 10);
  const isOverdue = Boolean(followUpDateFromData && followUpDateFromData < today);
  const isDueToday = followUpDateFromData === today;
  const isTerminal = isTerminalPipelineStatus(application.status, application.capture_status);

  const updateMutation = useMutation({
    mutationFn: async (updates: Database['public']['Tables']['applications']['Update']) => {
      const { error } = await supabase
        .from('applications')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', application.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['recentActivity'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Pipeline update failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const appendActionLog = (type: string, metadata?: Record<string, unknown>) => {
    const event = {
      type,
      at: new Date().toISOString(),
      actorId: user?.id ?? null,
      ...(metadata ? { metadata } : {}),
    };
    return [...readActionLog(application.capture_action_log), event] as Json;
  };

  const markApplied = () => {
    const parsedPayload = {
      ...readObject(application.capture_parsed_payload),
      appliedAt: new Date().toISOString(),
    };

    updateMutation.mutate({
      status: 'Applied',
      date_applied: today,
      capture_parsed_payload: parsedPayload as Json,
      capture_action_log: appendActionLog('marked_applied'),
    });
  };

  const saveFollowUp = () => {
    if (!followUpDate) {
      toast({
        title: 'Choose a follow-up date',
        description: 'Follow-up tracking needs a calendar date.',
        variant: 'destructive',
      });
      return;
    }

    const parsedPayload = {
      ...readObject(application.capture_parsed_payload),
      followUpDate,
    };

    updateMutation.mutate({
      capture_parsed_payload: parsedPayload as Json,
      capture_action_log: appendActionLog('follow_up_set', { followUpDate }),
    });
  };

  return (
    <div className="group bg-jata-iron-charcoal border border-jata-graphite-mist rounded-lg p-4 flex flex-col justify-between h-full transition-colors hover:border-jata-graphite-mist/80 hover:bg-jata-bg-elevated">
      <div>
        <div className="flex justify-between items-start gap-2 mb-1.5">
          <h3 className="font-medium text-sm text-jata-text-primary line-clamp-2 group-hover:text-white transition-colors">
            {application.title}
          </h3>
          <StatusBadge status={application.status} captureStatus={application.capture_status} />
        </div>
        <p className="text-xs text-jata-text-muted">{application.company}</p>
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-jata-text-muted">
              Next
            </span>
            <span className="text-xs text-jata-text-primary text-right">{nextAction}</span>
          </div>
          {followUpDateFromData && (
            <div
              className={[
                'rounded-sm border px-2 py-1 font-mono text-[10px] uppercase tracking-widest',
                isOverdue
                  ? 'border-jata-status-rejected/30 bg-jata-status-rejected/10 text-jata-status-rejected'
                  : isDueToday
                    ? 'border-jata-status-interview/30 bg-jata-status-interview/10 text-jata-status-interview'
                    : 'border-jata-graphite-mist text-jata-text-muted',
              ].join(' ')}
            >
              {isOverdue ? 'Overdue' : isDueToday ? 'Due today' : 'Follow-up'}: {followUpDateFromData}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-jata-graphite-mist space-y-3">
        {!isTerminal && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {normalizedStatus !== 'applied' && (
              <Button
                type="button"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={markApplied}
                disabled={updateMutation.isPending}
              >
                Mark Applied
              </Button>
            )}
            <Input
              type="date"
              value={followUpDate}
              onChange={(event) => setFollowUpDate(event.target.value)}
              aria-label={`Follow-up date for ${application.title} at ${application.company}`}
              className="h-8 text-xs"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 px-2 text-xs"
              onClick={saveFollowUp}
              disabled={updateMutation.isPending}
            >
              Set
            </Button>
          </div>
        )}
        <div className="flex justify-between items-center gap-2">
          <time
            className="font-mono text-[10px] text-jata-text-muted"
            dateTime={application.date_applied}
          >
            {formattedAppliedDate}
          </time>
          <Link
            to={`/resume-tailor/${application.id}`}
            className="font-mono text-[10px] uppercase tracking-widest text-jata-text-muted hover:text-jata-accent-lime transition-colors focus:outline-none focus:ring-1 focus:ring-jata-accent-lime/40 rounded px-1"
            aria-label={`Tailor resume for ${application.title} at ${application.company}`}
          >
            Tailor →
          </Link>
        </div>
      </div>
    </div>
  );
};
