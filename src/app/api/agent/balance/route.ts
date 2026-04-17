import { NextRequest, NextResponse } from "next/server";
import { getAgentKeypair, getSolBalance, getTokenBalances } from "@/lib/agent-kit";

export async function POST(request: NextRequest) {
  try {
    const { agentId } = await request.json();
    if (!agentId) return NextResponse.json({ error: "agentId required" }, { status: 400 });

    const keypair = await getAgentKeypair(agentId);
    if (!keypair) return NextResponse.json({ error: "No wallet found for this agent" }, { status: 404 });

    const address = keypair.publicKey.toBase58();
    const [sol, tokens] = await Promise.all([getSolBalance(address), getTokenBalances(address)]);

    return NextResponse.json({ success: true, address, sol, tokens });
  } catch (error) {
    console.error("Balance error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}
