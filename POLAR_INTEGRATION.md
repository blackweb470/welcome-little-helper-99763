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
  - Product ID: `2e7f6e6a-cb2a-4167-bf5c-7eb9e55c6636`
- ✅ Pro Plan ($29.99/month)
  - Product ID: `65495367-3163-49af-9ae4-0c3e740d332a`
- ✅ Business Plan ($99.99/month)
  - Product ID: `495da580-72e9-4fb9-a706-b098921df542`

### Backend Functions
- ✅ `polar-webhook` edge function - Handles Polar webhooks securely
- ✅ Subscription status tracking functions
- ✅ Feature access control based on plans

### Frontend Components
- ✅ Subscription Manager component (`/billing`)
- ✅ PolarCheckout component integrated in pricing page
- ✅ Updated feature access hooks
- ✅ Trial period display
- ✅ Product IDs configured in webhook handler

## 🔧 Required Setup Steps

### 1. Product IDs Configured ✅

Your Polar product IDs have been configured:
- **Basic Plan**: `2e7f6e6a-cb2a-4167-bf5c-7eb9e55c6636`
- **Pro Plan**: `65495367-3163-49af-9ae4-0c3e740d332a`
- **Business Plan**: `495da580-72e9-4fb9-a706-b098921df542`

These are already mapped in the webhook handler.

### 2. Configure Webhook in Polar Dashboard

1. Go to Polar Dashboard → Settings → Webhooks
2. Add webhook endpoint: `https://rgczbabidcqvpyiiqjfv.supabase.co/functions/v1/polar-webhook`
3. Select events to listen to:
   - `subscription.created`
   - `subscription.updated`
   - `subscription.cancelled`
   - `subscription.deleted`
   - `subscription.revoked`
4. Copy the webhook secret (already configured as `POLAR_WEBHOOK_SECRET`)

### 3. Checkout Integration ✅

The PolarCheckout component has been integrated into the pricing page. It creates checkout sessions dynamically using the Polar API with your configured product IDs.

**Checkout Link**: `https://buy.polar.sh/polar_cl_BeNKQxpBOCSJ0SbFU6bZAAAEhurIudMmcRwCx4QSlRF`

The component handles:
- User authentication check
- Creating checkout sessions via Polar API
- Redirecting to Polar checkout with metadata
- Success/cancel URL handling

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

1. ✅ Product IDs configured
2. Configure Polar webhook endpoint (Step 2 above)
3. Test complete subscription flow
4. Monitor webhook logs for errors

---

**Need Help?** Check the Supabase Edge Function logs and Polar webhook logs for debugging.
