import {
  scoreApplicationFit,
  type EnhancedScoreOutput,
  type EvidenceSource,
} from '../../../../packages/common/src/scoring/index.ts';
import type { Json } from '../../../../packages/common/types/database.ts';

export interface ScoreApplicationMatchApplicationRecord {
  id: string;
  user_id: string;
  job_description: string | null;
  final_resume_text: string | null;
  selected_resume_id: string | null;
  capture_raw_input: Json;
  capture_parsed_payload: Json;
  jata_score: number | null;
  score_status: string | null;
  scored_at: string | null;
  capture_score_result: Json | null;
}

export interface ScoreApplicationMatchResumeRecord {
  id: string;
  user_id: string;
  content: string;
  extracted_text: string | null;
  original_text?: string | null;
}

export interface ScoreApplicationMatchProfileRecord {
  professional_summary?: string | null;
  skills?: string[] | null;
  experience_level?: string | null;
  industry?: string | null;
  location?: string | null;
}

export interface ScoreApplicationMatchRepository {
  getApplication(userId: string, applicationId: string): Promise<ScoreApplicationMatchApplicationRecord | null>;
  getResume(userId: string, resumeId: string): Promise<ScoreApplicationMatchResumeRecord | null>;
  getProfile(userId: string): Promise<ScoreApplicationMatchProfileRecord | null>;
  updateApplication(
    userId: string,
    applicationId: string,
    patch: Record<string, unknown>,
  ): Promise<ScoreApplicationMatchApplicationRecord | null>;
}

interface HandlerDeps {
  getUserId(req: Request): Promise<string | null>;
  createRepository(req: Request): ScoreApplicationMatchRepository;
  now?: () => Date;
}

interface RequestBody {
  applicationId?: unknown;
  resumeId?: unknown;
  includeProfile?: unknown;
}

interface ResumeEvidence {
  resumeText: string;
  resumeId: string | null;
  resumeSource: EvidenceSource;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });
}

function readObject(value: Json): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function readJobDescription(application: ScoreApplicationMatchApplicationRecord): string {
  const direct = readString(application.job_description);
  if (direct) return direct;

  const parsed = readObject(application.capture_parsed_payload);
  const parsedJobDescription = readString(parsed.jobDescription);
  if (parsedJobDescription) return parsedJobDescription;

  const rawInput = readObject(application.capture_raw_input);
  return readString(rawInput.text);
}

function profileToText(profile: ScoreApplicationMatchProfileRecord | null): string {
  if (!profile) return '';
  return [
    profile.professional_summary,
    profile.skills?.join(', '),
    profile.experience_level,
    profile.industry,
    profile.location,
  ]
    .map((value) => readString(value))
    .filter(Boolean)
    .join('\n');
}

function resolveResumeEvidence(
  application: ScoreApplicationMatchApplicationRecord,
  resume: ScoreApplicationMatchResumeRecord | null,
): ResumeEvidence | null {
  if (resume) {
    const extractedText = readString(resume.extracted_text);
    if (extractedText) {
      return { resumeText: extractedText, resumeId: resume.id, resumeSource: 'resume_extracted_text' };
    }

    const content = readString(resume.content);
    if (content) {
      return { resumeText: content, resumeId: resume.id, resumeSource: 'resume_content' };
    }

    const originalText = readString(resume.original_text);
    if (originalText) {
      return { resumeText: originalText, resumeId: resume.id, resumeSource: 'resume_original_text' };
    }
  }

  const finalResumeText = readString(application.final_resume_text);
  if (finalResumeText) {
    return {
      resumeText: finalResumeText,
      resumeId: resume?.id ?? application.selected_resume_id,
      resumeSource: 'application_final_resume_text',
    };
  }

  return null;
}

function parseBody(body: RequestBody): { applicationId: string; resumeId?: string; includeProfile: boolean } | null {
  const applicationId = readString(body.applicationId);
  const resumeId = readString(body.resumeId);

  if (!applicationId) return null;

  return {
    applicationId,
    resumeId: resumeId || undefined,
    includeProfile: body.includeProfile === true,
  };
}

function isSchemaPrecheckError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return /column .* does not exist|schema cache|capture_score_result|jata_score|score_status|scored_at|selected_resume_id/i.test(error.message);
}

function isOptionalProfileSchemaError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message;
  return /schema cache|column .* does not exist/i.test(message)
    && /profiles|professional_summary|experience_level|skills|industry|location/i.test(message);
}

function responseBody(output: EnhancedScoreOutput, applicationId: string, resumeId: string | null, scoredAt: string) {
  return {
    ...output,
    applicationId,
    resumeId,
    scoredAt,
    metadata: {
      ...output.metadata,
      applicationId,
      resumeId,
    },
  };
}

export function createScoreApplicationMatchHandler(deps: HandlerDeps): (req: Request) => Promise<Response> {
  return async function handleScoreApplicationMatch(req: Request): Promise<Response> {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    const userId = await deps.getUserId(req);
    if (!userId) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    let parsedBody: ReturnType<typeof parseBody>;
    try {
      parsedBody = parseBody(await req.json());
    } catch {
      return jsonResponse({ error: 'Invalid JSON request body' }, 400);
    }

    if (!parsedBody) {
      return jsonResponse({ error: 'applicationId is required' }, 400);
    }

    const repository = deps.createRepository(req);
    let application: ScoreApplicationMatchApplicationRecord | null;

    try {
      application = await repository.getApplication(userId, parsedBody.applicationId);
    } catch (error) {
      if (isSchemaPrecheckError(error)) {
        return jsonResponse({
          error: 'Schema precheck failed. Existing scoring columns are missing or unavailable; apply the approved capture inbox migration before scoring.',
        }, 500);
      }
      throw error;
    }

    if (!application) {
      return jsonResponse({ error: 'Application not found' }, 404);
    }

    const jobDescription = readJobDescription(application);
    if (!jobDescription) {
      return jsonResponse({ error: 'Job description text is required before scoring.' }, 400);
    }

    const requestedResumeId = parsedBody.resumeId ?? application.selected_resume_id ?? undefined;
    const resume = requestedResumeId ? await repository.getResume(userId, requestedResumeId) : null;
    if (requestedResumeId && !resume) {
      return jsonResponse({ error: 'Resume not found' }, 404);
    }

    const resumeEvidence = resolveResumeEvidence(application, resume);
    if (!resumeEvidence) {
      return jsonResponse({ error: 'Resume evidence text is required before scoring.' }, 400);
    }

    let profile: ScoreApplicationMatchProfileRecord | null = null;
    if (parsedBody.includeProfile) {
      try {
        profile = await repository.getProfile(userId);
      } catch (error) {
        if (!isOptionalProfileSchemaError(error)) throw error;
      }
    }

    const scoredAt = (deps.now ?? (() => new Date()))().toISOString();
    const output = scoreApplicationFit({
      jobDescription,
      resumeText: resumeEvidence.resumeText,
      profileText: profileToText(profile),
      resumeSource: resumeEvidence.resumeSource,
      now: () => new Date(scoredAt),
    });
    const body = responseBody(output, application.id, resumeEvidence.resumeId, scoredAt);

    await repository.updateApplication(userId, application.id, {
      jata_score: Math.round(output.score),
      score_status: 'completed',
      scored_at: scoredAt,
      updated_at: scoredAt,
      selected_resume_id: resumeEvidence.resumeId,
      capture_score_result: body,
    });

    return jsonResponse(body);
  };
}
