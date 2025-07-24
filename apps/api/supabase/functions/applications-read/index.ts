// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { withCors, handleCors } from "../_shared/cors.ts";
import { getUserId } from "../_shared/db.ts";
import { 
  Application, 
  ApplicationQuery, 
  ApplicationQuerySchema, 
  ApplicationStatus,
  createSuccessResponse, 
  createErrorResponse 
} from "../_shared/schemas.ts";

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // Only allow GET requests
  if (req.method !== "GET") {
    return withCors(
      new Response(
        JSON.stringify(createErrorResponse("Method not allowed", "METHOD_NOT_ALLOWED")),
        { status: 405, headers: { "Content-Type": "application/json" } }
      )
    );
  }

  try {
    // Get authenticated user ID
    const userId = await getUserId(req);
    if (!userId) {
      return withCors(
        new Response(
          JSON.stringify(createErrorResponse("Unauthorized", "UNAUTHORIZED")),
          { status: 401, headers: { "Content-Type": "application/json" } }
        )
      );
    }

    // Parse and validate query parameters
    const url = new URL(req.url);
    const queryParams: Record<string, string | undefined> = {
      status: url.searchParams.get("status") || undefined,
      limit: url.searchParams.get("limit") || "10",
      offset: url.searchParams.get("offset") || "0",
    };

    const queryResult = ApplicationQuerySchema.safeParse(queryParams);
    if (!queryResult.success) {
      const errorMessage = queryResult.error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      
      return withCors(
        new Response(
          JSON.stringify(createErrorResponse(
            `Invalid query parameters: ${errorMessage}`,
            "VALIDATION_ERROR"
          )),
          { status: 400, headers: { "Content-Type": "application/json" } }
        )
      );
    }
    
    const { status, limit, offset } = queryResult.data;

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { 
          headers: { 
            Authorization: req.headers.get("Authorization") ?? "" 
          } 
        },
        auth: { persistSession: false },
      }
    );

    // Build query with filters
    let query = supabase
      .from("applications")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("date_applied", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    // Execute query
    const { data: applications, error: dbError, count } = await query.returns<Application[]>();

    if (dbError) {
      console.error("Database error:", dbError);
      return withCors(
        new Response(
          JSON.stringify(createErrorResponse(
            "Failed to fetch applications",
            "DATABASE_ERROR",
            dbError.message
          )),
          { status: 500, headers: { "Content-Type": "application/json" } }
        )
      );
    }

    // Return paginated results
    return withCors(
      new Response(
        JSON.stringify(createSuccessResponse({
          items: applications || [],
          pagination: {
            total: count || 0,
            limit,
            offset,
            hasMore: (offset + (applications?.length || 0)) < (count || 0),
          },
        })),
        { 
          status: 200, 
          headers: { "Content-Type": "application/json" } 
        }
      )
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return withCors(
      new Response(
        JSON.stringify(createErrorResponse(
          "Internal server error",
          "INTERNAL_SERVER_ERROR",
          error instanceof Error ? error.message : "Unknown error"
        )),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    );
  }
});
