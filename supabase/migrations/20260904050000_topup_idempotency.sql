-- Migration: Atomic Idempotency Check for Wallet Topup to Prevent Double Deposits

CREATE OR REPLACE FUNCTION public.topup_wallet_balance(
  p_user_id UUID,
  p_amount_usd NUMERIC,
  p_description TEXT DEFAULT 'Credit Deposit',
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS NUMERIC(10, 4)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_new_balance NUMERIC(10, 4);
  v_event_id TEXT;
  v_checkout_id TEXT;
BEGIN
  -- Extract idempotency keys from metadata if provided
  v_event_id := p_metadata->>'polar_event_id';
  v_checkout_id := p_metadata->>'polar_checkout_id';

  -- Check if this event ID was already processed
  IF (v_event_id IS NOT NULL AND v_event_id <> '') THEN
    IF EXISTS (
      SELECT 1 FROM public.wallet_transactions 
      WHERE user_id = p_user_id 
        AND metadata->>'polar_event_id' = v_event_id
    ) THEN
      SELECT balance_usd INTO v_new_balance FROM public.user_wallets WHERE user_id = p_user_id;
      RETURN COALESCE(v_new_balance, 0);
    END IF;
  END IF;

  -- Check if this checkout session was already credited
  IF (v_checkout_id IS NOT NULL AND v_checkout_id <> '') THEN
    IF EXISTS (
      SELECT 1 FROM public.wallet_transactions 
      WHERE user_id = p_user_id 
        AND metadata->>'polar_checkout_id' = v_checkout_id
        AND type = 'deposit'
    ) THEN
      SELECT balance_usd INTO v_new_balance FROM public.user_wallets WHERE user_id = p_user_id;
      RETURN COALESCE(v_new_balance, 0);
    END IF;
  END IF;

  INSERT INTO public.user_wallets (user_id, balance_usd)
  VALUES (p_user_id, p_amount_usd)
  ON CONFLICT (user_id) DO UPDATE
  SET balance_usd = user_wallets.balance_usd + EXCLUDED.balance_usd,
      updated_at = NOW()
  RETURNING balance_usd INTO v_new_balance;

  INSERT INTO public.wallet_transactions (user_id, amount_usd, type, description, metadata)
  VALUES (p_user_id, p_amount_usd, 'deposit', p_description, COALESCE(p_metadata, '{}'::jsonb));

  RETURN v_new_balance;
END;
$$;
