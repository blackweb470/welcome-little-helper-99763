import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';
import postgres from 'https://deno.land/x/postgres@v0.17.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-visitor-id',
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Run self-healing database migration to ensure Twilio columns exist
  try {
    const databaseUrl = Deno.env.get('DATABASE_URL');
    if (databaseUrl) {
      const sql = postgres(databaseUrl);
      await sql`
        ALTER TABLE public.whatsapp_settings 
        ADD COLUMN IF NOT EXISTS refresh_token TEXT DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
      `;
      // Close connection
      await sql.end();
      console.log('Self-healing database columns verified.');
    } else {
      console.warn('DATABASE_URL is not set, skipping self-healing columns verify.');
    }
  } catch (dbErr) {
    console.error('Failed to run self-healing database migration:', dbErr);
  }

  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  // We expect state to be "businessId:frontendUrl"
  let businessId = '';
  let frontendUrl = 'http://localhost:5173';

  if (state) {
    const parts = state.split(':');
    businessId = parts[0];
    if (parts[1]) {
      // Reconstruct URL in case it has port or multiple colons (e.g., http://localhost:5173)
      frontendUrl = parts.slice(1).join(':');
    }
  }

  if (!code || !businessId) {
    console.error('Missing code or businessId:', { code: !!code, businessId });
    return Response.redirect(`${frontendUrl}/dashboard/settings?error=missing_parameters`, 302);
  }

  try {
    const clientId = Deno.env.get('TWILIO_CLIENT_ID');
    const clientSecret = Deno.env.get('TWILIO_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      console.error('Twilio Client credentials missing in env');
      throw new Error('Twilio Client credentials not configured in Edge Functions');
    }

    console.log('Exchanging Twilio OAuth code for access token for business:', businessId);

    const redirectUri = `${url.origin}/functions/v1/twilio-oauth-callback`;

    // 1. Exchange code for access token
    const tokenParams = new URLSearchParams();
    tokenParams.append('grant_type', 'authorization_code');
    tokenParams.append('code', code);
    tokenParams.append('client_id', clientId);
    tokenParams.append('client_secret', clientSecret);
    tokenParams.append('redirect_uri', redirectUri);

    const tokenResponse = await fetch('https://oauth.twilio.com/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams.toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Twilio OAuth token exchange failed:', errorText);
      throw new Error(`Twilio OAuth failed: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresIn = tokenData.expires_in || 14400; // default 4 hours
    const accountSid = tokenData.account_sid;

    if (!accessToken || !accountSid) {
      throw new Error('OAuth token exchange did not return access token or Account SID');
    }

    console.log('Token exchanged successfully. Account SID:', accountSid);

    // Calculate expiration timestamp
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // 2. Fetch available WhatsApp senders
    let phoneNumber = '';
    let phoneNumberId = '';

    try {
      console.log('Fetching WhatsApp senders from Twilio API...');
      const sendersResponse = await fetch('https://messaging.twilio.com/v1/WhatsApp/Senders', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (sendersResponse.ok) {
        const sendersData = await sendersResponse.json();
        const senders = sendersData.senders || [];
        console.log(`Found ${senders.length} WhatsApp senders`);
        
        if (senders.length > 0) {
          // Prefer a sender that is approved/connected, otherwise take the first
          const activeSender = senders.find((s: any) => s.status === 'approved' || s.status === 'verified') || senders[0];
          phoneNumber = activeSender.phone_number;
          phoneNumberId = activeSender.phone_number; // Map to the phone number itself for easier webhook queries
          console.log('Selected sender:', phoneNumber);
        }
      } else {
        const errorBody = await sendersResponse.text();
        console.warn('Failed to fetch WhatsApp senders from Twilio:', errorBody);
      }
    } catch (senderErr) {
      console.error('Error listing WhatsApp senders:', senderErr);
    }

    // Fallbacks if no senders are linked or fetching failed
    if (!phoneNumber) {
      console.log('No WhatsApp senders fetched. Using placeholder sender.');
      phoneNumber = 'Pending Setup';
      phoneNumberId = 'pending_setup_' + Math.random().toString(36).substring(7);
    }

    // 3. Save to database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: dbError } = await supabase
      .from('whatsapp_settings')
      .upsert({
        business_id: businessId,
        access_token: accessToken,
        refresh_token: refreshToken || null,
        expires_at: expiresAt,
        waba_id: accountSid, // Store Account SID in waba_id column
        phone_number_id: phoneNumberId,
        phone_number: phoneNumber,
        connection_method: 'twilio_oauth',
        provider: 'twilio', // Explicitly indicate Twilio provider
        enabled: true,
        updated_at: new Date().toISOString()
      });

    if (dbError) {
      console.error('Database error saving Twilio settings:', dbError);
      throw dbError;
    }

    console.log('Successfully completed Twilio OAuth setup for business:', businessId);
    return Response.redirect(`${frontendUrl}/dashboard/settings?connected=whatsapp&phone=${encodeURIComponent(phoneNumber)}`, 302);

  } catch (error: any) {
    console.error('Twilio OAuth callback error:', error.message);
    return Response.redirect(`${frontendUrl}/dashboard/settings?error=${encodeURIComponent(error.message)}`, 302);
  }
});
