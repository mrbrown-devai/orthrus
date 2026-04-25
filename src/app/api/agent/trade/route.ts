import { NextRequest, NextResponse } from "next/server";
import { getAgentKeypair, jupiterSwap } from "@/lib/agent-kit";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export async function POST(request: NextRequest) {
  try {
    const { agentId, inputMint, outputMint, amount, slippageBps } = await request.json();
    if (!agentId || !inputMint || !outputMint || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const keypair = await getAgentKeypair(agentId);
    if (!keypair) return NextResponse.json({ error: "No wallet found" }, { status: 404 });

    // Safety: cap SOL input at 1 SOL
    const WRAPPED_SOL = "So11111111111111111111111111111111111111112";
    if (inputMint === WRAPPED_SOL && amount > LAMPORTS_PER_SOL) {
      return NextResponse.json({ error: "Swap amount too high (max 1 SOL for safety)" }, { status: 400 });
    }

    const signature = await jupiterSwap(keypair, inputMint, outputMint, amount, slippageBps || 300);

    // Award XP (best-effort)
    let xpResult: any = null;
    try {
      const { awardXp } = await import("@/lib/xp-store");
      const { getAgent } = await import("@/lib/agent-registry");
      const { XP_REWARDS } = await import("@/lib/leveling");
      const config = await getAgent(agentId);
      xpResult = await awardXp(agentId, XP_REWARDS.swap, config?.plan);
    } catch (e) { console.error("XP award failed (non-fatal):", e); }

    return NextResponse.json({
      success: true,
      signature,
      solscanUrl: `https://solscan.io/tx/${signature}`,
      xp: xpResult,
    });
  } catch (error) {
    console.error("Trade error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Trade failed" }, { status: 500 });
  }
}
