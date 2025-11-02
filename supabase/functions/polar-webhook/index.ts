import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-polar-signature',
};

interface PolarWebhookEvent {
  type: string;
  data: {
    id: string;
    customer_id: string;
    user_id?: string;
    product_id: string;
    status: string;
    current_period_end?: string;
    trial_end?: string;
    cancel_at_period_end?: boolean;
    metadata?: {
      user_id?: string;
      plan_name?: string;
    };
  };
}

// Verify Polar webhook signature
async function verifyPolarSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const signatureBuffer = Uint8Array.from(
    signature.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );

  return await crypto.subtle.verify(
    'HMAC',
    key,
    signatureBuffer,
    encoder.encode(payload)
  );
}

// Map Polar product IDs to plan names
function getPlanNameFromProductId(productId: string): string {
  const productMapping: Record<string, string> = {
    '2e7f6e6a-cb2a-4167-bf5c-7eb9e55c6636': 'basic',
    '65495367-3163-49af-9ae4-0c3e740d332a': 'pro',
    '495da580-72e9-4fb9-a706-b098921df542': 'business',
  };
  return productMapping[productId] || 'basic';
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const polarWebhookSecret = Deno.env.get('POLAR_WEBHOOK_SECRET')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get webhook signature
    const signature = req.headers.get('x-polar-signature');
    const rawBody = await req.text();

    if (!signature) {
      console.error('Missing Polar signature');
      return new Response(JSON.stringify({ error: 'Missing signature' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify webhook signature
    const isValid = await verifyPolarSignature(rawBody, signature, polarWebhookSecret);
    if (!isValid) {
      console.error('Invalid Polar signature');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const event: PolarWebhookEvent = JSON.parse(rawBody);
    console.log('Polar webhook event:', event.type);

    const userId = event.data.metadata?.user_id || event.data.user_id;
    if (!userId) {
      console.error('No user_id found in webhook event');
      return new Response(JSON.stringify({ error: 'Missing user_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle different webhook events
    switch (event.type) {
      case 'subscription.created':
      case 'subscription.updated': {
        const planName = event.data.metadata?.plan_name || 
                        getPlanNameFromProductId(event.data.product_id);
        
        const trialEndsAt = event.data.trial_end 
          ? new Date(event.data.trial_end).toISOString()
          : null;

        const currentPeriodEnd = event.data.current_period_end
          ? new Date(event.data.current_period_end).toISOString()
          : null;

        // Upsert subscription
        const { error: upsertError } = await supabase
          .from('user_subscriptions')
          .upsert({
            user_id: userId,
            plan_name: planName,
            polar_customer_id: event.data.customer_id,
            polar_subscription_id: event.data.id,
            trial_ends_at: trialEndsAt,
            current_period_end: currentPeriodEnd,
            cancel_at_period_end: event.data.cancel_at_period_end || false,
            expires_at: currentPeriodEnd,
            started_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id',
          });

        if (upsertError) {
          console.error('Error upserting subscription:', upsertError);
          throw upsertError;
        }

        console.log(`Subscription ${event.type} for user ${userId}, plan: ${planName}`);
        break;
      }

      case 'subscription.cancelled':
      case 'subscription.deleted': {
        // Mark subscription as cancelled
        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({
            cancel_at_period_end: true,
            updated_at: new Date().toISOString(),
          })
          .eq('polar_subscription_id', event.data.id);

        if (updateError) {
          console.error('Error updating subscription:', updateError);
          throw updateError;
        }

        console.log(`Subscription cancelled for user ${userId}`);
        break;
      }

      case 'subscription.revoked': {
        // Immediately revoke access
        const { error: deleteError } = await supabase
          .from('user_subscriptions')
          .delete()
          .eq('polar_subscription_id', event.data.id);

        if (deleteError) {
          console.error('Error deleting subscription:', deleteError);
          throw deleteError;
        }

        console.log(`Subscription revoked for user ${userId}`);
        break;
      }

      default:
        console.log(`Unhandled webhook event: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
