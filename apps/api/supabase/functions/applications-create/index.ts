// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withCors, handleCors } from "../_shared/cors.ts";
import { getUserId } from "../_shared/db.ts";
import { 
  Application, 
  CreateApplicationInput, 
  createSuccessResponse, 
  createErrorResponse 
} from "../_shared/schemas.ts";

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // Only allow POST requests
  if (req.method !== "POST") {
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

    // Parse and validate request body
    let applicationData: CreateApplicationInput;
    try {
      const body = await req.json();
      const result = CreateApplicationSchema.safeParse(body);
      
      if (!result.success) {
        const errorMessage = result.error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ");
        
        return withCors(
          new Response(
            JSON.stringify(createErrorResponse(
              `Validation failed: ${errorMessage}`,
              "VALIDATION_ERROR",
              result.error.format()
            )),
            { status: 400, headers: { "Content-Type": "application/json" } }
          )
        );
      }
      
      applicationData = result.data;
    } catch (error) {
      return withCors(
        new Response(
          JSON.stringify(createErrorResponse("Invalid JSON in request body", "INVALID_JSON")),
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

    // Insert new application
    const { data: newApplication, error: dbError } = await supabase
      .from("applications")
      .insert([
        {
          ...applicationData,
          user_id: userId,
          status: applicationData.status || "applied",
        }
      ])
      .select()
      .single<Application>();

    if (dbError) {
      console.error("Database error:", dbError);
      return withCors(
        new Response(
          JSON.stringify(createErrorResponse(
            "Failed to create application",
            "DATABASE_ERROR",
            dbError.message
          )),
          { status: 500, headers: { "Content-Type": "application/json" } }
        )
      );
    }

    // Return created application
    return withCors(
      new Response(
        JSON.stringify(createSuccessResponse(newApplication)),
        { 
          status: 201, 
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
