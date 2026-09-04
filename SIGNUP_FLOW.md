# Professional Pay-As-You-Go User & Wallet Journey

## Overview
This application implements a **Pure Pay-As-You-Go Credit Wallet Flow**:
1. User creates an account with email/password.
2. User receives **$2.00 Free Starter Credit** (~400 AI messages) on signup.
3. User gets instant access to all platform features in `/dashboard`.
4. Chatbot uses $0.005 per AI response.
5. User tops up wallet credits ($5, $10, $25, $50) in `/dashboard?tab=billing`.

## User Journey

### New User Signup
1. **Sign Up** (`/auth`)
   - User creates account with email/password
   - Auto-redirect to `/onboarding`

2. **Onboarding Check** (`/onboarding`)
   - Initializes `user_wallets` with **$2.00 Free Starter Credit**
   - Redirects directly to `/dashboard`

3. **Access Dashboard** (`/dashboard`)
   - Full feature access unlocked (AI Learning, Documents, Live Agent, Website Crawler, Proactive Rules)
   - Real-time wallet balance visible in billing tab

4. **Deposits & Top-ups** (`/dashboard?tab=billing`)
   - Deposit $5, $10, $25, $50, or custom amounts
   - Auto-recharge alert when balance falls below $2.00
