import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { encryptKey } from "@/lib/crypto";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

// POST: Encrypt and store agent's private key in httpOnly cookie
export async function POST(request: NextRequest) {
  try {
    const { agentId, privateKey } = await request.json();
    if (!agentId || !privateKey) {
      return NextResponse.json({ error: "agentId and privateKey required" }, { status: 400 });
    }

    // Verify the key is valid by attempting to derive a keypair
    try {
      Keypair.fromSecretKey(bs58.decode(privateKey));
    } catch {
      return NextResponse.json({ error: "Invalid private key" }, { status: 400 });
    }

    const encrypted = encryptKey(privateKey);
    const cookieStore = await cookies();
    cookieStore.set(`orthrus_agent_key_${agentId}`, encrypted, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Store key error:", error);
    return NextResponse.json({ error: "Failed to store key" }, { status: 500 });
  }
}
