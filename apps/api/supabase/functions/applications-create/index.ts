/**
 * @file Supabase Edge Function for creating a new application.
 * @author JATA
 *
 * @description This function handles POST requests to create a new application record.
 * It requires user authentication and validates the request body against a Zod schema.
 *
 * @see {@link https://supabase.com/docs/functions}
 *
 * @example
 * ```bash
 * curl -X POST 'https://<project_ref>.supabase.co/functions/v1/applications-create' \
 *   -H 'Authorization: Bearer <your_jwt>' \
 *   -H 'Content-Type: application/json' \
 *   -d '{
 *     "title": "Software Engineer",
 *     "company": "Supabase",
 *     "status": "Applied",
 *     "date_applied": "2024-01-15",
 *     "url": "https://supabase.com/careers"
 *   }'
 * ```
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { corsMiddleware } from '../_shared/cors';

type ApplicationData = {
  title: string;
  company: string;
  status?: 'Applied' | 'Interviewing' | 'Offer' | 'Rejected';
  date_applied?: string;
  url?: string;
  user_id: string;
};

type SupabaseTables = {
  applications: {
    Insert: ApplicationData;
    Row: ApplicationData & { id: string; created_at: string; updated_at: string };
  };
};

const applicationCreateSchema = z.object({
  title: z.string(),
  company: z.string(),
  status: z.enum(['Applied', 'Interviewing', 'Offer', 'Rejected']).optional(),
  date_applied: z.string().datetime().optional(),
  url: z.string().url().optional(),
});

async function handler(req: Request, res: Response, next: NextFunction) {
  // Use the CORS middleware
  corsMiddleware(req, res, async () => {
    if (req.method === 'OPTIONS') {
      return res.status(200).send('OK');
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase configuration');
        return res.status(500).json({ error: 'Server configuration error' });
      }

      const authHeader = req.headers.authorization || '';
      const supabase = createClient<SupabaseTables>(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const result = applicationCreateSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({ error: 'Invalid request body', details: result.error.issues });
      }

      const applicationData: ApplicationData = { ...result.data, user_id: user.id };

      const { data: application, error: insertError } = await supabase
        .from('applications')
        .insert(applicationData)
        .select()
        .single();

      if (insertError) {
        console.error('Database error:', insertError);
        return res.status(500).json({ error: 'Database error', details: insertError.message });
      }

      if (!application) {
        return res.status(500).json({ error: 'Failed to create application', details: 'No data returned' });
      }

      return res.status(201).json(application);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Unhandled error:', error);
      return res.status(500).json({ error: 'Internal server error', details: errorMessage });
    }
  });
}

export default handler;