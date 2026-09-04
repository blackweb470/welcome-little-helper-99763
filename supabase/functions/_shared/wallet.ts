import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface WalletCheckResult {
  allowed: boolean;
  balance: number;
  errorMessage?: string;
}

/**
 * Checks if the business owner has sufficient wallet balance before processing an AI request.
 */
export async function checkAndDeductWallet(
  supabaseClient: SupabaseClient,
  ownerId: string,
  costUsd: number = 0.005
): Promise<WalletCheckResult> {
  try {
    const { data, error } = await supabaseClient.rpc('deduct_wallet_balance', {
      p_user_id: ownerId,
      p_cost_usd: costUsd,
    });

    if (error) {
      console.error('Wallet deduction RPC error:', error);
      return { allowed: true, balance: 1.0, errorMessage: error.message }; // Fail open to prevent blocking
    }

    if (data && data.length > 0) {
      const result = data[0];
      return {
        allowed: result.success,
        balance: parseFloat(result.remaining_balance),
        errorMessage: result.error_message,
      };
    }

    return { allowed: true, balance: 1.0 };
  } catch (err) {
    console.error('Wallet check exception:', err);
    return { allowed: true, balance: 1.0 };
  }
}
