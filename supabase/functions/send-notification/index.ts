import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const NotificationRequestSchema = z.object({
  type: z.enum(['chat_transfer', 'new_message', 'ticket_created', 'ticket_resolved', 'agent_accepted']),
  businessId: z.string().uuid("Invalid business ID format"),
  data: z.object({
    conversationId: z.string().uuid("Invalid conversation ID format").optional(),
    ticketId: z.string().uuid("Invalid ticket ID format").optional(),
    visitorId: z.string().max(255).optional(),
    visitorEmail: z.string().email("Invalid email format").optional(),
    message: z.string().max(5000).optional(),
    agentEmail: z.string().email("Invalid email format").optional(),
    agentName: z.string().optional(),
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

    switch (type) {
      case 'agent_accepted':
        // Send to visitor when agent accepts
        recipientEmail = data.visitorEmail || '';
        if (!recipientEmail) {
          console.error('No visitor email provided for agent_accepted notification');
          return new Response(
            JSON.stringify({ error: 'No visitor email provided' }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        subject = `✅ Agent Joined Your Chat - ${sanitizedBusinessName}`;
        html = `
          <h1>An agent has joined your chat!</h1>
          <p>Your chat request has been accepted by ${data.agentName || 'our team'}.</p>
          <p>You can now continue your conversation.</p>
          <p><strong>Conversation ID:</strong> ${data.conversationId || 'N/A'}</p>
          <p>Please return to the chat window to continue.</p>
        `;
        break;

      case 'chat_transfer':
        subject = `🔔 Live Chat Transfer Request - ${sanitizedBusinessName}`;
        html = `
          <h1>New Live Chat Transfer</h1>
          <p>A visitor has requested to speak with a live agent.</p>
          <p><strong>Conversation ID:</strong> ${data.conversationId || 'N/A'}</p>
          <p><strong>Visitor ID:</strong> ${data.visitorId || 'N/A'}</p>
          ${data.visitorEmail ? `<p><strong>Visitor Email:</strong> ${data.visitorEmail}</p>` : ''}
          ${data.message ? `<p><strong>Reason:</strong> ${data.message.substring(0, 500)}</p>` : ''}
          <p>Please log in to your dashboard to accept this chat.</p>
        `;
        break;

      case 'new_message':
        subject = `💬 New Message - ${sanitizedBusinessName}`;
        html = `
          <h1>New Message Received</h1>
          <p>${data.message ? data.message.substring(0, 500) : 'No message content'}</p>
          <p><strong>Conversation ID:</strong> ${data.conversationId || 'N/A'}</p>
        `;
        break;

      case 'ticket_created':
        subject = `🎫 New Support Ticket - ${sanitizedBusinessName}`;
        html = `
          <h1>New Support Ticket Created</h1>
          <p><strong>Ticket ID:</strong> ${data.ticketId || 'N/A'}</p>
          ${data.message ? `<p><strong>Details:</strong> ${data.message.substring(0, 500)}</p>` : ''}
        `;
        break;

      case 'ticket_resolved':
        subject = `✅ Ticket Resolved - ${sanitizedBusinessName}`;
        html = `
          <h1>Support Ticket Resolved</h1>
          <p><strong>Ticket ID:</strong> ${data.ticketId || 'N/A'}</p>
        `;
        break;

      default:
        return new Response(
          JSON.stringify({ error: "Invalid notification type" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const emailResponse = await resend.emails.send({
      from: "AI Chat Support <onboarding@resend.dev>",
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
