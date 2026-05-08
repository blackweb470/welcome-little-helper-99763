# Polar Integration Guide

## Overview
This application uses Polar for subscription management with a professional signup flow:
1. Users sign up → redirected to plan selection
2. Select plan with 1-month free trial → Polar checkout
3. Add payment card → trial starts
4. Auto-charged after trial ends

## Current Configuration

### Product IDs (Configured in code)
- **Basic Plan**: `2e7f6e6a-cb2a-4167-bf5c-7eb9e55c6636`
- **Pro Plan**: `65495367-3163-49af-9ae4-0c3e740d332a`
- **Business Plan**: `495da580-72e9-4fb9-a706-b098921df542`

These are configured in:
- `src/pages/Pricing.tsx` (frontend)
- `supabase/functions/polar-webhook/index.ts` (backend)

## Setup Steps

### 1. Polar Account Setup
1. Create account at https://polar.sh
2. Create products for each plan with trial periods
3. Copy product IDs
4. If IDs differ, update in both files above

### 2. Configure Webhook
1. In Polar dashboard, go to Settings → Webhooks
2. Add webhook URL: `https://rgczbabidcqvpyiiqjfv.supabase.co/functions/v1/polar-webhook`
3. Select events: `subscription.*`
4. Copy webhook secret

### 3. Add Secrets
The webhook secret should already be configured as `POLAR_WEBHOOK_SECRET` in your Supabase edge functions. If not, add it via the dashboard's secrets management or Supabase CLI.

### 4. Test Flow
1. Sign up as new user
2. Verify redirect to pricing
3. Select Basic plan (free trial)
4. Complete Polar checkout
5. Verify subscription appears in `/billing`

## Signup Flow

```
Sign Up → Onboarding Check → Pricing → Polar Checkout → Dashboard
   ↓            ↓                ↓           ↓            ↓
Create      Has sub?      Select plan   Add card    Access app
Account       No→               ↓           ↓            ↓
              Yes→         Start trial  Save card   Trial status
            Dashboard                                 visible
```

## Billing Management

Users can manage subscriptions at `/billing`:
- View trial status and end date
- See next billing date  
- Change plans
- Cancel subscription (via Polar)
- View payment method info

## Webhook Events

The webhook handles these Polar events:
- `subscription.created` - New subscription
- `subscription.updated` - Plan change, trial end
- `subscription.cancelled` - User cancelled
- `subscription.deleted` - Subscription removed
- `subscription.revoked` - Forced removal

## Database

Subscriptions stored in `user_subscriptions` table:
- `trial_ends_at` - When trial ends (NULL if not trial)
- `expires_at` - Next billing date
- `cancel_at_period_end` - Cancellation scheduled
- `polar_subscription_id` - Link to Polar

## Features by Plan

### Basic ($9.99/month)
- 1 Month Free Trial
- 3 Businesses
- Pre-Chat Forms
- Canned Responses
- Basic Analytics

### Pro ($29.99/month)
- 10 Businesses
- Live Agent Transfer
- Advanced Analytics
- Sentiment Analysis
- Voice Chat

### Business ($99.99/month)
- Unlimited Businesses
- AI Learning
- Business Documents
- Advanced Tracking
- API Access

## Launch Ready! 🚀

The integration is complete and professional. Just verify:
1. Product IDs match your Polar products
2. Webhook secret is configured
3. Test signup flow works end-to-end

See `SIGNUP_FLOW.md` for complete user journey details.
