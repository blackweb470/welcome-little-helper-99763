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
    const body = await req.json();
    const { 
      phoneNumberId: reqPhoneNumberId, 
      accessToken: reqAccessToken, 
      wabaId: reqWabaId,
      recipientPhone, 
      businessId,
      phoneNumber: reqPhoneNumber,
      provider: reqProvider
    } = body;

    if (!recipientPhone) {
      throw new Error('Missing required field: recipientPhone')
    }

    let phoneNumberId = reqPhoneNumberId;
    let accessToken = reqAccessToken;
    let wabaId = reqWabaId;
    let phoneNumber = reqPhoneNumber || reqPhoneNumberId;
    let provider = reqProvider || 'meta'; // Default to Meta

    // If businessId is provided, fetch credentials securely from DB
    if (businessId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      
      const res = await fetch(`${supabaseUrl}/rest/v1/whatsapp_settings?business_id=eq.${businessId}&select=phone_number_id,access_token,waba_id,phone_number,provider`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      const data = await res.json();
      
      if (data && data.length > 0) {
        phoneNumberId = data[0].phone_number_id;
        accessToken = data[0].access_token;
        wabaId = data[0].waba_id;
        phoneNumber = data[0].phone_number;
        provider = data[0].provider || 'meta';
      } else {
        throw new Error('WhatsApp settings not found for this business.');
      }
    }

    if (!phoneNumberId || !accessToken) {
      throw new Error('Missing required credentials. Phone ID/Sender number and Access/Auth Token are required.')
    }

    console.log(`Testing WhatsApp connection using provider: ${provider} to recipient: ${recipientPhone}`);

    if (provider === 'twilio') {
      if (!wabaId) {
        throw new Error('Twilio integration requires Account SID (WABA ID).')
      }

      const twilioParams = new URLSearchParams();
      twilioParams.append('To', `whatsapp:${recipientPhone}`);
      twilioParams.append('From', `whatsapp:${phoneNumber}`);
      twilioParams.append('Body', '🚀 Connection Test Successful!\n\nYour Lyqn AI Twilio WhatsApp integration is correctly configured. You can now start receiving and sending messages through the platform.');

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${wabaId}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`.startsWith('Bearer Bearer') ? accessToken : `Bearer ${accessToken}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: twilioParams.toString(),
        }
      );

      const resultText = await response.text();
      console.log('Twilio API Response Status:', response.status);

      if (!response.ok) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Twilio API Error (Status ${response.status}): ${resultText}`
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        )
      }

      const data = JSON.parse(resultText);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Test message sent successfully!',
          messageId: data.sid,
          data
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    } else {
      // Meta Cloud API Test Connection
      const payload = {
        messaging_product: 'whatsapp',
        to: recipientPhone,
        type: 'text',
        text: {
          body: '🚀 *Connection Test Successful!*\n\nYour Lyqn AI Meta WhatsApp integration is correctly configured. You can now start receiving and sending messages through the platform.'
        }
      };

      console.log('Sending Payload to Meta:', JSON.stringify(payload, null, 2));

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
      );

      const data = await response.json();
      console.log('Meta API Response Status:', response.status);

      if (!response.ok) {
        console.error('Meta API Error Details:', data);
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
    }

  } catch (error: any) {
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
