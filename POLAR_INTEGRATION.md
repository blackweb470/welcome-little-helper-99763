# Polar Payment Integration Guide

This guide explains how to complete the Polar payment integration for your LYQN AI application.

## ✅ What's Already Implemented

### Database Structure
- ✅ `user_subscriptions` table updated with Polar tracking fields:
  - `polar_customer_id` - Tracks Polar customer
  - `polar_subscription_id` - Tracks Polar subscription
  - `trial_ends_at` - 1-month trial tracking
  - `cancel_at_period_end` - Cancellation status
  - `current_period_end` - Next billing date

### Subscription Plans
- ✅ Basic Plan ($9.99/month) - 1 month free trial
- ✅ Pro Plan ($29.99/month)
- ✅ Business Plan ($99.99/month)
- ✅ Enterprise Plan ($299.99/month)

### Backend Functions
- ✅ `polar-webhook` edge function - Handles Polar webhooks securely
- ✅ Subscription status tracking functions
- ✅ Feature access control based on plans

### Frontend Components
- ✅ Subscription Manager component (`/billing`)
- ✅ Updated feature access hooks
- ✅ Trial period display

## 🔧 Required Setup Steps

### 1. Create Polar Account & Products

1. Sign up at [polar.sh](https://polar.sh)
2. Create products for each plan:
   - **Basic Plan** - $9.99/month with 1-month trial
   - **Pro Plan** - $29.99/month
   - **Business Plan** - $99.99/month
   - **Enterprise Plan** - $299.99/month

3. Note down your product IDs for each plan

### 2. Update Product Mapping

Edit `supabase/functions/polar-webhook/index.ts` (lines 54-63):

\`\`\`typescript
function getPlanNameFromProductId(productId: string): string {
  const productMapping: Record<string, string> = {
    'prod_YOUR_BASIC_ID': 'basic',      // Replace with actual Polar product ID
    'prod_YOUR_PRO_ID': 'pro',          // Replace with actual Polar product ID
    'prod_YOUR_BUSINESS_ID': 'business', // Replace with actual Polar product ID
    'prod_YOUR_ENTERPRISE_ID': 'enterprise', // Replace with actual Polar product ID
  };
  return productMapping[productId] || 'basic';
}
\`\`\`

### 3. Configure Webhook in Polar Dashboard

1. Go to Polar Dashboard → Settings → Webhooks
2. Add webhook endpoint: `https://rgczbabidcqvpyiiqjfv.supabase.co/functions/v1/polar-webhook`
3. Select events to listen to:
   - `subscription.created`
   - `subscription.updated`
   - `subscription.cancelled`
   - `subscription.deleted`
   - `subscription.revoked`
4. Copy the webhook secret (already configured as `POLAR_WEBHOOK_SECRET`)

### 4. Implement Checkout Buttons

Since Polar checkouts must be created server-side, you'll need to either:

**Option A: Use Polar's Embeddable Checkout**
```tsx
// In your pricing page
<script src="https://polar.sh/embed.js"></script>
<polar-checkout 
  checkout-id="YOUR_CHECKOUT_ID"
  theme="dark"
/>
```

**Option B: Create Server-Side Checkout (Recommended)**

Create a new edge function:

\`\`\`typescript
// supabase/functions/create-polar-checkout/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';

Deno.serve(async (req) => {
  const { planName, userId } = await req.json();
  
  const polarApiKey = Deno.env.get('POLAR_API_KEY')!;
  
  // Get product price ID based on plan
  const priceIds = {
    basic: 'YOUR_BASIC_PRICE_ID',
    pro: 'YOUR_PRO_PRICE_ID',
    business: 'YOUR_BUSINESS_PRICE_ID',
    enterprise: 'YOUR_ENTERPRISE_PRICE_ID',
  };
  
  // Create checkout session via Polar API
  const response = await fetch('https://api.polar.sh/v1/checkouts', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${polarApiKey}\`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      product_price_id: priceIds[planName],
      success_url: \`\${req.headers.get('origin')}/dashboard?checkout=success\`,
      cancel_url: \`\${req.headers.get('origin')}/pricing\`,
      metadata: {
        user_id: userId,
        plan_name: planName,
      },
    }),
  });
  
  const data = await response.json();
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
});
\`\`\`

Then update the config.toml:
\`\`\`toml
[functions.create-polar-checkout]
verify_jwt = true
\`\`\`

### 5. Update Pricing Page Buttons

Replace the placeholder buttons in `src/pages/Pricing.tsx` with actual checkout triggers:

\`\`\`tsx
import { supabase } from "@/integrations/supabase/client";

const handleSubscribe = async (planName: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    navigate('/auth');
    return;
  }
  
  const { data } = await supabase.functions.invoke('create-polar-checkout', {
    body: { planName, userId: user.id }
  });
  
  if (data?.url) {
    window.location.href = data.url;
  }
};
\`\`\`

## 📊 Features Already Mapped to Plans

### Basic Plan ($9.99/month)
- ✅ 3 Businesses
- ✅ Pre-Chat Forms
- ✅ Canned Responses
- ✅ Basic Analytics
- ✅ Email Notifications
- ✅ Chat History

### Pro Plan ($29.99/month)
- ✅ 10 Businesses
- ✅ Live Agent Transfer
- ✅ Advanced Analytics
- ✅ Sentiment Analysis
- ✅ Proactive Chat Rules
- ✅ Voice Chat
- ✅ Product Catalog

### Business Plan ($99.99/month)
- ✅ Unlimited Businesses
- ✅ AI Learning & Documents
- ✅ Advanced Visitor Tracking
- ✅ Custom Integrations
- ✅ API Access
- ✅ 24/7 Priority Support

### Enterprise Plan ($299.99/month)
- ✅ Everything in Business
- ⚠️ White-Label Solution (needs implementation)
- ⚠️ SLA Guarantees (needs implementation)
- ⚠️ Multi-Region Deployment (infrastructure)
- ⚠️ On-Premise Option (infrastructure)

## 🔍 Testing the Integration

### Test Webhook Locally
Use Polar's webhook testing feature to send test events to your webhook endpoint.

### Test Subscription Flow
1. Navigate to `/pricing`
2. Click a plan's subscribe button
3. Complete checkout in Polar
4. Verify subscription appears in `/billing`
5. Check that features are unlocked based on plan

### Verify Trial Period
1. Subscribe to Basic plan
2. Check `/billing` shows "Free Trial" badge
3. Verify `trial_ends_at` is 30 days from now
4. After trial, ensure billing begins automatically

## 📚 Additional Resources

- [Polar API Documentation](https://docs.polar.sh)
- [Polar Webhooks Guide](https://docs.polar.sh/webhooks)
- [Polar Checkout Documentation](https://docs.polar.sh/checkout)

## 🔐 Security Notes

- ✅ Webhook signatures are verified before processing
- ✅ JWT verification disabled only for public webhook endpoint
- ✅ User subscriptions properly linked via metadata
- ✅ RLS policies protect subscription data

## 🚀 Next Steps

1. Create Polar account and products
2. Update product ID mapping in webhook function
3. Configure Polar webhook endpoint
4. Implement checkout button functionality
5. Test complete subscription flow
6. Monitor webhook logs for errors

---

**Need Help?** Check the Supabase Edge Function logs and Polar webhook logs for debugging.
