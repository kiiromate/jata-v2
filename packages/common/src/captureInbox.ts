import type { Json } from '../types/database.ts';
import type { EvidenceMatch, RecommendedAction, ScoreConfidence } from './scoring/index.ts';

export type { Json } from '../types/database.ts';

export const CaptureSources = [
  'web',
  'browser_extension',
  'pwa_share',
  'mobile_share',
  'telegram',
  'manual',
  'api',
] as const;

export type CaptureSource = (typeof CaptureSources)[number];

export const CaptureMethods = [
  'url',
  'text',
  'file',
  'manual',
  'share',
  'message',
] as const;

export type CaptureMethod = (typeof CaptureMethods)[number];

export const CaptureStatuses = [
  'inbox',
  'processing',
  'ready',
  'shortlisted',
  'pack_pending',
  'archived',
] as const;

export type CaptureStatus = (typeof CaptureStatuses)[number];

export const ParseStatuses = [
  'not_started',
  'pending',
  'completed',
  'failed',
  'not_required',
] as const;

export type ParseStatus = (typeof ParseStatuses)[number];

export const ScoreStatuses = [
  'not_started',
  'pending',
  'completed',
  'failed',
  'not_required',
] as const;

export type ScoreStatus = (typeof ScoreStatuses)[number];

export const DuplicateStatuses = [
  'unknown',
  'unique',
  'possible_duplicate',
  'duplicate',
] as const;

export type DuplicateStatus = (typeof DuplicateStatuses)[number];

export const ActionLogEventTypes = [
  'capture_created',
  'duplicate_detected',
  'parse_completed',
  'score_completed',
  'promoted_to_shortlist',
  'pack_requested',
  'archived',
] as const;

export type ActionLogEventType = (typeof ActionLogEventTypes)[number];

export type CaptureMetadata = Record<string, Json | undefined>;

export interface CaptureRawInput {
  url?: string | null;
  text?: string | null;
  title?: string | null;
  company?: string | null;
  metadata?: CaptureMetadata;
}

export interface CaptureParsedPayload {
  title?: string | null;
  company?: string | null;
  jobDescription?: string | null;
  industry?: string | null;
  url?: string | null;
  metadata?: CaptureMetadata;
}

export interface CaptureScoreResult {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  confidence?: ScoreConfidence;
  recommendedAction?: RecommendedAction;
  evidenceMatches?: EvidenceMatch[];
  claimsToVerify?: string[];
  suggestions?: string[];
  atsScore?: number;
  atsIssues?: string[];
  metadata?: CaptureMetadata;
}

export interface DedupeResult {
  status: DuplicateStatus;
  matchedApplicationId?: string | null;
  confidence: number;
  reasons: string[];
  checkedAt: string;
}

export interface ActionLogEvent {
  type: ActionLogEventType;
  at: string;
  actorId?: string;
  message?: string;
  metadata?: CaptureMetadata;
}

export interface CaptureInboxItem {
  id: string;
  applicationId: string;
  userId: string;
  title: string;
  company: string;
  url?: string | null;
  industry?: string | null;
  source: CaptureSource;
  method: CaptureMethod;
  status: CaptureStatus;
  parseStatus: ParseStatus;
  scoreStatus: ScoreStatus;
  duplicateStatus: DuplicateStatus;
  rawInput: CaptureRawInput;
  parsedPayload: CaptureParsedPayload;
  scoreResult?: CaptureScoreResult | null;
  dedupeResult?: DedupeResult | null;
  duplicateOfApplicationId?: string | null;
  actionLog: ActionLogEvent[];
  createdAt: string;
  updatedAt: string;
  parsedAt?: string | null;
  scoredAt?: string | null;
  promotedAt?: string | null;
  packRequestedAt?: string | null;
  archivedAt?: string | null;
}

export interface CreateCaptureInput {
  userId: string;
  source: CaptureSource;
  method: CaptureMethod;
  url?: string | null;
  rawText?: string | null;
  title?: string | null;
  company?: string | null;
  industry?: string | null;
  metadata?: CaptureMetadata;
  parsed?: CaptureParsedPayload;
  parseStatus?: ParseStatus;
}

export interface UpdateCaptureInput {
  userId: string;
  captureId: string;
  source?: CaptureSource;
  method?: CaptureMethod;
  status?: CaptureStatus;
  parseStatus?: ParseStatus;
  scoreStatus?: ScoreStatus;
  duplicateStatus?: DuplicateStatus;
  rawText?: string | null;
  url?: string | null;
  title?: string | null;
  company?: string | null;
  industry?: string | null;
  metadata?: CaptureMetadata;
  parsed?: CaptureParsedPayload;
}

export interface CaptureListQuery {
  status?: CaptureStatus;
  source?: CaptureSource;
  includeArchived?: boolean;
  limit?: number;
  offset?: number;
}

export interface CaptureScoreInput {
  userId: string;
  captureId: string;
  score: number;
  matchedSkills?: string[];
  missingSkills?: string[];
  suggestions?: string[];
  atsScore?: number;
  atsIssues?: string[];
  metadata?: CaptureMetadata;
}

export interface CaptureIdInput {
  userId: string;
  captureId: string;
}
