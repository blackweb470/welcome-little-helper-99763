import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { businessId, code } = await req.json();

    if (!code) {
      throw new Error('No code provided from Meta signup');
    }

    const appId = Deno.env.get('VITE_META_APP_ID');
    const appSecret = Deno.env.get('META_APP_SECRET');

    if (!appId || !appSecret) {
      console.error('Meta App credentials missing:', { hasAppId: !!appId, hasSecret: !!appSecret });
      throw new Error('Meta App credentials not configured in Edge Functions');
    }

    console.log('Exchanging code for access token for business:', businessId);

    // 1. Exchange code for access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${code}`
    );

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      console.error('Meta token exchange error:', tokenData.error);
      throw new Error(`Meta token exchange failed: ${tokenData.error.message}`);
    }

    const accessToken = tokenData.access_token;

    // 2. Get WABA ID (WhatsApp Business Account)
    const appAccessToken = `${appId}|${appSecret}`;
    const debugTokenResponse = await fetch(
      `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${appAccessToken}`
    );
    const debugData = await debugTokenResponse.json();
    
    console.log('Debug token data:', JSON.stringify(debugData));

    let wabaId = null;
    
    if (debugData.data?.granular_scopes) {
      const wabaScope = debugData.data.granular_scopes.find((s: any) => s.scope === 'whatsapp_business_management');
      if (wabaScope && wabaScope.target_ids && wabaScope.target_ids.length > 0) {
        wabaId = wabaScope.target_ids[0];
      }
    }

    if (!wabaId) {
      console.error('Failed to find WABA ID in granular scopes. Debug data:', JSON.stringify(debugData.data));
      throw new Error('No WhatsApp Business Accounts found in your login session. Please ensure you select or create one during the popup.');
    }

    // 3. Get Phone Number ID
    const phoneNumbersResponse = await fetch(
      `https://graph.facebook.com/v19.0/${wabaId}/phone_numbers?access_token=${accessToken}`
    );
    const phonesData = await phoneNumbersResponse.json();

    if (!phonesData.data || phonesData.data.length === 0) {
      throw new Error('No phone numbers found in the WhatsApp Business Account');
    }

    // We take the first verified number
    const phoneNumber = phonesData.data[0].display_phone_number;
    const phoneNumberId = phonesData.data[0].id;

    console.log('Successfully retrieved Meta data:', {
      wabaId,
      phoneNumberId,
      phoneNumber
    });

    // 4. Save to database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate a unique verify token for this business
    const verifyToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const { error: dbError } = await supabase
      .from('whatsapp_settings')
      .upsert({
        business_id: businessId,
        access_token: accessToken,
        waba_id: wabaId,
        phone_number_id: phoneNumberId,
        phone_number: phoneNumber,
        verify_token: verifyToken,
        connection_method: 'embedded_signup',
        enabled: true,
        updated_at: new Date().toISOString()
      });

    if (dbError) {
      console.error('Database error saving settings:', dbError);
      throw dbError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        phoneNumber,
        phoneNumberId 
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Embedded signup error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
