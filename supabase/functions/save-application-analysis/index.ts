import { serve } from 'std/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createSupabaseClient, getUserId } from '../_shared/db.ts'
import { z } from 'zod'

const SaveAnalysisSchema = z.object({
  applicationId: z.string().uuid(),
  jataScore: z.number(),
  finalResumeText: z.string(),
  selectedResumeId: z.string().uuid(),
})

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createSupabaseClient(req)
    const userId = await getUserId(req)

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const body = await req.json()
    const validation = SaveAnalysisSchema.safeParse(body)

    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body', details: validation.error.flatten() }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    const { applicationId, jataScore, finalResumeText, selectedResumeId } = validation.data

    // Verify ownership of the application
    const { data: existingApplication, error: fetchError } =
      await supabaseClient
        .from('applications')
        .select('id,user_id')
        .eq('id', applicationId)
        .eq('user_id', userId)
        .maybeSingle()

    if (fetchError) {
      console.error('Error fetching application:', fetchError.message)
      return new Response(
        JSON.stringify({ error: 'Error fetching application' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    if (!existingApplication) {
      return new Response(JSON.stringify({ error: 'Application not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      })
    }

    const { data: selectedResume, error: resumeFetchError } =
      await supabaseClient
        .from('resumes')
        .select('id')
        .eq('id', selectedResumeId)
        .eq('user_id', userId)
        .maybeSingle()

    if (resumeFetchError) {
      console.error('Error fetching resume:', resumeFetchError.message)
      return new Response(
        JSON.stringify({ error: 'Error fetching resume' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    if (!selectedResume) {
      return new Response(JSON.stringify({ error: 'Resume not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      })
    }

    // Update the application
    const { data: updatedApplication, error: updateError } =
      await supabaseClient
        .from('applications')
        .update({
          jata_score: jataScore,
          final_resume_text: finalResumeText,
          selected_resume_id: selectedResumeId,
        })
        .eq('id', applicationId)
        .eq('user_id', userId)
        .select()
        .single()

    if (updateError) {
      console.error('Error updating application:', updateError.message)
      return new Response(
        JSON.stringify({ error: 'Error updating application' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    return new Response(JSON.stringify(updatedApplication), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (e) {
    const error = e as Error
    console.error('Unhandled error:', error.message)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
