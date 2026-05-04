// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../packages/common/types/database.ts';

export function createSupabaseClient(req: Request) {
  const authHeader = req.headers.get("Authorization") || "";
  
  return createClient<Database>(
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

export async function getUserId(req: Request): Promise<string | null> {
  try {
    const supabase = createSupabaseClient(req);
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      console.error("Authentication error:", error?.message);
      return null;
    }
    
    return user.id;
  } catch (error) {
    console.error("Error getting user ID:", error);
    return null;
  }
}
