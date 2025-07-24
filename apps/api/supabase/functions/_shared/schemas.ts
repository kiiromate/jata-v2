// @ts-nocheck
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const ApplicationStatus = z.enum([
  "Applied",
  "Interview",
  "Offer",
  "Rejected",
]);

export type ApplicationStatus = z.infer<typeof ApplicationStatus>;

export const ApplicationSchema = z.object({
  id: z.number(),
  title: z.string().min(1, "Title is required"),
  company: z.string().min(1, "Company name is required"),
  status: ApplicationStatus.default("Applied"),
  date_applied: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  url: z.string().url().or(z.literal("")).optional().nullable(),
  source: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  user_id: z.number(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const CreateApplicationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  company: z.string().min(1, "Company name is required"),
  status: ApplicationStatus.optional(),
  date_applied: z.string().datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .default(() => new Date().toISOString().split("T")[0]),
  url: z.string().url().or(z.literal("")).optional(),
  source: z.string().optional(),
  industry: z.string().optional(),
});

export const UpdateApplicationSchema = CreateApplicationSchema.partial();

export const ApplicationIdSchema = z.object({
  id: z.string().min(1, "Application ID is required"),
});

export const ApplicationQuerySchema = z.object({
  status: ApplicationStatus.optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).default("10"),
  offset: z.string().regex(/^\d+$/).transform(Number).default("0"),
});

export type Application = z.infer<typeof ApplicationSchema>;
export type CreateApplicationInput = z.infer<typeof CreateApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof UpdateApplicationSchema>;
export type ApplicationQuery = z.infer<typeof ApplicationQuerySchema>;

export interface SuccessResponse<T> {
  data: T;
  error: null;
}

export interface ErrorResponse {
  data: null;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

export function createSuccessResponse<T>(data: T): SuccessResponse<T> {
  return { data, error: null };
}

export function createErrorResponse(
  message: string,
  code?: string,
  details?: unknown
): ErrorResponse {
  return {
    data: null,
    error: { message, code, details },
  };
}

export async function validateRequest<T>(
  req: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: Response }> {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);
    
    if (!result.success) {
      const errorMessage = result.error.errors
        .map((e: { path: string[]; message: string }) => 
          `${e.path.join(".")}: ${e.message}`
        )
        .join(", ");
      
      return {
        success: false,
        error: new Response(
          JSON.stringify(createErrorResponse(
            `Validation failed: ${errorMessage}`,
            "VALIDATION_ERROR",
            result.error.format()
          )),
          { status: 400, headers: { "Content-Type": "application/json" } }
        ),
      };
    }
    
    return { success: true, data: result.data };
  } catch (error) {
    return {
      success: false,
      error: new Response(
        JSON.stringify(createErrorResponse(
          "Invalid JSON in request body",
          "INVALID_JSON"
        )),
        { status: 400, headers: { "Content-Type": "application/json" } }
      ),
    };
  }
}
