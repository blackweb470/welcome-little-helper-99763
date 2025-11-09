import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, businessId, role, permissions } = await req.json();

    // Create Supabase client with service role for admin access
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get authorization header to identify the inviter
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the inviter's JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: inviter }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !inviter) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user exists with this email
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      return new Response(
        JSON.stringify({ error: 'Failed to check user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const foundUser = users?.find(u => u.email === email);
    
    if (!foundUser) {
      return new Response(
        JSON.stringify({ error: 'User not found', message: 'This user needs to create an account first' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already a team member
    const { data: existing } = await supabaseAdmin
      .from('team_members')
      .select('id')
      .eq('business_id', businessId)
      .eq('user_id', foundUser.id)
      .single();

    if (existing) {
      return new Response(
        JSON.stringify({ error: 'Already a member', message: 'This user is already part of your team' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Add team member
    const { data: newMember, error: insertError } = await supabaseAdmin
      .from('team_members')
      .insert({
        business_id: businessId,
        user_id: foundUser.id,
        role: role,
        permissions: permissions,
        invited_by: inviter.id,
        status: 'active',
        accepted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting team member:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to add team member' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, member: newMember }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in invite-team-member function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
