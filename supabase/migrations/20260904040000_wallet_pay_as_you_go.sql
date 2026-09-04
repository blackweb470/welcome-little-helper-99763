-- Migration: Pure Pay-As-You-Go Credit Wallet System

CREATE TABLE IF NOT EXISTS public.user_wallets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance_usd NUMERIC(10, 4) NOT NULL DEFAULT 1.0000,
  auto_topup_enabled BOOLEAN NOT NULL DEFAULT false,
  auto_topup_threshold NUMERIC(10, 4) NOT NULL DEFAULT 2.0000,
  auto_topup_amount NUMERIC(10, 4) NOT NULL DEFAULT 10.0000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_usd NUMERIC(10, 4) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('starter_bonus', 'deposit', 'usage_deduction', 'refund')),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for transaction history lookups
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user_created ON public.wallet_transactions(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_wallets
CREATE POLICY "Users can view their own wallet" ON public.user_wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to user_wallets" ON public.user_wallets
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for wallet_transactions
CREATE POLICY "Users can view their own transactions" ON public.wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to wallet_transactions" ON public.wallet_transactions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to get wallet info and create default wallet if missing ($1.00 starter bonus)
CREATE OR REPLACE FUNCTION public.get_wallet_info(p_user_id UUID)
RETURNS TABLE (
  balance_usd NUMERIC(10, 4),
  auto_topup_enabled BOOLEAN,
  auto_topup_threshold NUMERIC(10, 4),
  auto_topup_amount NUMERIC(10, 4),
  estimated_messages_remaining INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_wallet RECORD;
BEGIN
  SELECT * INTO v_wallet
  FROM public.user_wallets
  WHERE user_id = p_user_id;

  -- Create wallet with $1.00 starter gift if first time
  IF v_wallet IS NULL THEN
    INSERT INTO public.user_wallets (user_id, balance_usd)
    VALUES (p_user_id, 1.0000)
    RETURNING * INTO v_wallet;

    INSERT INTO public.wallet_transactions (user_id, amount_usd, type, description)
    VALUES (p_user_id, 1.0000, 'starter_bonus', 'Free Starter Credit ($1.00)');
  END IF;

  RETURN QUERY SELECT
    v_wallet.balance_usd,
    v_wallet.auto_topup_enabled,
    v_wallet.auto_topup_threshold,
    v_wallet.auto_topup_amount,
    FLOOR(v_wallet.balance_usd / 0.005)::INTEGER as estimated_messages_remaining;
END;
$$;

-- Atomic PL/pgSQL function to deduct cost per AI message ($0.005)
CREATE OR REPLACE FUNCTION public.deduct_wallet_balance(p_user_id UUID, p_cost_usd NUMERIC DEFAULT 0.005)
RETURNS TABLE (
  success BOOLEAN,
  remaining_balance NUMERIC(10, 4),
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_current_balance NUMERIC(10, 4);
BEGIN
  -- Lock row FOR UPDATE to prevent race conditions
  SELECT balance_usd INTO v_current_balance
  FROM public.user_wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- If no wallet exists, initialize with $1.00 starter bonus
  IF v_current_balance IS NULL THEN
    INSERT INTO public.user_wallets (user_id, balance_usd)
    VALUES (p_user_id, 1.0000)
    RETURNING balance_usd INTO v_current_balance;

    INSERT INTO public.wallet_transactions (user_id, amount_usd, type, description)
    VALUES (p_user_id, 1.0000, 'starter_bonus', 'Free Starter Credit ($1.00)');
  END IF;

  -- Check if balance is sufficient
  IF v_current_balance < p_cost_usd THEN
    RETURN QUERY SELECT false, v_current_balance, 'Insufficient credit balance'::text;
    RETURN;
  END IF;

  -- Deduct balance
  UPDATE public.user_wallets
  SET balance_usd = balance_usd - p_cost_usd,
      updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING balance_usd INTO v_current_balance;

  -- Log transaction
  INSERT INTO public.wallet_transactions (user_id, amount_usd, type, description)
  VALUES (p_user_id, -p_cost_usd, 'usage_deduction', 'AI Message Response ($0.005)');

  RETURN QUERY SELECT true, v_current_balance, NULL::text;
END;
$$;

-- Function to topup wallet balance on payment success
CREATE OR REPLACE FUNCTION public.topup_wallet_balance(p_user_id UUID, p_amount_usd NUMERIC, p_description TEXT DEFAULT 'Credit Deposit')
RETURNS NUMERIC(10, 4)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_new_balance NUMERIC(10, 4);
BEGIN
  INSERT INTO public.user_wallets (user_id, balance_usd)
  VALUES (p_user_id, p_amount_usd)
  ON CONFLICT (user_id) DO UPDATE
  SET balance_usd = user_wallets.balance_usd + EXCLUDED.balance_usd,
      updated_at = NOW()
  RETURNING balance_usd INTO v_new_balance;

  INSERT INTO public.wallet_transactions (user_id, amount_usd, type, description)
  VALUES (p_user_id, p_amount_usd, 'deposit', p_description);

  RETURN v_new_balance;
END;
$$;
