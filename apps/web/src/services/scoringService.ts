import { supabase } from '@/lib/supabaseClient';
import type { EnhancedScoreOutput } from '@jata/common';

export interface ScoreApplicationMatchInput {
  applicationId: string;
  resumeId?: string;
  includeProfile?: boolean;
}

export interface ScoreApplicationMatchResponse extends EnhancedScoreOutput {
  applicationId: string;
  resumeId: string | null;
  scoredAt: string;
}

export async function scoreApplicationMatch(
  input: ScoreApplicationMatchInput,
): Promise<ScoreApplicationMatchResponse> {
  const { data, error } = await supabase.functions.invoke<ScoreApplicationMatchResponse>('score-application-match', {
    body: input,
  });

  if (error) {
    throw new Error(error.message || 'Scoring request failed');
  }

  if (!data) {
    throw new Error('Scoring request returned no data');
  }

  return data;
}
