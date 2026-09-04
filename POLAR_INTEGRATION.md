# Pay-As-You-Go Credit Deposit & Billing Guide

## Overview
This application uses a **Pure Pay-As-You-Go Credit Wallet System**:
1. New users sign up → automatically receive **$2.00 Free Starter Credit** (~400 AI messages).
2. Users access the dashboard immediately with full feature access.
3. Users top up credit wallet in flexible deposit amounts ($5, $10, $25, $50, $100).
4. AI message responses deduct **$0.005 per message response** ($5.00 for 1,000 AI responses).
5. Unused credits never expire.

## Configuration & Packages

### Deposit Packages
- **Starter Deposit ($5)**: Includes $1.00 free bonus (~1,000 AI responses).
- **Growth Deposit ($10)**: Auto-recharge option (~2,000 AI responses).
- **Scale Deposit ($25)**: High-volume operations (~5,000 AI responses).

## Wallet Database & PL/pgSQL
Stored in `user_wallets` and `wallet_transactions` tables:
- `balance_usd` - Available credit balance
- `deduct_wallet_balance(user_id, cost)` - Atomic deduction per message
- `topup_wallet_balance(user_id, amount)` - Credit deposit function

## Included Features
All platform features are included for all active credit wallet holders:
- Full AI Learning & Document Training
- Live Agent Transfer & Proactive Chat Rules
- Website Crawler & Deep Knowledge Search
- Advanced Visitor Tracking & Analytics
- WhatsApp & Custom Integrations
