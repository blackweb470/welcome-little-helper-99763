import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-visitor-id',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, successUrl } = await req.json().catch(() => ({}));

    // Validate minimum deposit amount ($5.00)
    const depositAmount = Math.max(5, parseFloat(amount) || 5);
    const amountInCents = Math.round(depositAmount * 100);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized: Missing authorization header' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const polarAccessToken = Deno.env.get('POLAR_ACCESS_TOKEN');
    const polarProductId = Deno.env.get('POLAR_PRODUCT_ID');

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ success: false, error: 'User not authenticated' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!polarAccessToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'POLAR_ACCESS_TOKEN is not configured on Supabase' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const polarApiUrl = Deno.env.get('POLAR_API_URL') || 'https://api.polar.sh';

    // 1. Try modern products array payload with custom deposit amount
    let response = await fetch(`${polarApiUrl}/v1/checkouts/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${polarAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        products: polarProductId ? [polarProductId] : [],
        amount: amountInCents,
        customer_email: user.email || undefined,
        metadata: {
          user_id: user.id,
          deposit_amount: depositAmount,
        },
        success_url: successUrl || `${req.headers.get('origin') || 'https://buy.polar.sh'}/dashboard?tab=billing&deposit=success`,
      }),
    });

    let resText = await response.text();
    let checkoutData: any = {};
    try { checkoutData = JSON.parse(resText); } catch (_) { }

    // 2. Retry with legacy custom endpoint if needed
    if (!response.ok && polarProductId) {
      const retryResp = await fetch(`${polarApiUrl}/v1/checkouts/custom/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${polarAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_price_id: polarProductId,
          amount: amountInCents,
          customer_email: user.email || undefined,
          metadata: {
            user_id: user.id,
            deposit_amount: depositAmount,
          },
          success_url: successUrl || `${req.headers.get('origin') || 'https://buy.polar.sh'}/dashboard?tab=billing&deposit=success`,
        }),
      });

      const retryText = await retryResp.text();
      let retryData: any = {};
      try { retryData = JSON.parse(retryText); } catch (_) { }

      if (retryResp.ok && retryData.url) {
        response = retryResp;
        resText = retryText;
        checkoutData = retryData;
      }
    }

    const foundUrl = checkoutData.url || checkoutData.checkout_url || checkoutData.checkoutUrl || checkoutData.data?.url || checkoutData.data?.checkout_url;

    if (response.ok && foundUrl) {
      return new Response(JSON.stringify({ checkoutUrl: foundUrl, url: foundUrl, success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let errorDetail = checkoutData?.detail?.[0]?.msg || checkoutData?.detail || checkoutData?.error_description || checkoutData?.error || resText;
    if (typeof errorDetail === 'object') {
      errorDetail = JSON.stringify(errorDetail);
    }
    
    console.error('Polar checkout creation error:', response.status, resText);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: `Polar API Error (${response.status}): ${errorDetail}`, 
      rawResponse: resText,
      statusCode: response.status
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error creating checkout:', error);
    return new Response(JSON.stringify({ success: false, error: error.message || 'Internal Edge Function Error' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
