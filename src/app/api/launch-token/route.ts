// Real PumpFun token launch via pumpportal.fun /api/trade-local
// Returns a partially-signed transaction (mint keypair signed server-side)
// Client adds wallet signature and broadcasts to Solana.

import { NextRequest, NextResponse } from "next/server";
import { Keypair, VersionedTransaction } from "@solana/web3.js";
import bs58 from "bs58";

export async function POST(request: NextRequest) {
  try {
    const { name, symbol, description, creatorWallet, personas, image } = await request.json();

    if (!name || !symbol) {
      return NextResponse.json({ error: "Token name and symbol required" }, { status: 400 });
    }
    if (!creatorWallet) {
      return NextResponse.json({ error: "Creator wallet required" }, { status: 400 });
    }

    // Persona description
    const personaDesc = personas?.map((p: any) => `${p.name} (${p.weight}%)`).join(" x ") || "";
    const fullDescription = description || `${name} ($${symbol}) - An Orthrus fusion of ${personaDesc}. Forged on orthrus.fun`;

    // Generate a new mint keypair for this token
    const mintKeypair = Keypair.generate();

    // Call pumpportal to build the launch transaction
    const pumpPayload: any = {
      publicKey: creatorWallet,
      action: "create",
      tokenMetadata: {
        name: name.slice(0, 32),
        symbol: symbol.slice(0, 10),
        description: fullDescription.slice(0, 500),
      },
      mint: bs58.encode(mintKeypair.secretKey),
      denominatedInSol: "true",
      amount: 0, // initial dev buy amount in SOL (0 = just create, no buy)
      slippage: 10,
      priorityFee: 0.0005,
      pool: "pump",
    };

    // NOTE: Pumpportal has no referral program. User keeps 100% of any
    // pump.fun creator fees. Orthrus revenue = forge fee + plan subscriptions.

    const response = await fetch("https://pumpportal.fun/api/trade-local", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pumpPayload),
    });

    if (!response.ok) {
      const errTxt = await response.text();
      console.error("[launch-token] Pumpportal error:", response.status, errTxt);
      return NextResponse.json(
        {
          error: `PumpFun service returned ${response.status}. ${errTxt.slice(0, 200)}`,
          status: response.status,
        },
        { status: 502 }
      );
    }

    // Pumpportal returns raw transaction bytes
    const txBytes = new Uint8Array(await response.arrayBuffer());
    if (txBytes.length === 0) {
      return NextResponse.json({ error: "Empty transaction from PumpFun" }, { status: 502 });
    }

    // Deserialize + sign with mint keypair
    const tx = VersionedTransaction.deserialize(txBytes);
    tx.sign([mintKeypair]);

    // Serialize the partially-signed tx (base64) for client
    const partialTxB64 = Buffer.from(tx.serialize()).toString("base64");

    return NextResponse.json({
      success: true,
      tokenAddress: mintKeypair.publicKey.toBase58(),
      pumpfunUrl: `https://pump.fun/coin/${mintKeypair.publicKey.toBase58()}`,
      partialTx: partialTxB64,
      method: "pumpportal-local",
      metadata: { name, symbol, description: fullDescription, personas: personaDesc },
    });
  } catch (error) {
    console.error("Token launch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to launch token" },
      { status: 500 }
    );
  }
}
