import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with service role privileges
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify the user's JWT token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const { user_id } = await req.json()

    // Verify that the authenticated user is trying to delete their own account
    if (user.id !== user_id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Cannot delete another user\'s account' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Start a transaction to delete all user data
    // Delete user's applications first (due to foreign key constraints)
    const { error: appsError } = await supabaseAdmin
      .from('applications')
      .delete()
      .eq('user_id', user_id)

    if (appsError) {
      console.error('Error deleting applications:', appsError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete user applications' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Delete user's resumes
    const { error: resumesError } = await supabaseAdmin
      .from('resumes')
      .delete()
      .eq('user_id', user_id)

    if (resumesError) {
      console.error('Error deleting resumes:', resumesError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete user resumes' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Delete user profile data
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', user_id)

    if (profileError) {
      console.error('Error deleting user profile:', profileError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete user profile' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Delete the user from auth.users (this cascades to auth.identities)
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id)

    if (authDeleteError) {
      console.error('Error deleting auth user:', authDeleteError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete user authentication' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Delete user's avatar from storage if it exists
    try {
      const { error: storageError } = await supabaseAdmin.storage
        .from('avatars')
        .remove([`${user_id}.jpg`, `${user_id}.png`, `${user_id}.jpeg`, `${user_id}.webp`])
      
      // Storage errors are not critical, log but don't fail the request
      if (storageError) {
        console.warn('Error deleting avatar files:', storageError)
      }
    } catch (storageErr) {
      console.warn('Storage cleanup error:', storageErr)
    }

    return new Response(
      JSON.stringify({ message: 'User account successfully deleted' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
