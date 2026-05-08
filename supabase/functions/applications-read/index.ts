import { serve } from 'std/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createSupabaseClient, getUserId } from '../_shared/db.ts'
import { ApplicationQuerySchema } from '../_shared/schemas.ts'

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
    const queryParams = {
      status: url.searchParams.get("status") || undefined,
      limit: url.searchParams.get("limit") || "10",
      offset: url.searchParams.get("offset") || "0",
    };

    const queryResult = ApplicationQuerySchema.safeParse(queryParams);
    if (!queryResult.success) {
      const errorMessage = queryResult.error.errors
        .map((e: { path: (string | number)[]; message: string }) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      
      return new Response(JSON.stringify({ error: `Invalid query parameters: ${errorMessage}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }
    
    const { status, limit, offset } = queryResult.data;

    let query = supabase
      .from("applications")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("date_applied", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    const { data: applications, error: dbError, count } = await query;

    if (dbError) {
      console.error("Database error:", dbError.message);
      return new Response(JSON.stringify({ error: "Failed to fetch applications" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    return new Response(JSON.stringify({
      items: applications || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (offset + (applications?.length || 0)) < (count || 0),
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (e) {
    const error = e as Error;
    console.error("Unexpected error:", error.message);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
