import { serve } from 'std/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createSupabaseClient, getUserId } from '../_shared/db.ts'
import { CreateApplicationSchema } from '../_shared/schemas.ts'

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createSupabaseClient(req)
    const userId = await getUserId(req)
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const body = await req.json()
    
    const result = CreateApplicationSchema.safeParse(body);
    if (!result.success) {
      return new Response(JSON.stringify({ error: 'Invalid request body', details: result.error.issues }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const applicationData = { id: crypto.randomUUID(), ...result.data, user_id: userId };

    const { data, error } = await supabase
      .from('applications')
      .insert(applicationData)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error.message)
      return new Response(JSON.stringify({ error: 'Failed to create application' }), {
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
    console.error('Unhandled error:', error.message);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
