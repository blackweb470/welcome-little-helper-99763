import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const requestSchema = z.object({
  visitorId: z.string().min(1).max(200),
  businessId: z.string().uuid({ message: "Invalid businessId format" })
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { visitorId, businessId } = requestSchema.parse(body);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get visitor session data
    const { data: session, error: sessionError } = await supabase
      .from("visitor_sessions")
      .select("engagement_score, conversion_likelihood, page_views")
      .eq("visitor_id", visitorId)
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (sessionError) throw sessionError;

    // Get products for this business
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*")
      .eq("business_id", businessId)
      .eq("stock_status", "in_stock")
      .limit(5);

    if (productsError) throw productsError;

    // Simple recommendation logic based on engagement score
    let recommendedProducts = products;
    if (session.engagement_score >= 70) {
      // High engagement: show premium products
      recommendedProducts = products.sort((a, b) => b.price - a.price);
    } else if (session.engagement_score >= 40) {
      // Medium engagement: show mid-range products
      recommendedProducts = products;
    } else {
      // Low engagement: show entry-level products
      recommendedProducts = products.sort((a, b) => a.price - b.price);
    }

    console.log(`Generated ${recommendedProducts.length} recommendations for visitor ${visitorId}`);

    return new Response(
      JSON.stringify({
        recommendations: recommendedProducts,
        engagementScore: session.engagement_score,
        conversionLikelihood: session.conversion_likelihood
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating recommendations:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});