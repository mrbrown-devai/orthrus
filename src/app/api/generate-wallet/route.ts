import { NextResponse } from "next/server";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

export async function POST() {
  try {
    const keypair = Keypair.generate();
    return NextResponse.json({
      success: true,
      address: keypair.publicKey.toBase58(),
      privateKey: bs58.encode(keypair.secretKey),
    });
  } catch (error) {
    console.error("Wallet generation error:", error);
    return NextResponse.json({ error: "Failed to generate wallet" }, { status: 500 });
  }
}
