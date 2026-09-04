import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const resendKey = Deno.env.get("RESEND_API_KEY") || Deno.env.get("RESEND_KEY") || "";
const resend = new Resend(resendKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-visitor-id",
};

const NotificationRequestSchema = z.object({
  type: z.string(),
  businessId: z.string().optional().nullable(),
  data: z.object({
    conversationId: z.string().optional().nullable(),
    ticketId: z.string().optional().nullable(),
    visitorId: z.string().optional().nullable(),
    visitorEmail: z.string().optional().nullable(),
    message: z.string().optional().nullable(),
    agentEmail: z.string().optional().nullable(),
    agentName: z.string().optional().nullable(),
    userEmail: z.string().optional().nullable(),
    businessName: z.string().optional().nullable(),
    amount: z.number().optional().nullable(),
    newBalance: z.number().optional().nullable(),
    description: z.string().optional().nullable(),
    subject: z.string().optional().nullable(),
    customTitle: z.string().optional().nullable(),
    actionText: z.string().optional().nullable(),
    actionUrl: z.string().optional().nullable(),
  }).passthrough(),
}).passthrough();

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate input
    const validation = NotificationRequestSchema.safeParse(body);
    if (!validation.success) {
      const issueSummary = validation.error.issues.map((i: any) => `${i.path.join('.')}: ${i.message}`).join(', ');
      console.error("Validation error:", validation.error);
      return new Response(
        JSON.stringify({ error: `Invalid input: ${issueSummary}`, details: validation.error.issues }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { type, businessId, data } = validation.data;

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    let ownerEmail = data.userEmail || data.agentEmail || "";
    let sanitizedBusinessName = data.businessName || "LYQN AI";

    if (businessId) {
      const { data: business } = await supabaseClient
        .from("businesses")
        .select("owner_id, name")
        .eq("id", businessId)
        .maybeSingle();

      if (business) {
        sanitizedBusinessName = business.name.replace(/[<>]/g, '');
        const { data: profile } = await supabaseClient
          .from("profiles")
          .select("email")
          .eq("id", business.owner_id)
          .maybeSingle();
        if (profile?.email) ownerEmail = profile.email;
      }
    }

    if (!ownerEmail && !data.userEmail) {
      console.error("No email recipient found for notification");
      return new Response(
        JSON.stringify({ error: "No email found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let subject = "";
    let html = "";
    let recipientEmail = ownerEmail; // Default to recipient

    const createNotificationEmail = (title: string, contentHtml: string) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        background-color: #f1f5f9;
        padding: 48px 16px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        color: #334155;
        -webkit-font-smoothing: antialiased;
      }
      .email-card {
        max-width: 600px;
        margin: 0 auto;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.05);
        overflow: hidden;
      }
      .email-header {
        padding: 36px 48px 28px;
        border-bottom: 1px solid #f1f5f9;
        background: #ffffff;
      }
      .brand-badge {
        display: inline-block;
        font-size: 18px;
        font-weight: 800;
        color: #4f46e5;
        letter-spacing: -0.5px;
      }
      .brand-badge span {
        color: #0f172a;
      }
      .email-body {
        padding: 40px 48px;
      }
      .headline {
        font-size: 24px;
        font-weight: 700;
        color: #0f172a;
        line-height: 1.3;
        margin-bottom: 20px;
        letter-spacing: -0.4px;
      }
      .body-text {
        font-size: 15px;
        line-height: 1.7;
        color: #334155;
      }
      .data-box {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 24px;
        margin: 28px 0;
      }
      .data-row {
        margin-bottom: 16px;
      }
      .data-row:last-child {
        margin-bottom: 0;
      }
      .data-label {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: #64748b;
        margin-bottom: 4px;
        display: block;
      }
      .data-value {
        font-size: 15px;
        font-weight: 600;
        color: #0f172a;
        display: block;
        word-break: break-word;
      }
      .divider {
        border: none;
        border-top: 1px solid #f1f5f9;
        margin: 32px 0 24px;
      }
      .footnote {
        font-size: 13px;
        color: #64748b;
        line-height: 1.6;
      }
      .email-footer {
        padding: 28px 48px;
        background: #f8fafc;
        border-top: 1px solid #f1f5f9;
        font-size: 12px;
        color: #94a3b8;
        text-align: center;
        line-height: 1.6;
      }
    </style>
  </head>
  <body>
    <div class="email-card">
      <div class="email-header">
        <div class="brand-badge">Lyqn <span>AI</span></div>
      </div>
      <div class="email-body">
        <h1 class="headline">${title}</h1>
        <div class="body-text">
          ${contentHtml}
        </div>
        <hr class="divider">
        <p class="footnote">
          This automated message was sent from your <strong>${sanitizedBusinessName}</strong> workspace.
        </p>
      </div>
      <div class="email-footer">
        © ${new Date().getFullYear()} Lyqn AI • All rights reserved
      </div>
    </div>
  </body>
</html>
    `;

    switch (type) {
      case 'welcome':
      case 'account_created':
        recipientEmail = data.userEmail || ownerEmail;
        subject = `👋 Welcome to ${sanitizedBusinessName}`;
        html = createNotificationEmail('Welcome to Lyqn AI', `
          <p>Your workspace account has been successfully created.</p>
          <p style="margin-top: 12px;">You now have full access to configure your AI assistant, manage widget settings, and invite live chat agents.</p>
          <div class="data-box" style="background: #f0fdf4; border-color: #bbf7d0;">
            <div class="data-row">
              <span class="data-label" style="color: #166534;">Account Email</span>
              <span class="data-value" style="color: #0f172a;">${recipientEmail}</span>
            </div>
            <div class="data-row">
              <span class="data-label" style="color: #166534;">Included Starter Credits</span>
              <span class="data-value" style="color: #16a34a; font-size: 18px;">$5.00 USD Free Credits</span>
            </div>
          </div>
          <p style="margin-top: 28px; text-align: center;">
            <a href="https://lyqn.app/auth" style="display: inline-block; background: #4f46e5; color: #ffffff; padding: 14px 32px; font-weight: 600; text-decoration: none; border-radius: 10px; font-size: 14px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);">Log In to Your Workspace</a>
          </p>
        `);
        break;

      case 'agent_accepted':
        recipientEmail = data.visitorEmail || '';
        if (!recipientEmail) {
          return new Response(
            JSON.stringify({ error: 'No visitor email provided' }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        subject = `✅ Agent Joined Your Chat - ${sanitizedBusinessName}`;
        html = createNotificationEmail('Agent Joined Your Chat', `
          <p>Your live chat request has been accepted by <strong style="color: #0f172a;">${data.agentName || 'our team member'}</strong>.</p>
          <p style="margin-top: 8px;">You can now switch back to your chat window to continue the discussion.</p>
          <div class="data-box">
            <div class="data-row">
              <span class="data-label">Conversation Reference</span>
              <span class="data-value">${data.conversationId || 'N/A'}</span>
            </div>
          </div>
        `);
        break;

      case 'chat_transfer':
        subject = `🔔 Live Chat Transfer Request - ${sanitizedBusinessName}`;
        html = createNotificationEmail('Live Chat Transfer Request', `
          <p>A visitor has requested live support from an agent.</p>
          <div class="data-box">
            <div class="data-row">
              <span class="data-label">Conversation ID</span>
              <span class="data-value">${data.conversationId || 'N/A'}</span>
            </div>
            <div class="data-row">
              <span class="data-label">Visitor ID</span>
              <span class="data-value">${data.visitorId || 'N/A'}</span>
            </div>
            ${data.visitorEmail ? `
              <div class="data-row">
                <span class="data-label">Visitor Email</span>
                <span class="data-value">${data.visitorEmail}</span>
              </div>
            ` : ''}
            ${data.message ? `
              <div class="data-row">
                <span class="data-label">Reason / Notes</span>
                <span class="data-value" style="font-weight: 400;">${data.message.substring(0, 500)}</span>
              </div>
            ` : ''}
          </div>
          <p style="margin-top: 24px; text-align: center;">
            <a href="https://lyqn.app/dashboard" style="display: inline-block; background: #4f46e5; color: #ffffff; padding: 14px 32px; font-weight: 600; text-decoration: none; border-radius: 10px; font-size: 14px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);">Open Live Chat Dashboard</a>
          </p>
        `);
        break;

      case 'new_message':
        subject = `💬 New Message - ${sanitizedBusinessName}`;
        html = createNotificationEmail('New Customer Message', `
          <div class="data-box" style="background: #f8fafc; border-left: 4px solid #4f46e5;">
            <span class="data-label">Message Preview</span>
            <p style="font-style: italic; color: #0f172a; margin-top: 4px; font-size: 15px; line-height: 1.6;">"${data.message ? data.message.substring(0, 500) : 'No message content'}"</p>
          </div>
          <div class="data-box">
            <div class="data-row">
              <span class="data-label">Conversation ID</span>
              <span class="data-value">${data.conversationId || 'N/A'}</span>
            </div>
          </div>
        `);
        break;

      case 'ticket_created':
        subject = `🎫 New Support Ticket - ${sanitizedBusinessName}`;
        html = createNotificationEmail('New Support Ticket Created', `
          <p>A new support ticket has been submitted to your workspace.</p>
          <div class="data-box">
            <div class="data-row">
              <span class="data-label">Ticket Reference ID</span>
              <span class="data-value">${data.ticketId || 'N/A'}</span>
            </div>
            ${data.message ? `
              <div class="data-row">
                <span class="data-label">Ticket Summary</span>
                <span class="data-value" style="font-weight: 400;">${data.message.substring(0, 500)}</span>
              </div>
            ` : ''}
          </div>
        `);
        break;

      case 'ticket_resolved':
        subject = `✅ Support Ticket Resolved - ${sanitizedBusinessName}`;
        html = createNotificationEmail('Support Ticket Resolved', `
          <p>Your support ticket has been officially marked as resolved.</p>
          <div class="data-box">
            <div class="data-row">
              <span class="data-label">Ticket Reference ID</span>
              <span class="data-value">${data.ticketId || 'N/A'}</span>
            </div>
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
        subject = `⚠️ Team Access Revoked - ${data.businessName || sanitizedBusinessName}`;
        html = createNotificationEmail('Team Access Revoked', `
          <p>Your access to <strong style="color: #0f172a;">${data.businessName || sanitizedBusinessName}</strong> has been updated.</p>
          <div class="data-box" style="background: #fef2f2; border-color: #fecaca;">
            <p style="color: #991b1b; margin: 0; font-size: 14px; line-height: 1.6;">You have been removed from this workspace team. If you have questions, please contact the workspace owner directly.</p>
          </div>
        `);
        break;

      case 'wallet_depleted':
        subject = `⚠️ Action Required: Credit Wallet Depleted - ${sanitizedBusinessName}`;
        html = createNotificationEmail('Credit Balance Depleted', `
          <p>Your credit wallet balance for <strong>${sanitizedBusinessName}</strong> is now <strong style="color: #dc2626;">$0.00</strong>.</p>
          <p style="margin-top: 8px;">Your AI assistant has been temporarily paused and will resume automatically once credits are added.</p>
          <div class="data-box" style="background: #fef2f2; border-color: #fecaca;">
            <div class="data-row">
              <span class="data-label" style="color: #991b1b;">Current Balance</span>
              <span class="data-value" style="color: #dc2626; font-size: 20px; font-weight: 700;">$0.00 USD</span>
            </div>
          </div>
          <p style="margin-top: 28px; text-align: center;">
            <a href="https://lyqn.app/dashboard?tab=billing" style="display: inline-block; background: #dc2626; color: #ffffff; padding: 14px 32px; font-weight: 600; text-decoration: none; border-radius: 10px; font-size: 14px; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25);">Refill Wallet Credits ($5.00)</a>
          </p>
        `);
        break;

      case 'low_balance':
        subject = `🔔 Low Credit Balance Alert - ${sanitizedBusinessName}`;
        html = createNotificationEmail('Low Credit Balance Alert', `
          <p>Your credit wallet balance is running low.</p>
          <div class="data-box" style="background: #fffbeb; border-color: #fde68a;">
            <div class="data-row">
              <span class="data-label" style="color: #92400e;">Remaining Credit Balance</span>
              <span class="data-value" style="color: #d97706; font-size: 20px; font-weight: 700;">$${data.message || '1.50'} USD</span>
            </div>
          </div>
          <p style="margin-top: 28px; text-align: center;">
            <a href="https://lyqn.app/dashboard?tab=billing" style="display: inline-block; background: #4f46e5; color: #ffffff; padding: 14px 32px; font-weight: 600; text-decoration: none; border-radius: 10px; font-size: 14px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);">Top Up Wallet Credits</a>
          </p>
        `);
        break;

      case 'credit_bonus':
        recipientEmail = data.userEmail || ownerEmail;
        subject = `🎉 You've Received a $${(data.amount || 0).toFixed(2)} Credit Bonus!`;
        html = createNotificationEmail('Wallet Credit Bonus Granted', `
          <p>Great news! A bonus of <strong style="color: #16a34a;">+$${(data.amount || 0).toFixed(2)} USD</strong> has been added to your credit wallet.</p>
          <div class="data-box" style="background: #f0fdf4; border-color: #bbf7d0;">
            <div class="data-row">
              <span class="data-label" style="color: #166534;">Granted Credit Amount</span>
              <span class="data-value" style="color: #16a34a; font-size: 22px; font-weight: 700;">+$${(data.amount || 0).toFixed(2)} USD</span>
            </div>
            <div class="data-row">
              <span class="data-label" style="color: #166534;">Updated Available Balance</span>
              <span class="data-value" style="color: #0f172a; font-size: 16px; font-weight: 600;">$${(data.newBalance || 0).toFixed(2)} USD</span>
            </div>
            <div class="data-row">
              <span class="data-label" style="color: #166534;">Description / Reason</span>
              <span class="data-value" style="color: #334155; font-weight: 500;">${data.description || 'Admin Promotional Credit Bonus'}</span>
            </div>
          </div>
          <p style="margin-top: 12px;">Your credits do not expire and are ready for immediate use across your workspace.</p>
          <p style="margin-top: 28px; text-align: center;">
            <a href="https://lyqn.app/dashboard?tab=billing" style="display: inline-block; background: #16a34a; color: #ffffff; padding: 14px 32px; font-weight: 600; text-decoration: none; border-radius: 10px; font-size: 14px; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.25);">View Wallet Dashboard</a>
          </p>
        `);
        break;

      case 'custom_email':
        recipientEmail = data.userEmail || ownerEmail;
        subject = data.subject || `Announcement from ${sanitizedBusinessName}`;
        html = createNotificationEmail(
          data.customTitle || data.subject || 'Important Announcement',
          `
            <div style="font-size: 15px; line-height: 1.7; color: #334155; white-space: pre-wrap; margin-bottom: 24px;">
              ${(data.message || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>')}
            </div>
            ${
              data.actionUrl && data.actionText
                ? `<p style="margin-top: 28px; text-align: center;">
                    <a href="${data.actionUrl}" style="display: inline-block; background: #4f46e5; color: #ffffff; padding: 14px 32px; font-weight: 600; text-decoration: none; border-radius: 10px; font-size: 14px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);">${data.actionText}</a>
                  </p>`
                : ''
            }
          `
        );
        break;

      default:
        return new Response(
          JSON.stringify({ error: "Invalid notification type" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPass = Deno.env.get("SMTP_PASS") || Deno.env.get("SMTP_PASSWORD");
    const emailFrom = Deno.env.get("EMAIL_FROM") || Deno.env.get("SMTP_FROM") || "LYQN AI <hello@lyqn.app>";

    let emailResponse: any;

    if (smtpHost && smtpUser && smtpPass) {
      try {
        const { SMTPClient } = await import("https://deno.land/x/bootstrap_smtp@v0.7.0/mod.ts");
        const client = new SMTPClient({
          connection: {
            hostname: smtpHost,
            port: parseInt(Deno.env.get("SMTP_PORT") || "465"),
            tls: true,
            auth: { username: smtpUser, password: smtpPass },
          },
        });

        await client.send({
          from: emailFrom,
          to: recipientEmail,
          subject: subject,
          content: "Please view this email in an HTML-enabled mail client.",
          html: html,
        });

        await client.close();
        emailResponse = { provider: "smtp", status: "sent", recipient: recipientEmail };
      } catch (smtpErr: any) {
        console.warn("SMTP sending failed, trying Resend API:", smtpErr);
        let resendResult = await resend.emails.send({
          from: emailFrom,
          to: [recipientEmail],
          subject: subject,
          html: html,
        });

        if (resendResult?.error) {
          console.warn("Resend primary sender error, trying onboarding fallback:", resendResult.error);
          resendResult = await resend.emails.send({
            from: "LYQN AI <onboarding@resend.dev>",
            to: [recipientEmail],
            subject: subject,
            html: html,
          });
        }

        if (resendResult?.error) {
          throw new Error(`Email Delivery Error: ${resendResult.error.message || JSON.stringify(resendResult.error)}`);
        }

        emailResponse = resendResult;
      }
    } else {
      let resendResult = await resend.emails.send({
        from: emailFrom,
        to: [recipientEmail],
        subject: subject,
        html: html,
      });

      if (resendResult?.error) {
        const primaryErrorMsg = resendResult.error.message || JSON.stringify(resendResult.error);
        console.warn("Resend primary sender error:", primaryErrorMsg);

        if (emailFrom !== "LYQN AI <onboarding@resend.dev>") {
          const fallbackResult = await resend.emails.send({
            from: "LYQN AI <onboarding@resend.dev>",
            to: [recipientEmail],
            subject: subject,
            html: html,
          });

          if (!fallbackResult?.error) {
            resendResult = fallbackResult;
          } else {
            console.warn("Resend fallback sender error:", fallbackResult.error);
          }
        }
      }

      if (resendResult?.error) {
        const errorMsg = resendResult.error.message || JSON.stringify(resendResult.error);
        console.error("Resend delivery failed:", errorMsg);
        return new Response(
          JSON.stringify({
            success: false,
            error: `Resend Error (${emailFrom}): ${errorMsg}. Note: Verify lyqn.app in Resend Dashboard (resend.com/domains) to deliver to all user email addresses.`,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      emailResponse = resendResult;
    }

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
      JSON.stringify({ success: false, error: error.message || "Failed to deliver email" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
