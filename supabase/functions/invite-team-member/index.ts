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
  if (permissions.can_chat) permissionsList.push('<li style="margin-bottom: 8px;">Handle live chats with customers</li>');
  if (permissions.can_view_analytics) permissionsList.push('<li style="margin-bottom: 8px;">View analytics and reports</li>');
  if (permissions.can_manage_settings) permissionsList.push('<li style="margin-bottom: 8px;">Manage settings and configuration</li>');

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        background: #0a0a0a;
        padding: 40px 20px;
        font-family: 'DM Mono', monospace;
        -webkit-font-smoothing: antialiased;
      }
      .email-card {
        max-width: 560px;
        margin: 0 auto;
        background: #0f0f0f;
        border: 0.5px solid #2a2a2a;
        border-radius: 4px;
        overflow: hidden;
      }
      .email-header {
        padding: 56px 48px 48px;
        border-bottom: 0.5px solid #1e1e1e;
        position: relative;
      }
      .corner-mark {
        position: absolute;
        top: 20px;
        right: 20px;
        font-size: 10px;
        letter-spacing: 0.15em;
        color: #3a3a3a;
        text-transform: uppercase;
      }
      .logo {
        font-family: 'DM Serif Display', serif;
        font-size: 42px;
        color: #f5f5f5;
        letter-spacing: -1px;
        line-height: 1;
        margin-bottom: 4px;
      }
      .tagline {
        font-size: 10px;
        letter-spacing: 0.25em;
        color: #404040;
        text-transform: uppercase;
      }
      .index-num {
        position: absolute;
        bottom: 20px;
        left: 48px;
        font-size: 10px;
        letter-spacing: 0.15em;
        color: #2a2a2a;
      }
      .email-body {
        padding: 48px 48px 40px;
      }
      .greeting {
        font-size: 11px;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        color: #505050;
        margin-bottom: 28px;
      }
      .headline {
        font-family: 'DM Serif Display', serif;
        font-size: 28px;
        color: #f0f0f0;
        line-height: 1.25;
        letter-spacing: -0.5px;
        margin-bottom: 20px;
      }
      .body-text {
        font-size: 13px;
        line-height: 1.9;
        color: #666;
        margin-bottom: 40px;
      }
      .permissions-box {
        border: 0.5px solid #222;
        padding: 24px;
        margin-bottom: 40px;
      }
      .permissions-title {
        font-size: 10px;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        color: #505050;
        margin-bottom: 16px;
      }
      .permissions-list {
        font-size: 13px;
        line-height: 1.9;
        color: #888;
        padding-left: 16px;
      }
      .cta-btn {
        display: inline-block;
        background: #f5f5f5;
        color: #0a0a0a;
        text-decoration: none;
        padding: 14px 32px;
        font-family: 'DM Mono', monospace;
        font-size: 11px;
        font-weight: 500;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        border-radius: 2px;
        margin-bottom: 40px;
      }
      .divider {
        border: none;
        border-top: 0.5px solid #1e1e1e;
        margin-bottom: 28px;
      }
      .footnote {
        font-size: 11px;
        color: #303030;
        line-height: 1.8;
      }
      .email-footer {
        padding: 20px 48px;
        border-top: 0.5px solid #1a1a1a;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .footer-brand {
        font-size: 10px;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: #2a2a2a;
      }
      .footer-rule {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 10px;
        color: #252525;
        letter-spacing: 0.1em;
      }
      .footer-dash {
        width: 20px;
        height: 0.5px;
        background: #252525;
      }
    </style>
  </head>
  <body>
    <div class="email-card">
      <div class="email-header">
        <div class="corner-mark">Team Invite</div>
        <div class="logo">Lyqn.</div>
        <div class="tagline">Workspace Access</div>
        <div class="index-num">01 / 01</div>
      </div>
      <div class="email-body">
        <p class="greeting">Action required —</p>
        <h1 class="headline">You've been<br><em>invited</em></h1>
        <p class="body-text">
          <strong>${inviterName}</strong> has invited you to join <strong>${businessName}</strong>'s workspace as a <strong>${role}</strong>.
        </p>
        <div class="permissions-box">
          <div class="permissions-title">Your Access Permissions</div>
          <ul class="permissions-list">
            ${permissionsList.join('')}
          </ul>
        </div>
        <a href="${signupUrl}" class="cta-btn">Accept Invitation →</a>
        <hr class="divider">
        <p class="footnote">
          If you didn't expect this invitation, you can safely ignore this email.<br>
          This invitation was sent by ${businessName}.
        </p>
      </div>
      <div class="email-footer">
        <span class="footer-brand">Lyqn</span>
        <div class="footer-rule">
          <div class="footer-dash"></div>
          <span>Automated message</span>
          <div class="footer-dash"></div>
        </div>
      </div>
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

  const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'invites@lyqn.app';
  
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