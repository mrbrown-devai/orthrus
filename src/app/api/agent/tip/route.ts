import { NextRequest, NextResponse } from "next/server";
import { getAgentKeypair, transferSol } from "@/lib/agent-kit";

export async function POST(request: NextRequest) {
  try {
    const { agentId, recipientAddress, amountSol } = await request.json();
    if (!agentId || !recipientAddress || !amountSol) {
      return NextResponse.json({ error: "agentId, recipientAddress, amountSol required" }, { status: 400 });
    }
    if (amountSol > 0.1) {
      return NextResponse.json({ error: "Tip amount too high (max 0.1 SOL for safety)" }, { status: 400 });
    }

    const keypair = await getAgentKeypair(agentId);
    if (!keypair) return NextResponse.json({ error: "No wallet found" }, { status: 404 });

    const signature = await transferSol(keypair, recipientAddress, amountSol);

    // Award XP (best-effort)
    let xpResult: any = null;
    try {
      const { awardXp } = await import("@/lib/xp-store");
      const { getAgent } = await import("@/lib/agent-registry");
      const { XP_REWARDS } = await import("@/lib/leveling");
      const config = await getAgent(agentId);
      xpResult = await awardXp(agentId, XP_REWARDS.tip, config?.plan);
    } catch (e) { console.error("XP award failed (non-fatal):", e); }

    return NextResponse.json({
      success: true,
      signature,
      solscanUrl: `https://solscan.io/tx/${signature}`,
      xp: xpResult,
    });
  } catch (error) {
    console.error("Tip error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Tip failed" }, { status: 500 });
  }
}
