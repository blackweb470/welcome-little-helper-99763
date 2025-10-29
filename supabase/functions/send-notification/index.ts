import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: 'chat_transfer' | 'new_message' | 'ticket_created' | 'ticket_resolved';
  businessId: string;
  data: {
    conversationId?: string;
    ticketId?: string;
    visitorId?: string;
    message?: string;
    agentEmail?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, businessId, data }: NotificationRequest = await req.json();

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

    let subject = "";
    let html = "";

    switch (type) {
      case 'chat_transfer':
        subject = `🔔 Live Chat Transfer Request - ${business.name}`;
        html = `
          <h1>New Live Chat Transfer</h1>
          <p>A visitor has requested to speak with a live agent.</p>
          <p><strong>Conversation ID:</strong> ${data.conversationId}</p>
          <p><strong>Visitor ID:</strong> ${data.visitorId}</p>
          ${data.message ? `<p><strong>Reason:</strong> ${data.message}</p>` : ''}
          <p>Please log in to your dashboard to accept this chat.</p>
        `;
        break;

      case 'new_message':
        subject = `💬 New Message - ${business.name}`;
        html = `
          <h1>New Message Received</h1>
          <p>${data.message}</p>
          <p><strong>Conversation ID:</strong> ${data.conversationId}</p>
        `;
        break;

      case 'ticket_created':
        subject = `🎫 New Support Ticket - ${business.name}`;
        html = `
          <h1>New Support Ticket Created</h1>
          <p><strong>Ticket ID:</strong> ${data.ticketId}</p>
          ${data.message ? `<p><strong>Details:</strong> ${data.message}</p>` : ''}
        `;
        break;

      case 'ticket_resolved':
        subject = `✅ Ticket Resolved - ${business.name}`;
        html = `
          <h1>Support Ticket Resolved</h1>
          <p><strong>Ticket ID:</strong> ${data.ticketId}</p>
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
      to: [ownerEmail],
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
