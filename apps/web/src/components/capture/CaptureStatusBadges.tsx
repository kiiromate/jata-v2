import React from 'react';
import { cn } from '@/lib/utils';
import type { CaptureStatus, ParseStatus, ScoreStatus, DuplicateStatus } from '@jata/common';

const BASE =
  'inline-flex items-center px-2 py-0.5 rounded-sm border font-mono text-[10px] uppercase tracking-widest whitespace-nowrap';

function badge(className: string, label: string) {
  return (
    <span className={cn(BASE, className)}>
      {label}
    </span>
  );
}

// ── Capture status ────────────────────────────────────────────────────────────

const CAPTURE_STATUS_MAP: Record<CaptureStatus, { label: string; className: string }> = {
  inbox:        { label: 'Inbox',        className: 'text-jata-status-active border-jata-status-active/20 bg-jata-status-active/10' },
  processing:   { label: 'Processing',   className: 'text-jata-status-interview border-jata-status-interview/20 bg-jata-status-interview/10' },
  ready:        { label: 'Ready',        className: 'text-jata-status-offer border-jata-status-offer/20 bg-jata-status-offer/10' },
  shortlisted:  { label: 'Shortlisted',  className: 'text-jata-accent-blue border-jata-accent-blue/20 bg-jata-accent-blue/10' },
  pack_pending: { label: 'Pack Pending', className: 'text-jata-status-interview border-jata-status-interview/20 bg-jata-status-interview/10' },
  archived:     { label: 'Archived',     className: 'text-jata-status-saved border-jata-status-saved/20 bg-jata-status-saved/10' },
};

export const CaptureCaptureStatusBadge: React.FC<{ status: CaptureStatus }> = ({ status }) => {
  const cfg = CAPTURE_STATUS_MAP[status] ?? { label: status, className: 'text-jata-status-saved border-jata-status-saved/20 bg-jata-status-saved/10' };
  return badge(cfg.className, cfg.label);
};

// ── Parse / score status (shared shape) ──────────────────────────────────────

const PIPELINE_STATUS_MAP: Record<ParseStatus | ScoreStatus, { label: string; className: string }> = {
  not_started:  { label: 'Not Started',  className: 'text-jata-status-saved border-jata-status-saved/20 bg-jata-status-saved/10' },
  not_required: { label: 'N/A',          className: 'text-jata-status-saved border-jata-status-saved/20 bg-jata-status-saved/10' },
  pending:      { label: 'Pending',      className: 'text-jata-status-interview border-jata-status-interview/20 bg-jata-status-interview/10' },
  completed:    { label: 'Done',         className: 'text-jata-status-offer border-jata-status-offer/20 bg-jata-status-offer/10' },
  failed:       { label: 'Failed',       className: 'text-jata-status-rejected border-jata-status-rejected/20 bg-jata-status-rejected/10' },
};

export const ParseStatusBadge: React.FC<{ status: ParseStatus }> = ({ status }) => {
  const cfg = PIPELINE_STATUS_MAP[status] ?? { label: status, className: 'text-jata-status-saved border-jata-status-saved/20 bg-jata-status-saved/10' };
  return badge(cfg.className, cfg.label);
};

export const ScoreStatusBadge: React.FC<{ status: ScoreStatus }> = ({ status }) => {
  const cfg = PIPELINE_STATUS_MAP[status] ?? { label: status, className: 'text-jata-status-saved border-jata-status-saved/20 bg-jata-status-saved/10' };
  return badge(cfg.className, cfg.label);
};

// ── Duplicate status ──────────────────────────────────────────────────────────

const DEDUPE_STATUS_MAP: Record<DuplicateStatus, { label: string; className: string }> = {
  unknown:            { label: 'Unknown',   className: 'text-jata-status-saved border-jata-status-saved/20 bg-jata-status-saved/10' },
  unique:             { label: 'Unique',    className: 'text-jata-status-offer border-jata-status-offer/20 bg-jata-status-offer/10' },
  possible_duplicate: { label: 'Maybe Dup', className: 'text-jata-status-interview border-jata-status-interview/20 bg-jata-status-interview/10' },
  duplicate:          { label: 'Duplicate', className: 'text-jata-status-rejected border-jata-status-rejected/20 bg-jata-status-rejected/10' },
};

export const DuplicateStatusBadge: React.FC<{ status: DuplicateStatus }> = ({ status }) => {
  const cfg = DEDUPE_STATUS_MAP[status] ?? { label: status, className: 'text-jata-status-saved border-jata-status-saved/20 bg-jata-status-saved/10' };
  return badge(cfg.className, cfg.label);
};

// ── Capture confidence ────────────────────────────────────────────────────────

type ConfidenceLabel = 'strong' | 'review_recommended' | 'weak';

const CONFIDENCE_MAP: Record<ConfidenceLabel, { label: string; className: string }> = {
  strong:             { label: 'Strong', className: 'text-jata-status-offer border-jata-status-offer/20 bg-jata-status-offer/10' },
  review_recommended: { label: 'Review', className: 'text-jata-status-interview border-jata-status-interview/20 bg-jata-status-interview/10' },
  weak:               { label: 'Weak',   className: 'text-jata-status-rejected border-jata-status-rejected/20 bg-jata-status-rejected/10' },
};

export const ConfidenceBadge: React.FC<{ label: string | null | undefined }> = ({ label }) => {
  const key = (label as ConfidenceLabel) ?? 'weak';
  const cfg = CONFIDENCE_MAP[key] ?? { label: key, className: 'text-jata-status-saved border-jata-status-saved/20 bg-jata-status-saved/10' };
  return badge(cfg.className, cfg.label);
};
