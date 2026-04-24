import { NextRequest, NextResponse } from "next/server";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { PUMP_FUN_REFERRAL_WALLET } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const { name, symbol, description, creatorWallet, personas } = await request.json();

    if (!name || !symbol) {
      return NextResponse.json({ error: "Token name and symbol required" }, { status: 400 });
    }

    const mintKeypair = Keypair.generate();
    const tokenAddress = mintKeypair.publicKey.toBase58();
    const personaDesc = personas?.map((p: any) => `${p.name} (${p.weight}%)`).join(" \u00D7 ") || "";
    const fullDescription = description || `${name} ($${symbol}) - An Orthrus fusion of ${personaDesc}. Forged on orthrus.fun`;

    const pumpfunApiKey = process.env.PUMPFUN_API_KEY;

    if (pumpfunApiKey) {
      try {
        const response = await fetch("https://pumpportal.fun/api/trade-local", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            publicKey: creatorWallet,
            action: "create",
            tokenMetadata: { name, symbol, description: fullDescription },
            mint: bs58.encode(mintKeypair.secretKey),
            denominatedInSol: "true",
            amount: 0,
            slippage: 10,
            priorityFee: 0.0005,
            pool: "pump",
            // Orthrus referral wallet earns passive revenue on every trade
            referralAddress: PUMP_FUN_REFERRAL_WALLET,
          }),
        });
        if (response.ok) {
          const data = await response.json();
          return NextResponse.json({
            success: true,
            tokenAddress: data.mint || tokenAddress,
            pumpfunUrl: `https://pump.fun/coin/${data.mint || tokenAddress}`,
            network: "mainnet-beta",
            method: "pumpfun-api",
          });
        }
      } catch (e) {
        console.log("PumpFun API call failed, using simulation:", e);
      }
    }

    // Simulation mode
    return NextResponse.json({
      success: true,
      tokenAddress,
      pumpfunUrl: `https://pump.fun/coin/${tokenAddress}`,
      network: "mainnet-beta",
      method: "simulation",
      message: "Token address generated. Set PUMPFUN_API_KEY for real launches.",
      metadata: { name, symbol, description: fullDescription, personas: personaDesc },
    });
  } catch (error) {
    console.error("Token launch error:", error);
    return NextResponse.json({ error: "Failed to launch token" }, { status: 500 });
  }
}
