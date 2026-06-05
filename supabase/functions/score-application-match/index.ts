import { serve } from 'std/http/server.ts';
import { createSupabaseClient, getUserId } from '../_shared/db.ts';
import {
  createScoreApplicationMatchHandler,
  type ScoreApplicationMatchRepository,
} from '../_shared/scoring/service.ts';

function createSupabaseScoreRepository(req: Request): ScoreApplicationMatchRepository {
  const supabase = createSupabaseClient(req);

  return {
    async getApplication(userId, applicationId) {
      const { data, error } = await supabase
        .from('applications')
        .select(
          [
            'id',
            'user_id',
            'job_description',
            'final_resume_text',
            'selected_resume_id',
            'capture_raw_input',
            'capture_parsed_payload',
            'jata_score',
            'score_status',
            'scored_at',
            'capture_score_result',
          ].join(','),
        )
        .eq('id', applicationId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw new Error(error.message);
      return data;
    },
    async getResume(userId, resumeId) {
      const { data, error } = await supabase
        .from('resumes')
        .select('id,user_id,content,extracted_text')
        .eq('id', resumeId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw new Error(error.message);
      return data;
    },
    async getProfile(userId) {
      const { data, error } = await supabase
        .from('profiles')
        .select('professional_summary,skills,experience_level,industry,location')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw new Error(error.message);
      return data;
    },
    async updateApplication(userId, applicationId, patch) {
      const { data, error } = await supabase
        .from('applications')
        .update(patch)
        .eq('id', applicationId)
        .eq('user_id', userId)
        .select(
          [
            'id',
            'user_id',
            'job_description',
            'final_resume_text',
            'selected_resume_id',
            'capture_raw_input',
            'capture_parsed_payload',
            'jata_score',
            'score_status',
            'scored_at',
            'capture_score_result',
          ].join(','),
        )
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
  };
}

serve(
  createScoreApplicationMatchHandler({
    getUserId,
    createRepository: createSupabaseScoreRepository,
  }),
);
