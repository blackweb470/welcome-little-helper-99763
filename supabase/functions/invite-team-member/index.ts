import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-visitor-id',
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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: inviter }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !inviter) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: inviterProfile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', inviter.id)
      .single();

    const { data: business, error: businessError } = await supabaseAdmin
      .from('businesses')
      .select('name, owner_id')
      .eq('id', businessId)
      .single();

    if (businessError || !business) {
      return new Response(
        JSON.stringify({ error: 'Business not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Authorization: only owner or an active team member with manage_settings can invite
    let canInvite = business.owner_id === inviter.id;
    if (!canInvite) {
      const { data: membership } = await supabaseAdmin
        .from('team_members')
        .select('permissions, status')
        .eq('business_id', businessId)
        .eq('user_id', inviter.id)
        .eq('status', 'active')
        .maybeSingle();
      canInvite = !!(membership && (membership.permissions as any)?.can_manage_settings === true);
    }
    if (!canInvite) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already exists in auth
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      return new Response(
        JSON.stringify({ error: 'Failed to check user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const existingUser = users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
    const userId = existingUser?.id;

    // Check for existing team member by user_id OR email (covers both active and pending)
    const { data: existingMembers } = await supabaseAdmin
      .from('team_members')
      .select('id, status, user_id, email')
      .eq('business_id', businessId)
      .or(
        userId 
          ? `user_id.eq.${userId},email.ilike.${email}` 
          : `email.ilike.${email}`
      );

    if (existingMembers && existingMembers.length > 0) {
      const activeMember = existingMembers.find(m => m.status === 'active');
      const deactivatedMember = existingMembers.find(m => m.status === 'deactivated');
      const pendingMember = existingMembers.find(m => m.status === 'pending');

      if (activeMember) {
        return new Response(
          JSON.stringify({ error: 'Already a member', message: 'This user is already part of your team' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Re-activate deactivated member
      if (deactivatedMember) {
        const { error: updateError } = await supabaseAdmin
          .from('team_members')
          .update({
            status: existingUser ? 'active' : 'pending',
            role: role,
            permissions: permissions,
            invited_by: inviter.id,
            invited_at: new Date().toISOString(),
            accepted_at: existingUser ? new Date().toISOString() : null,
            user_id: existingUser ? userId : null,
            email: email,
          })
          .eq('id', deactivatedMember.id);

        if (updateError) {
          console.error('Error reactivating team member:', updateError);
          return new Response(
            JSON.stringify({ error: 'Failed to reactivate team member' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Send email notification
        await sendInviteEmail(req, email, business.name, inviterProfile, inviter, role, permissions, existingUser, resend);

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Team member reactivated successfully'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Already has a pending invite
      if (pendingMember) {
        return new Response(
          JSON.stringify({ error: 'Invitation pending', message: 'An invitation is already pending for this email' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Create new team member record
    const status = existingUser ? 'active' : 'pending';
    
    const teamMemberData: any = {
      business_id: businessId,
      email: email,
      role: role,
      permissions: permissions,
      invited_by: inviter.id,
      status: status,
      user_id: existingUser ? userId : null,
      accepted_at: existingUser ? new Date().toISOString() : null,
    };

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

    // Only create profile and assign roles if user exists
    if (existingUser && userId) {
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (!existingProfile) {
        await supabaseAdmin
          .from('profiles')
          .insert({
            id: userId,
            email: existingUser.email,
            full_name: existingUser.user_metadata?.full_name || existingUser.email?.split('@')[0] || 'Team Member',
          });
      }

      if (role === 'admin') {
        await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: userId,
            role: 'admin'
          })
          .select()
          .maybeSingle();
      }
    }

    // Send email
    await sendInviteEmail(req, email, business.name, inviterProfile, inviter, role, permissions, existingUser, resend);

    return new Response(
      JSON.stringify({ 
        success: true, 
        member: newMember,
        message: existingUser 
          ? 'Team member added successfully and notified via email'
          : 'Invitation sent! The user will become active once they create an account with this email address.'
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

async function sendInviteEmail(
  req: Request,
  email: string,
  businessName: string,
  inviterProfile: any,
  inviter: any,
  role: string,
  permissions: any,
  existingUser: any,
  resendClient: any
) {
  const origin = req.headers.get('origin') || 'https://lyqn.app';
  const inviteUrl = existingUser 
    ? `${origin}/dashboard` 
    : `${origin}/auth`;
  
  const emailHtml = createInvitationEmail(
    businessName,
    inviterProfile?.full_name || inviter.email || 'Team Admin',
    role.charAt(0).toUpperCase() + role.slice(1),
    permissions,
    inviteUrl
  );

  const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'onboarding@resend.dev';
  
  try {
    const { error: emailError } = await resendClient.emails.send({
      from: fromEmail,
      to: [email],
      replyTo: inviter.email || undefined,
      subject: `You've been invited to join ${businessName}'s team`,
      html: emailHtml,
    });

    if (emailError) {
      console.error('Error sending invitation email:', emailError);
    }
  } catch (error) {
    console.error('Exception sending invitation email:', error);
  }
}