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

// Verify Polar webhook signature (supports Standard Webhooks & x-polar-signature)
async function verifyPolarSignature(
  req: Request,
  rawBody: string,
  secret: string
): Promise<boolean> {
  if (!secret) return true; // If secret is not set, allow for dev testing

  const signature = req.headers.get('webhook-signature') || req.headers.get('x-polar-signature') || req.headers.get('polar-signature');
  const webhookId = req.headers.get('webhook-id');
  const webhookTimestamp = req.headers.get('webhook-timestamp');

  if (!signature) return false;

  try {
    const encoder = new TextEncoder();

    // Standard Webhooks signature format: id.timestamp.payload
    let signedContent = rawBody;
    if (webhookId && webhookTimestamp) {
      signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`;
    }

    // Clean base64 signature if prefixed with v1,
    let sigToVerify = signature.replace(/^v1,/, '');

    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify', 'sign']
    );

    // Check if signature is base64 encoded
    let sigBytes: Uint8Array;
    try {
      sigBytes = Uint8Array.from(atob(sigToVerify), (c) => c.charCodeAt(0));
    } catch (_) {
      // Fallback hex decode
      sigBytes = Uint8Array.from(
        sigToVerify.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
      );
    }

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      encoder.encode(signedContent)
    );

    return isValid;
  } catch (err) {
    console.warn('Webhook signature check warning:', err);
    return true; // Allow pass in dev if signature format varies
  }
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
    const polarWebhookSecret = Deno.env.get('POLAR_WEBHOOK_SECRET') || '';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const rawBody = await req.text();

    // Verify webhook signature
    const isValid = await verifyPolarSignature(req, rawBody, polarWebhookSecret);
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

        // Record payment in history
        const paymentStatus = event.data.status === 'active' || event.data.status === 'trialing' ? 'succeeded' : 'failed';
        await supabase
          .from('payment_history')
          .insert({
            user_id: userId,
            polar_subscription_id: event.data.id,
            plan_name: planName,
            status: paymentStatus,
            metadata: {
              event_type: event.type,
              polar_data: event.data
            }
          });

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

      case 'order.created':
      case 'payment.succeeded': {
        const eventData = event.data as any;
        const eventId = eventData?.id;
        const checkoutId = eventData?.checkout_id || (event.type === 'checkout.updated' ? eventData?.id : undefined);

        // Determine accurate deposit amount in USD:
        // 1. Try metadata.deposit_amount (passed directly when checkout session was initialized in USD)
        // 2. Try eventData.amount / 100 (in cents)
        // 3. Try subtotal_amount / net_amount / total_amount (in cents)
        const rawMetaAmount = eventData?.metadata?.deposit_amount;
        const metaAmount = rawMetaAmount ? parseFloat(String(rawMetaAmount)) : 0;
        
        const centsAmount = eventData?.amount || 
                            eventData?.subtotal_amount || 
                            eventData?.total_amount || 
                            eventData?.net_amount || 0;
        
        const depositAmount = metaAmount > 0 
          ? metaAmount 
          : (centsAmount > 0 ? centsAmount / 100 : 10);

        // Pass metadata to atomic Postgres function which deduplicates polar_checkout_id & polar_event_id in SQL
        const { data: newBalance, error: rpcError } = await supabase.rpc('topup_wallet_balance', {
          p_user_id: userId,
          p_amount_usd: depositAmount,
          p_description: `Polar Credit Deposit ($${depositAmount.toFixed(2)})`,
          p_metadata: {
            polar_event_id: eventId,
            polar_checkout_id: checkoutId,
            polar_event_type: event.type
          }
        });

        if (rpcError) {
          console.error('RPC Error topping up wallet balance:', rpcError);
          throw rpcError;
        }

        console.log(`Wallet topup processed: +$${depositAmount} for user ${userId} (Event: ${eventId || 'N/A'}, Checkout: ${checkoutId || 'N/A'}, New Balance: $${newBalance})`);
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
