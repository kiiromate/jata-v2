import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createSupabaseClient, getUserId } from '../_shared/db.ts'
import { UpdateApplicationSchema } from '../_shared/schemas.ts'

serve(async (req) => {
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

    const body = await req.json();
    const result = UpdateApplicationSchema.safeParse(body);

    if (!result.success) {
        const errorMessage = result.error.errors
            .map((e) => `${e.path.join(".")}: ${e.message}`)
            .join(", ");
        
        return new Response(JSON.stringify({ error: `Validation failed: ${errorMessage}` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }

    const { data: updateData } = result;

    if (Object.keys(updateData).length === 0) {
        return new Response(JSON.stringify({ error: 'No fields to update' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }

    const { data: updatedApplication, error: updateError } = await supabase
      .from("applications")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId)
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError) {
      console.error("Database error:", updateError);
      return new Response(JSON.stringify({ error: "Failed to update application", details: updateError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    return new Response(JSON.stringify(updatedApplication), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal server error", details: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})