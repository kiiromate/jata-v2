import { serve } from 'std/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createSupabaseClient, getUserId } from '../_shared/db.ts'

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createSupabaseClient(req)
    
    const userId = await getUserId(req);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const applicationId = pathParts[pathParts.length - 1];

    if (!applicationId) {
        return new Response(JSON.stringify({ error: 'Application ID is required' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }

    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', applicationId)
      .eq('user_id', userId)

    if (error) {
      console.error('Database error:', error.message)
      return new Response(JSON.stringify({ error: 'Failed to delete application' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (e) {
    const error = e as Error;
    console.error('Unexpected error:', error.message);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
