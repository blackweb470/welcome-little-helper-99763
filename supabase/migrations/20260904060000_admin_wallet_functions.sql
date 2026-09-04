-- Migration: Admin Wallet Security Definer Functions to Bypass RLS for Super Admin Analytics

-- 1. Function for Admin to fetch all users with their exact wallet balance & plan
CREATE OR REPLACE FUNCTION public.get_admin_users_wallets()
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ,
  plan TEXT,
  balance NUMERIC(10, 4)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Ensure any registered user missing a wallet gets initialized with $1.00 starter balance
  INSERT INTO public.user_wallets (user_id, balance_usd)
  SELECT p.id, 1.0000
  FROM public.profiles p
  LEFT JOIN public.user_wallets w ON p.id = w.user_id
  WHERE w.user_id IS NULL;

  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.created_at,
    COALESCE(s.plan_name, 'free') as plan,
    COALESCE(w.balance_usd, 1.0000) as balance
  FROM public.profiles p
  LEFT JOIN public.user_wallets w ON p.id = w.user_id
  LEFT JOIN public.user_subscriptions s ON p.id = s.user_id
  ORDER BY p.created_at DESC;
END;
$$;

-- 2. Function for Admin to fetch system-wide transaction history with user email details
CREATE OR REPLACE FUNCTION public.get_admin_transactions(p_limit INTEGER DEFAULT 100)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  user_email TEXT,
  amount_usd NUMERIC(10, 4),
  type TEXT,
  description TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.user_id,
    COALESCE(p.email, 'System / Unknown') as user_email,
    t.amount_usd,
    t.type,
    t.description,
    t.created_at
  FROM public.wallet_transactions t
  LEFT JOIN public.profiles p ON t.user_id = p.id
  ORDER BY t.created_at DESC
  LIMIT p_limit;
END;
$$;
