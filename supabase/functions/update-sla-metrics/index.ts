import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { businessId } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Calculate average response time from conversations
    const { data: conversations, error: convError } = await supabase
      .from("conversations")
      .select("started_at, ended_at")
      .eq("business_id", businessId)
      .not("ended_at", "is", null)
      .order("started_at", { ascending: false })
      .limit(50);

    if (convError) throw convError;

    if (conversations && conversations.length > 0) {
      const responseTimes = conversations.map((conv) => {
        const start = new Date(conv.started_at).getTime();
        const end = new Date(conv.ended_at).getTime();
        return (end - start) / 1000; // Convert to seconds
      });

      const avgResponseTime = Math.floor(
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      );

      // Update business with average response time
      const { error: updateError } = await supabase
        .from("businesses")
        .update({ average_response_time_seconds: avgResponseTime })
        .eq("id", businessId);

      if (updateError) throw updateError;

      console.log(`Updated SLA metrics for business ${businessId}: ${avgResponseTime}s avg response time`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          averageResponseTime: avgResponseTime 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "No conversations to analyze" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error updating SLA metrics:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});