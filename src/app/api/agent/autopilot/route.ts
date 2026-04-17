import { NextRequest, NextResponse } from "next/server";
import { getAgentKeypair, getSolBalance, transferSol, buyTokenWithSol } from "@/lib/agent-kit";
import { suggestAction, AutopilotContext } from "@/lib/triggers";

// POST: Run one autopilot cycle for an agent
// Body: { agentId, traits, hasOwnToken?, ownTokenMint?, lastEngagerWallet?, mentionedTokenMint? }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, traits } = body;
    if (!agentId || !traits || !Array.isArray(traits)) {
      return NextResponse.json({ error: "agentId and traits[] required" }, { status: 400 });
    }

    const keypair = await getAgentKeypair(agentId);
    if (!keypair) return NextResponse.json({ error: "No wallet found for this agent" }, { status: 404 });

    const address = keypair.publicKey.toBase58();
    const balance = await getSolBalance(address);

    const context: AutopilotContext = {
      hasOwnToken: !!body.ownTokenMint,
      ownTokenMint: body.ownTokenMint,
      lastEngagerWallet: body.lastEngagerWallet,
      mentionedTokenMint: body.mentionedTokenMint,
      agentBalanceSol: balance,
    };

    const action = suggestAction(traits, context);
    if (!action) {
      return NextResponse.json({ success: true, action: null, message: "No action suggested" });
    }

    // Execute the chosen action
    let signature: string | undefined;
    let executedMessage = action.reason;
    try {
      switch (action.type) {
        case "buy_own_token":
          if (action.tokenMint && action.amountSol) {
            signature = await buyTokenWithSol(keypair, action.tokenMint, action.amountSol);
          }
          break;
        case "tip_user":
          if (action.recipientAddress && action.amountSol) {
            signature = await transferSol(keypair, action.recipientAddress, action.amountSol);
          }
          break;
        case "swap_to_token":
          if (action.tokenMint && action.amountSol) {
            signature = await buyTokenWithSol(keypair, action.tokenMint, action.amountSol);
          }
          break;
        case "check_balance":
          executedMessage = `Balance check: ${balance.toFixed(4)} SOL`;
          break;
        case "post_shill":
          executedMessage = "Shill post queued (handle via generate-post separately)";
          break;
      }
    } catch (e) {
      return NextResponse.json({
        success: false,
        action,
        error: e instanceof Error ? e.message : "Action execution failed",
      });
    }

    return NextResponse.json({
      success: true,
      action,
      signature,
      solscanUrl: signature ? `https://solscan.io/tx/${signature}` : undefined,
      message: executedMessage,
      balance,
      executedAt: Date.now(),
    });
  } catch (error) {
    console.error("Autopilot error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Autopilot failed" }, { status: 500 });
  }
}
