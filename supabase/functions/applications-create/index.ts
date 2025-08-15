import { serve } from 'std/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { z } from 'zod'
import { createSupabaseClient, getUserId } from '../_shared/db.ts'
import { CreateApplicationSchema } from '../_shared/schemas.ts'

type Application = z.infer<typeof CreateApplicationSchema>

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createSupabaseClient(req)
    const body: Application = await req.json()
    
    const result = CreateApplicationSchema.safeParse(body);
    if (!result.success) {
      return new Response(JSON.stringify({ error: 'Invalid request body', details: result.error.issues }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const userId = await getUserId(req)
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const applicationData = { ...result.data, user_id: userId };

    const { data, error } = await supabase
      .from('applications')
      .insert(applicationData)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return new Response(JSON.stringify({ error: 'Database error', details: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    })
  } catch (e) {
    const error = e as Error;
    const errorMessage = error.message || 'An unknown error occurred';
    console.error('Unhandled error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', details: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
