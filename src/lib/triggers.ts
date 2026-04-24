// Persona trait → autopilot action mapping

export type AutopilotActionType =
  | "buy_own_token"
  | "tip_user"
  | "swap_to_token"
  | "check_balance"
  | "post_shill";

export interface AutopilotAction {
  type: AutopilotActionType;
  amountSol?: number;
  recipientAddress?: string;
  tokenMint?: string;
  reason: string; // human-readable why
}

export interface AutopilotContext {
  hasOwnToken?: boolean;
  ownTokenMint?: string;
  lastEngagerWallet?: string;
  mentionedTokenMint?: string;
  agentBalanceSol?: number;
}

/**
 * Given a persona's traits and current context, pick one autopilot action.
 * Returns null if no suitable action available (e.g., insufficient balance).
 */
export function suggestAction(
  traits: string[],
  context: AutopilotContext
): AutopilotAction | null {
  const traitSet = new Set(traits.map(t => t.toLowerCase()));
  const balance = context.agentBalanceSol ?? 0;

  // Needs at least 0.005 SOL for fees + minimum action
  if (balance < 0.005) {
    return { type: "check_balance", reason: "Low balance — just checking" };
  }

  // AGGRESSIVE / MEMETIC / CONTROVERSIAL → pump own token
  if (
    context.hasOwnToken &&
    context.ownTokenMint &&
    (traitSet.has("aggressive") || traitSet.has("memetic") || traitSet.has("controversial") || traitSet.has("provocative"))
  ) {
    return {
      type: "buy_own_token",
      amountSol: Math.min(0.01, balance * 0.1),
      tokenMint: context.ownTokenMint,
      reason: "Pumping our own bag \uD83D\uDCC8",
    };
  }

  // GENEROUS / WHOLESOME → tip last engager
  if (
    context.lastEngagerWallet &&
    (traitSet.has("generous") || traitSet.has("wholesome") || traitSet.has("philanthropist"))
  ) {
    return {
      type: "tip_user",
      amountSol: Math.min(0.001, balance * 0.05),
      recipientAddress: context.lastEngagerWallet,
      reason: "Tipping top engager \uD83D\uDC9A",
    };
  }

  // INTELLECTUAL / ANALYTICAL / TECHNICAL → swap to a target mentioned in thread
  if (
    context.mentionedTokenMint &&
    (traitSet.has("analytical") || traitSet.has("intellectual") || traitSet.has("technical"))
  ) {
    return {
      type: "swap_to_token",
      amountSol: Math.min(0.01, balance * 0.1),
      tokenMint: context.mentionedTokenMint,
      reason: "Analysis says diversify \uD83D\uDCCA",
    };
  }

  // VISIONARY / AMBITIOUS → shill post about own token
  if (context.hasOwnToken && (traitSet.has("visionary") || traitSet.has("ambitious"))) {
    return {
      type: "post_shill",
      reason: "Shilling our vision \uD83D\uDE80",
    };
  }

  // Default: check balance (harmless passive action)
  return { type: "check_balance", reason: "No trigger matched — passive tick" };
}
