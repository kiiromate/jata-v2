import { serve } from 'std/http/server.ts';
import { z } from 'zod';
import { corsHeaders } from '../_shared/cors.ts';
import { createSupabaseClient } from '../_shared/db.ts';
import {
  createAiRouter,
  createSupabaseCreditsStore,
  createSupabaseUsageStore,
  executeAiTask,
  type AiEnv,
  type AiProviderMode,
  type AiTaskInput,
  type AiTaskType,
} from '../_shared/ai/index.ts';

const ProviderSchema = z.enum(['none', 'mock', 'huggingface', 'openrouter']);

const BaseInputSchema = z.object({
  cvText: z.string().optional(),
  jobDescription: z.string().optional(),
  userProfile: z.string().optional(),
  notes: z.string().optional(),
});

const AiRequestSchema = z.discriminatedUnion('taskType', [
  z.object({
    taskType: z.literal('analyzeCvMatch'),
    provider: ProviderSchema.optional(),
    input: BaseInputSchema.extend({
      cvText: z.string(),
      jobDescription: z.string(),
    }),
  }),
  z.object({
    taskType: z.literal('suggestResumeImprovements'),
    provider: ProviderSchema.optional(),
    input: BaseInputSchema.extend({
      cvText: z.string(),
      jobDescription: z.string(),
    }),
  }),
  z.object({
    taskType: z.literal('generateCoverLetter'),
    provider: ProviderSchema.optional(),
    input: BaseInputSchema.extend({
      jobTitle: z.string(),
      companyName: z.string(),
      userName: z.string(),
      highlights: z.array(z.string()).default([]),
      tone: z.enum(['professional', 'conversational', 'formal']).optional(),
    }),
  }),
  z.object({
    taskType: z.literal('generateRecruiterMessage'),
    provider: ProviderSchema.optional(),
    input: BaseInputSchema.extend({
      jobTitle: z.string().optional(),
      companyName: z.string().optional(),
      recruiterName: z.string().optional(),
      highlights: z.array(z.string()).optional(),
    }),
  }),
  z.object({
    taskType: z.literal('generateFollowUpMessage'),
    provider: ProviderSchema.optional(),
    input: BaseInputSchema.extend({
      jobTitle: z.string().optional(),
      companyName: z.string().optional(),
      contactName: z.string().optional(),
      previousInteraction: z.string().optional(),
    }),
  }),
  z.object({
    taskType: z.literal('summarizeOpportunity'),
    provider: ProviderSchema.optional(),
    input: BaseInputSchema.extend({
      jobTitle: z.string().optional(),
      companyName: z.string().optional(),
    }),
  }),
  z.object({
    taskType: z.literal('generateTailoredResume'),
    provider: ProviderSchema.optional(),
    input: BaseInputSchema.extend({
      cvText: z.string().min(1),
      jobDescription: z.string().min(1),
      jobTitle: z.string().optional(),
      companyName: z.string().optional(),
    }),
  }),
]);

/** Reads server-only AI environment values for provider routing and limits. */
function readAiEnv(): AiEnv {
  return {
    JATA_AI_PROVIDER: Deno.env.get('JATA_AI_PROVIDER'),
    JATA_AI_MODEL_DEFAULT: Deno.env.get('JATA_AI_MODEL_DEFAULT'),
    OPENROUTER_API_KEY: Deno.env.get('OPENROUTER_API_KEY'),
    HUGGINGFACE_API_KEY: Deno.env.get('HUGGINGFACE_API_KEY'),
    JATA_AI_DAILY_LIMIT: Deno.env.get('JATA_AI_DAILY_LIMIT'),
    JATA_AI_MONTHLY_LIMIT: Deno.env.get('JATA_AI_MONTHLY_LIMIT'),
    JATA_AI_MAX_JD_CHARS: Deno.env.get('JATA_AI_MAX_JD_CHARS'),
    JATA_AI_MAX_CV_CHARS: Deno.env.get('JATA_AI_MAX_CV_CHARS'),
    JATA_AI_MAX_PROFILE_CHARS: Deno.env.get('JATA_AI_MAX_PROFILE_CHARS'),
  };
}

/** Reads an optional provider override from user metadata settings. */
function readUserProvider(user: { user_metadata?: Record<string, unknown> } | null): AiProviderMode | null {
  const settings = user?.user_metadata?.settings as { ai?: { provider?: AiProviderMode } } | undefined;
  const provider = settings?.ai?.provider;
  return ProviderSchema.safeParse(provider).success ? provider || null : null;
}

/** Maps execution errors to HTTP status codes. */
function statusForError(error: Error): number {
  if (error.message.includes('limit reached') || error.message.includes('cooling down')) return 429;
  if (error.message.includes('credits')) return 402;
  if (error.message.includes('too long')) return 413;
  return 500;
}

function publicMessageForStatus(status: number): string {
  if (status === 429) return 'AI usage limit reached.';
  if (status === 402) return 'AI credits unavailable.';
  if (status === 413) return 'AI input is too long.';
  return 'AI generation failed.';
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    });
  }

  try {
    const supabase = createSupabaseClient(req);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const body = await req.json();
    const parsed = AiRequestSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid request body', details: parsed.error.flatten() }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const env = readAiEnv();
    const router = createAiRouter({ env, fetchFn: fetch });
    const provider = router.resolveProvider(parsed.data.provider || readUserProvider(user));
    const payload = await executeAiTask({
      userId: user.id,
      taskType: parsed.data.taskType as AiTaskType,
      input: parsed.data.input as AiTaskInput,
      provider,
      usageStore: createSupabaseUsageStore(supabase),
      creditsStore: createSupabaseCreditsStore(supabase),
      env,
    });

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (e) {
    const error = e instanceof Error ? e : new Error('Internal server error');
    const status = statusForError(error);
    console.error('AI generation error:', error.message);
    return new Response(JSON.stringify({ error: publicMessageForStatus(status) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status,
    });
  }
});
