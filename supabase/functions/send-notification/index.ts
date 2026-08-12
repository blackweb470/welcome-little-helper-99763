import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-visitor-id",
};

const NotificationRequestSchema = z.object({
  type: z.enum(['chat_transfer', 'new_message', 'ticket_created', 'ticket_resolved', 'agent_accepted', 'team_member_removed']),
  businessId: z.string().uuid("Invalid business ID format"),
  data: z.object({
    conversationId: z.string().uuid("Invalid conversation ID format").optional(),
    ticketId: z.string().uuid("Invalid ticket ID format").optional(),
    visitorId: z.string().max(255).optional(),
    visitorEmail: z.string().email("Invalid email format").optional(),
    message: z.string().max(5000).optional(),
    agentEmail: z.string().email("Invalid email format").optional(),
    agentName: z.string().optional(),
    userEmail: z.string().email("Invalid email format").optional(),
    businessName: z.string().optional(),
  }),
});

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate input
    const validation = NotificationRequestSchema.safeParse(body);
    if (!validation.success) {
      console.error("Validation error:", validation.error);
      return new Response(
        JSON.stringify({ error: "Invalid input", details: validation.error.issues }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { type, businessId, data } = validation.data;

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get business owner email
    const { data: business, error: businessError } = await supabaseClient
      .from("businesses")
      .select("owner_id, name")
      .eq("id", businessId)
      .single();

    if (businessError || !business) {
      console.error("Error fetching business:", businessError);
      return new Response(
        JSON.stringify({ error: "Business not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get owner's email
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("email")
      .eq("id", business.owner_id)
      .single();

    const ownerEmail = profile?.email || data.agentEmail;
    
    if (!ownerEmail) {
      console.error("No email found for notification");
      return new Response(
        JSON.stringify({ error: "No email found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize business name for HTML
    const sanitizedBusinessName = business.name.replace(/[<>]/g, '');
    
    let subject = "";
    let html = "";
    let recipientEmail = ownerEmail; // Default to owner

    const createNotificationEmail = (title: string, contentHtml: string) => `
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
      .data-box {
        border: 0.5px solid #222;
        padding: 24px;
        margin-bottom: 40px;
      }
      .data-label {
        font-size: 10px;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        color: #505050;
        margin-bottom: 8px;
        display: block;
      }
      .data-value {
        font-size: 13px;
        color: #f0f0f0;
        display: block;
        margin-bottom: 16px;
      }
      .data-value:last-child {
        margin-bottom: 0;
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
        <div class="corner-mark">Notification</div>
        <div class="logo">Lyqn.</div>
        <div class="tagline">System Alert</div>
        <div class="index-num">01 / 01</div>
      </div>
      <div class="email-body">
        <p class="greeting">Update —</p>
        <h1 class="headline">${title}</h1>
        <div class="body-text">
          ${contentHtml}
        </div>
        <hr class="divider">
        <p class="footnote">
          This is an automated system notification from your Lyqn workspace.
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

    switch (type) {
      case 'agent_accepted':
        recipientEmail = data.visitorEmail || '';
        if (!recipientEmail) {
          return new Response(
            JSON.stringify({ error: 'No visitor email provided' }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        subject = `✅ Agent Joined Your Chat - ${sanitizedBusinessName}`;
        html = createNotificationEmail('Chat Accepted', `
          <p>Your chat request has been accepted by <strong style="color: #f0f0f0;">${data.agentName || 'our team'}</strong>.</p>
          <p>You can now continue your conversation.</p>
          <div class="data-box">
            <span class="data-label">Conversation ID</span>
            <span class="data-value">${data.conversationId || 'N/A'}</span>
          </div>
          <p>Please return to the chat window to continue.</p>
        `);
        break;

      case 'chat_transfer':
        subject = `🔔 Live Chat Transfer Request - ${sanitizedBusinessName}`;
        html = createNotificationEmail('New Live Chat Transfer', `
          <p>A visitor has requested to speak with a live agent.</p>
          <div class="data-box">
            <span class="data-label">Conversation ID</span>
            <span class="data-value">${data.conversationId || 'N/A'}</span>
            
            <span class="data-label">Visitor ID</span>
            <span class="data-value">${data.visitorId || 'N/A'}</span>
            
            ${data.visitorEmail ? `
              <span class="data-label">Visitor Email</span>
              <span class="data-value">${data.visitorEmail}</span>
            ` : ''}
            
            ${data.message ? `
              <span class="data-label">Reason</span>
              <span class="data-value">${data.message.substring(0, 500)}</span>
            ` : ''}
          </div>
          <p>Please log in to your dashboard to accept this chat.</p>
        `);
        break;

      case 'new_message':
        subject = `💬 New Message - ${sanitizedBusinessName}`;
        html = createNotificationEmail('New Message Received', `
          <div class="data-box">
            <p style="font-style: italic; color: #f0f0f0; margin: 0; font-size: 14px;">"${data.message ? data.message.substring(0, 500) : 'No message content'}"</p>
          </div>
          <span class="data-label">Conversation ID</span>
          <span class="data-value">${data.conversationId || 'N/A'}</span>
        `);
        break;

      case 'ticket_created':
        subject = `🎫 New Support Ticket - ${sanitizedBusinessName}`;
        html = createNotificationEmail('New Support Ticket Created', `
          <div class="data-box">
            <span class="data-label">Ticket ID</span>
            <span class="data-value">${data.ticketId || 'N/A'}</span>
            
            ${data.message ? `
              <span class="data-label">Details</span>
              <span class="data-value">${data.message.substring(0, 500)}</span>
            ` : ''}
          </div>
        `);
        break;

      case 'ticket_resolved':
        subject = `✅ Ticket Resolved - ${sanitizedBusinessName}`;
        html = createNotificationEmail('Support Ticket Resolved', `
          <p>Your support ticket has been marked as resolved.</p>
          <div class="data-box">
            <span class="data-label">Ticket ID</span>
            <span class="data-value" style="margin-bottom: 0;">${data.ticketId || 'N/A'}</span>
          </div>
        `);
        break;

      case 'team_member_removed':
        recipientEmail = data.userEmail || '';
        if (!recipientEmail) {
          return new Response(
            JSON.stringify({ error: 'No user email provided' }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        subject = `⚠️ Team Access Removed - ${data.businessName || sanitizedBusinessName}`;
        html = createNotificationEmail('Access Revoked', `
          <p>You have been removed from the team at <strong style="color: #f0f0f0;">${data.businessName || sanitizedBusinessName}</strong>.</p>
          <p>Your access to the business dashboard and all related features has been revoked.</p>
          <div class="data-box" style="border-color: #3f1515;">
            <p style="color: #a35d5d; margin: 0;">If you believe this was done in error, please contact the business owner directly.</p>
          </div>
          <p>Thank you for your contributions to the team.</p>
        `);
        break;

      default:
        return new Response(
          JSON.stringify({ error: "Invalid notification type" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const emailResponse = await resend.emails.send({
      from: "AI Chat Support <support@lyqn.app>",
      to: [recipientEmail],
      subject: subject,
      html: html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
