import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId } = await req.json();

    // Check if user already has a subscription
    const { data: existing } = await supabaseClient
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      return new Response(
        JSON.stringify({ message: 'Subscription already exists' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Create free trial subscription (30 days)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    const { data, error } = await supabaseClient
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        plan_name: 'basic',
        trial_ends_at: trialEndsAt.toISOString(),
        expires_at: trialEndsAt.toISOString(),
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    console.log('Free trial created for user:', userId);

    return new Response(
      JSON.stringify({ success: true, subscription: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error creating free trial:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
