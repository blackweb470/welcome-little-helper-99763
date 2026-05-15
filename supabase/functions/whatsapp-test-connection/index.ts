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
    const { phoneNumberId, accessToken, recipientPhone } = await req.json()

    if (!phoneNumberId || !accessToken || !recipientPhone) {
      throw new Error('Missing required fields: phoneNumberId, accessToken, and recipientPhone are all required.')
    }

    console.log(`Testing WhatsApp connection for Phone ID: ${phoneNumberId} to Recipient: ${recipientPhone}`)

    const response = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: recipientPhone,
          type: 'text',
          text: {
            body: '🚀 *Connection Test Successful!*\n\nYour Lyqn AI WhatsApp integration is correctly configured. You can now start receiving and sending messages through the platform.'
          }
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      console.error('Meta API Error:', data)
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
