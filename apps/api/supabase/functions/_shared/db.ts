// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

export function createClientFromRequest(req: Request) {
  const authHeader = req.headers.get("Authorization") || "";
  
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      global: { 
        headers: { Authorization: authHeader } 
      },
      auth: { persistSession: false },
    }
  );
}

export async function getUserId(req: Request): Promise<number | null> {
  try {
    const supabase = createClientFromRequest(req);
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      console.error("Authentication error:", error?.message);
      return null;
    }
    
    return parseInt(user.id, 10) || null;
  } catch (error) {
    console.error("Error getting user ID:", error);
    return null;
  }
}
