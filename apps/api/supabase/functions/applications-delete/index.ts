// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { withCors, handleCors } from "../_shared/cors.ts";
import { getUserId } from "../_shared/db.ts";
import { createSuccessResponse, createErrorResponse } from "../_shared/schemas.ts";

/**
 * Delete a job application
 * DELETE /api/applications/:id
 */
serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // Only allow DELETE requests
  if (req.method !== "DELETE") {
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

    // Get application ID from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const applicationId = pathParts[pathParts.length - 1];
    
    if (!applicationId) {
      return withCors(
        new Response(
          JSON.stringify(createErrorResponse("Application ID is required", "VALIDATION_ERROR")),
          { status: 400, headers: { "Content-Type": "application/json" } }
        )
      );
    }

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

    // Check if application exists and belongs to user
    const { data: existingApp, error: fetchError } = await supabase
      .from("applications")
      .select("id")
      .eq("id", applicationId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !existingApp) {
      return withCors(
        new Response(
          JSON.stringify(createErrorResponse(
            "Application not found or access denied",
            "NOT_FOUND"
          )),
          { status: 404, headers: { "Content-Type": "application/json" } }
        )
      );
    }

    // Delete application
    const { error: deleteError } = await supabase
      .from("applications")
      .delete()
      .eq("id", applicationId);

    if (deleteError) {
      console.error("Database error:", deleteError);
      return withCors(
        new Response(
          JSON.stringify(createErrorResponse(
            "Failed to delete application",
            "DATABASE_ERROR",
            deleteError.message
          )),
          { status: 500, headers: { "Content-Type": "application/json" } }
        )
      );
    }

    // Return success response
    return withCors(
      new Response(
        JSON.stringify(createSuccessResponse({ success: true })),
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
