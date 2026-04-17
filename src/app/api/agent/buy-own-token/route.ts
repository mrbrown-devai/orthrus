import { NextRequest, NextResponse } from "next/server";
import { getAgentKeypair, buyTokenWithSol } from "@/lib/agent-kit";

export async function POST(request: NextRequest) {
  try {
    const { agentId, tokenMint, amountSol } = await request.json();
    if (!agentId || !tokenMint || !amountSol) {
      return NextResponse.json({ error: "agentId, tokenMint, amountSol required" }, { status: 400 });
    }
    if (amountSol > 0.5) {
      return NextResponse.json({ error: "Buy amount too high (max 0.5 SOL for safety)" }, { status: 400 });
    }

    const keypair = await getAgentKeypair(agentId);
    if (!keypair) return NextResponse.json({ error: "No wallet found" }, { status: 404 });

    const signature = await buyTokenWithSol(keypair, tokenMint, amountSol);
    return NextResponse.json({
      success: true,
      signature,
      solscanUrl: `https://solscan.io/tx/${signature}`,
      pumpfunUrl: `https://pump.fun/coin/${tokenMint}`,
    });
  } catch (error) {
    console.error("Buy own token error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Buy failed" }, { status: 500 });
  }
}
