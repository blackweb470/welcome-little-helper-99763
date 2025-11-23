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
  businessLogo: string | null,
  inviterName: string,
  role: string,
  permissions: { can_chat: boolean; can_view_analytics: boolean; can_manage_settings: boolean },
  signupUrl: string,
  template: any = null
) => {
  const permissionsList = [];
  if (permissions.can_chat) permissionsList.push('<li>Handle live chats with customers</li>');
  if (permissions.can_view_analytics) permissionsList.push('<li>View analytics and reports</li>');
  if (permissions.can_manage_settings) permissionsList.push('<li>Manage settings and configuration</li>');

  // Use custom template if available
  const headerText = template?.header_text || 'Team Invitation';
  const bodyText = template?.body_text || `{inviter_name} has invited you to join {business_name}'s team as a {role}.`;
  const footerText = template?.footer_text || 'This invitation was sent by {business_name}';
  const primaryColor = template?.primary_color || '#000';
  const buttonText = template?.button_text || 'Accept Invitation & Create Account';
  const showLogo = template?.show_logo !== false;

  const formattedBody = bodyText
    .replace(/{inviter_name}/g, `<strong>${inviterName}</strong>`)
    .replace(/{business_name}/g, `<strong>${businessName}</strong>`)
    .replace(/{role}/g, `<strong>${role}</strong>`);

  const formattedFooter = footerText.replace(/{business_name}/g, businessName);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background-color: #f6f9fc; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px 40px 48px;">
          ${showLogo && businessLogo ? `
            <div style="text-align: center; margin-bottom: 24px;">
              <img src="${businessLogo}" alt="${businessName}" style="max-width: 120px; height: auto;" />
            </div>
          ` : ''}
          
          <h1 style="color: #333; font-size: 28px; font-weight: bold; margin: 40px 0 20px;">${headerText}</h1>
          
          <p style="color: #333; font-size: 16px; line-height: 26px; margin: 16px 0;">
            ${formattedBody}
          </p>

          <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="color: #333; font-size: 14px; font-weight: bold; margin: 0 0 12px 0;">Your Permissions:</p>
            <ul style="color: #555; font-size: 14px; line-height: 24px; margin: 0; padding-left: 20px;">
              ${permissionsList.join('')}
            </ul>
          </div>

          <div style="text-align: center; padding: 27px 0;">
            <a href="${signupUrl}" style="background-color: ${primaryColor}; border-radius: 6px; color: #fff; font-size: 16px; font-weight: bold; text-decoration: none; display: inline-block; padding: 12px 32px;">
              ${buttonText}
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e6ebf1; margin: 20px 0;">

          <p style="color: #8898aa; font-size: 14px; line-height: 24px; margin: 16px 0;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>

          <p style="color: #8898aa; font-size: 12px; line-height: 16px; margin-top: 32px;">
            ${formattedFooter}
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

    // Get business details and email template
    const { data: business, error: businessError } = await supabaseAdmin
      .from('businesses')
      .select('name, logo_url')
      .eq('id', businessId)
      .single();

    // Get custom email template if exists
    const { data: emailTemplate } = await supabaseAdmin
      .from('email_templates')
      .select('*')
      .eq('business_id', businessId)
      .eq('template_type', 'team_invitation')
      .maybeSingle();

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

    // If user doesn't exist, create a pending invitation
    // If user exists, add them directly as active
    const status = existingUser ? 'active' : 'pending';
    
    // Create team member record
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
      // Ensure user has a profile
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

      // Assign admin role if needed
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

    // Send notification email to existing user
    // Get the proper app URL - use the origin from request headers or fallback to production
    const origin = req.headers.get('origin') || 'https://lyqn.app';
    const inviteUrl = existingUser 
      ? `${origin}/dashboard` 
      : `${origin}/auth`;
    
    const emailHtml = createInvitationEmail(
      business.name,
      business.logo_url,
      inviterProfile?.full_name || inviter.email || 'Team Admin',
      role.charAt(0).toUpperCase() + role.slice(1),
      permissions,
      inviteUrl,
      emailTemplate
    );

    // Use custom subject if available
    const emailSubject = emailTemplate?.subject || `You've been invited to join ${business.name}'s team`;

    // Get the configured from email or use default
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'onboarding@resend.dev';
    
    try {
      const { error: emailError } = await resend.emails.send({
        from: fromEmail,
        to: [email],
        replyTo: inviter.email || undefined,
        subject: emailSubject,
        html: emailHtml,
      });

      if (emailError) {
        console.error('Error sending invitation email:', emailError);
        // Log the error but don't fail the invitation
        // Return success but notify that email failed
        return new Response(
          JSON.stringify({ 
            success: true, 
            member: newMember,
            warning: 'Team member added but email notification failed to send',
            emailError: emailError.message
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (error) {
      console.error('Exception sending invitation email:', error);
      // Continue anyway
    }

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
