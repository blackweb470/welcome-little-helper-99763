import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);

const createInvitationEmail = (
  businessName: string,
  inviterName: string,
  role: string,
  permissions: { can_chat: boolean; can_view_analytics: boolean; can_manage_settings: boolean },
  signupUrl: string
) => {
  const permissionsList = [];
  if (permissions.can_chat) permissionsList.push('<li>Handle live chats with customers</li>');
  if (permissions.can_view_analytics) permissionsList.push('<li>View analytics and reports</li>');
  if (permissions.can_manage_settings) permissionsList.push('<li>Manage settings and configuration</li>');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background-color: #f6f9fc; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px 40px 48px;">
          <h1 style="color: #333; font-size: 28px; font-weight: bold; margin: 40px 0 20px;">Team Invitation</h1>
          
          <p style="color: #333; font-size: 16px; line-height: 26px; margin: 16px 0;">
            <strong>${inviterName}</strong> has invited you to join <strong>${businessName}</strong>'s support team as a <strong>${role}</strong>.
          </p>

          <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="color: #333; font-size: 14px; font-weight: bold; margin: 0 0 12px 0;">Your Permissions:</p>
            <ul style="color: #555; font-size: 14px; line-height: 24px; margin: 0; padding-left: 20px;">
              ${permissionsList.join('')}
            </ul>
          </div>

          <div style="text-align: center; padding: 27px 0;">
            <a href="${signupUrl}" style="background-color: #000; border-radius: 6px; color: #fff; font-size: 16px; font-weight: bold; text-decoration: none; display: inline-block; padding: 12px 32px;">
              Accept Invitation & Create Account
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e6ebf1; margin: 20px 0;">

          <p style="color: #8898aa; font-size: 14px; line-height: 24px; margin: 16px 0;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>

          <p style="color: #8898aa; font-size: 12px; line-height: 16px; margin-top: 32px;">
            This invitation was sent by ${businessName}
          </p>
        </div>
      </body>
    </html>
  `;
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

    // Get inviter's profile
    const { data: inviterProfile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', inviter.id)
      .single();

    // Get business details
    const { data: business, error: businessError } = await supabaseAdmin
      .from('businesses')
      .select('name')
      .eq('id', businessId)
      .single();

    if (businessError || !business) {
      return new Response(
        JSON.stringify({ error: 'Business not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already exists
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      return new Response(
        JSON.stringify({ error: 'Failed to check user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const existingUser = users?.find(u => u.email === email);
    let userId = existingUser?.id;

    // Check if already a team member
    if (userId) {
      const { data: existing } = await supabaseAdmin
        .from('team_members')
        .select('id')
        .eq('business_id', businessId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        return new Response(
          JSON.stringify({ error: 'Already a member', message: 'This user is already part of your team' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // If user doesn't exist, create a pending invitation with email stored in metadata
    // If user exists, add them directly and notify them
    const status = existingUser ? 'active' : 'pending';
    
    // Create team member record
    const teamMemberData: any = {
      business_id: businessId,
      role: role,
      permissions: permissions,
      invited_by: inviter.id,
      status: status,
    };

    // Store invited email in metadata for pending invitations
    if (!existingUser) {
      teamMemberData.user_id = null;
      teamMemberData.accepted_at = null;
      // We'll need to add an email field to track pending invitations
      // For now, we can't proceed without a user_id due to NOT NULL constraint
      return new Response(
        JSON.stringify({ 
          error: 'User must create account first',
          message: 'Please ask the user to create an account at /auth first, then you can add them to your team.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      teamMemberData.user_id = userId;
      teamMemberData.accepted_at = new Date().toISOString();
    }

    const { data: newMember, error: insertError } = await supabaseAdmin
      .from('team_members')
      .insert(teamMemberData)
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting team member:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to add team member' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ensure user has a profile
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', userId!)
      .single();

    if (!existingProfile) {
      await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId!,
          email: existingUser!.email,
          full_name: existingUser!.user_metadata?.full_name || existingUser!.email?.split('@')[0] || 'Team Member',
        });
    }

    // Assign admin role if needed
    if (role === 'admin') {
      await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: userId!,
          role: 'admin'
        })
        .select()
        .maybeSingle();
    }

    // Send notification email to existing user
    const emailHtml = createInvitationEmail(
      business.name,
      inviterProfile?.full_name || inviter.email || 'Team Admin',
      role.charAt(0).toUpperCase() + role.slice(1),
      permissions,
      `${Deno.env.get('SUPABASE_URL')?.replace('https://', 'https://').replace('.supabase.co', '.lovable.app')}/dashboard`
    );

    const { error: emailError } = await resend.emails.send({
      from: Deno.env.get('RESEND_FROM_EMAIL') || `${business.name} <onboarding@resend.dev>`,
      to: [email],
      subject: `You've been added to ${business.name}'s support team`,
      html: emailHtml,
    });

    if (emailError) {
      console.error('Error sending notification email:', emailError);
      // Don't fail the invitation if email fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        member: newMember,
        message: 'Team member added successfully and notified via email'
      }),
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
