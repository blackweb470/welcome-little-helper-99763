import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-visitor-id',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phoneNumberId: reqPhoneNumberId, accessToken: reqAccessToken, recipientPhone, businessId } = await req.json()

    if (!recipientPhone) {
      throw new Error('Missing required field: recipientPhone')
    }

    let phoneNumberId = reqPhoneNumberId;
    let accessToken = reqAccessToken;

    // If businessId is provided, fetch credentials securely from DB
    if (businessId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      
      const res = await fetch(`${supabaseUrl}/rest/v1/whatsapp_settings?business_id=eq.${businessId}&select=phone_number_id,access_token`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      const data = await res.json();
      
      if (data && data.length > 0) {
        phoneNumberId = data[0].phone_number_id;
        accessToken = data[0].access_token;
      } else {
        throw new Error('WhatsApp settings not found for this business.');
      }
    }

    if (!phoneNumberId || !accessToken) {
      throw new Error('Missing required credentials. Either provide them directly or pass a valid businessId.')
    }

    console.log(`Testing WhatsApp connection for Phone ID: ${phoneNumberId} to Recipient: ${recipientPhone}`)
    
    const payload = {
      messaging_product: 'whatsapp',
      to: recipientPhone,
      type: 'text',
      text: {
        body: '🚀 *Connection Test Successful!*\n\nYour Lyqn AI WhatsApp integration is correctly configured. You can now start receiving and sending messages through the platform.'
      }
    }

    console.log('Sending Payload to Meta:', JSON.stringify(payload, null, 2))

    const response = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    )

    const data = await response.json()
    console.log('Meta API Response Status:', response.status)
    console.log('Meta API Response Data:', JSON.stringify(data, null, 2))

    if (!response.ok) {
      console.error('Meta API Error Details:', data)
      return new Response(
        JSON.stringify({
          success: false,
          error: data.error?.message || 'Failed to send test message',
          details: data.error
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Test message sent successfully!',
        messageId: data.messages?.[0]?.id,
        data
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
