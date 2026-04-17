// Orthrus Agent toolkit: wraps Solana web3.js + Jupiter for autonomous actions
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL, VersionedTransaction } from "@solana/web3.js";
import bs58 from "bs58";
import { cookies } from "next/headers";
import { decryptKey } from "./crypto";
import { SOLANA_RPC_URL } from "./constants";

// Load agent keypair from encrypted cookie
export async function getAgentKeypair(agentId: string): Promise<Keypair | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(`orthrus_agent_key_${agentId}`);
  if (!cookie) return null;
  try {
    const privateKey = decryptKey(cookie.value);
    return Keypair.fromSecretKey(bs58.decode(privateKey));
  } catch (e) {
    console.error("Failed to decrypt agent key:", e);
    return null;
  }
}

export function getConnection(): Connection {
  return new Connection(SOLANA_RPC_URL, "confirmed");
}

// Transfer SOL
export async function transferSol(
  keypair: Keypair,
  recipientAddress: string,
  amountSol: number
): Promise<string> {
  const conn = getConnection();
  const recipient = new PublicKey(recipientAddress);
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: keypair.publicKey,
      toPubkey: recipient,
      lamports: Math.floor(amountSol * LAMPORTS_PER_SOL),
    })
  );
  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash("finalized");
  tx.recentBlockhash = blockhash;
  tx.feePayer = keypair.publicKey;
  tx.sign(keypair);
  const sig = await conn.sendRawTransaction(tx.serialize());
  await conn.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
  return sig;
}

// Get SOL balance
export async function getSolBalance(address: string): Promise<number> {
  const conn = getConnection();
  const lamports = await conn.getBalance(new PublicKey(address));
  return lamports / LAMPORTS_PER_SOL;
}

// Get SPL token balances
export async function getTokenBalances(address: string): Promise<{ mint: string; amount: number; decimals: number }[]> {
  const conn = getConnection();
  const TOKEN_PROGRAM = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
  try {
    const accounts = await conn.getParsedTokenAccountsByOwner(new PublicKey(address), { programId: TOKEN_PROGRAM });
    return accounts.value.map(a => {
      const info = a.account.data.parsed.info;
      return {
        mint: info.mint,
        amount: info.tokenAmount.uiAmount || 0,
        decimals: info.tokenAmount.decimals,
      };
    }).filter(t => t.amount > 0);
  } catch (e) {
    console.error("Failed to get token balances:", e);
    return [];
  }
}

// Jupiter swap (uses Jupiter v6 API)
export async function jupiterSwap(
  keypair: Keypair,
  inputMint: string,
  outputMint: string,
  amount: number, // in smallest unit (lamports for SOL, or token units)
  slippageBps: number = 300
): Promise<string> {
  const conn = getConnection();

  // 1. Get quote from Jupiter
  const quoteRes = await fetch(
    `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}`
  );
  if (!quoteRes.ok) throw new Error(`Jupiter quote failed: ${await quoteRes.text()}`);
  const quote = await quoteRes.json();

  // 2. Get swap transaction
  const swapRes = await fetch("https://quote-api.jup.ag/v6/swap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey: keypair.publicKey.toBase58(),
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: "auto",
    }),
  });
  if (!swapRes.ok) throw new Error(`Jupiter swap failed: ${await swapRes.text()}`);
  const { swapTransaction } = await swapRes.json();

  // 3. Sign and send
  const txBuf = Buffer.from(swapTransaction, "base64");
  const tx = VersionedTransaction.deserialize(txBuf);
  tx.sign([keypair]);
  const sig = await conn.sendRawTransaction(tx.serialize(), { skipPreflight: false, maxRetries: 3 });
  await conn.confirmTransaction(sig, "confirmed");
  return sig;
}

// Shortcut: buy a token with SOL
export async function buyTokenWithSol(
  keypair: Keypair,
  outputTokenMint: string,
  solAmount: number,
  slippageBps: number = 500
): Promise<string> {
  const WRAPPED_SOL = "So11111111111111111111111111111111111111112";
  return jupiterSwap(keypair, WRAPPED_SOL, outputTokenMint, Math.floor(solAmount * LAMPORTS_PER_SOL), slippageBps);
}
