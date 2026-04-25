// Real PumpFun token launch via pumpportal.fun /api/trade-local.
// Flow: upload metadata (with image) to pump.fun/api/ipfs → get URI → use in trade-local.

import { NextRequest, NextResponse } from "next/server";
import { Keypair, VersionedTransaction } from "@solana/web3.js";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://orthrus-theta.vercel.app";

export async function POST(request: NextRequest) {
  try {
    const { name, symbol, description, creatorWallet, personas, imageDataUrl, imageUrl, twitter, telegram, website, initialBuySol } = await request.json();

    if (!name || !symbol) {
      return NextResponse.json({ error: "Token name and symbol required" }, { status: 400 });
    }
    if (!creatorWallet) {
      return NextResponse.json({ error: "Creator wallet required" }, { status: 400 });
    }

    const personaDesc = personas?.map((p: any) => `${p.name} (${p.weight}%)`).join(" x ") || "";
    const fullDescription = description || `${name} ($${symbol}) - An Orthrus fusion of ${personaDesc}. Forged on orthrus.fun`;

    // 1. Prepare image blob — priority: user-uploaded data URL > user-provided imageUrl > Orthrus logo
    let imageBlob: Blob | null = null;

    if (imageDataUrl && typeof imageDataUrl === "string" && imageDataUrl.startsWith("data:")) {
      // Decode base64 data URL into a blob
      try {
        const match = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          const mime = match[1];
          const b64 = match[2];
          const buf = Buffer.from(b64, "base64");
          imageBlob = new Blob([buf], { type: mime });
        }
      } catch (e) { console.log("[launch-token] failed to decode image data URL:", e); }
    }

    if (!imageBlob) {
      const imgSource = imageUrl || `${APP_URL}/logo.png`;
      try {
        const imgRes = await fetch(imgSource);
        if (imgRes.ok) imageBlob = await imgRes.blob();
      } catch (e) { console.log("[launch-token] failed to fetch default image:", e); }
    }

    if (!imageBlob) {
      return NextResponse.json({ error: "Failed to prepare token image. Try again." }, { status: 500 });
    }

    // 2. Upload metadata + image to pump.fun's IPFS
    const metaForm = new FormData();
    metaForm.append("file", imageBlob, "token.png");
    metaForm.append("name", name.slice(0, 32));
    metaForm.append("symbol", symbol.slice(0, 10));
    metaForm.append("description", fullDescription.slice(0, 500));
    metaForm.append("twitter", twitter || "");
    metaForm.append("telegram", telegram || "");
    metaForm.append("website", website || "https://orthrus-theta.vercel.app");
    metaForm.append("showName", "true");

    const ipfsRes = await fetch("https://pump.fun/api/ipfs", {
      method: "POST",
      body: metaForm,
    });

    if (!ipfsRes.ok) {
      const errTxt = await ipfsRes.text();
      console.error("[launch-token] pump.fun IPFS error:", ipfsRes.status, errTxt);
      return NextResponse.json(
        { error: `Metadata upload failed (${ipfsRes.status}). ${errTxt.slice(0, 150)}` },
        { status: 502 }
      );
    }
    const ipfsData = await ipfsRes.json();
    const metadataUri = ipfsData.metadataUri || ipfsData.metadata_uri || ipfsData.uri;

    if (!metadataUri) {
      console.error("[launch-token] No metadataUri in IPFS response:", ipfsData);
      return NextResponse.json({ error: "Metadata upload returned no URI" }, { status: 502 });
    }

    // 3. Generate mint keypair for the token
    const mintKeypair = Keypair.generate();

    // 4. Call pumpportal to build the launch transaction
    // CRITICAL: `mint` field must be the PUBLIC KEY (base58), not the secret key.
    // Pumpportal uses it to reserve the mint address; we sign with the secret locally below.
    const pumpPayload = {
      publicKey: creatorWallet,
      action: "create",
      tokenMetadata: {
        name: name.slice(0, 32),
        symbol: symbol.slice(0, 10),
        uri: metadataUri,
      },
      mint: mintKeypair.publicKey.toBase58(),
      denominatedInSol: "true",
      // initialBuySol = optional dev buy in SOL bundled with creation tx.
      // Coerced + clamped server-side (0 to 10 SOL) for safety.
      amount: Math.max(0, Math.min(10, Number(initialBuySol) || 0)),
      slippage: 10,
      priorityFee: 0.0005,
      pool: "pump",
    };

    const response = await fetch("https://pumpportal.fun/api/trade-local", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pumpPayload),
    });

    if (!response.ok) {
      const errTxt = await response.text();
      console.error("[launch-token] Pumpportal error:", response.status, errTxt);
      return NextResponse.json(
        { error: `Pumpportal returned ${response.status}. ${errTxt.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const txBytes = new Uint8Array(await response.arrayBuffer());
    if (txBytes.length === 0) {
      return NextResponse.json({ error: "Empty transaction from Pumpportal" }, { status: 502 });
    }

    const tx = VersionedTransaction.deserialize(txBytes);
    tx.sign([mintKeypair]);

    const partialTxB64 = Buffer.from(tx.serialize()).toString("base64");

    return NextResponse.json({
      success: true,
      tokenAddress: mintKeypair.publicKey.toBase58(),
      pumpfunUrl: `https://pump.fun/coin/${mintKeypair.publicKey.toBase58()}`,
      partialTx: partialTxB64,
      metadataUri,
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
