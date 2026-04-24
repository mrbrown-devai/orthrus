// Dual-currency payment helpers (SOL + USDT on Solana)
import {
  Connection, PublicKey, Transaction, SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress, createAssociatedTokenAccountInstruction,
  createTransferInstruction, TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { TREASURY_ADDRESS, USDT_MINT, USDT_DECIMALS, BETA_FREE } from "./constants";

export type PaymentCurrency = "SOL" | "USDT";

export interface PaymentRequest {
  currency: PaymentCurrency;
  amount: number;   // human-readable (0.12 SOL or 10 USDT)
  reason: string;   // "forge" | "subscribe-degen" | etc.
  agentId?: string;
}

/**
 * Build a transaction to pay the Orthrus treasury.
 * Returns an unsigned Transaction — caller signs + sends via wallet.
 */
export async function buildPaymentTransaction(
  connection: Connection,
  fromPubkey: PublicKey,
  currency: PaymentCurrency,
  amount: number
): Promise<Transaction> {
  const treasuryPubkey = new PublicKey(TREASURY_ADDRESS);
  const tx = new Transaction();

  if (currency === "SOL") {
    tx.add(SystemProgram.transfer({
      fromPubkey,
      toPubkey: treasuryPubkey,
      lamports: Math.floor(amount * LAMPORTS_PER_SOL),
    }));
  } else {
    // USDT (SPL Token transfer)
    const usdtMint = new PublicKey(USDT_MINT);
    const fromAta = await getAssociatedTokenAddress(usdtMint, fromPubkey);
    const toAta = await getAssociatedTokenAddress(usdtMint, treasuryPubkey);

    // Check if treasury ATA exists; if not, create it
    const toAtaInfo = await connection.getAccountInfo(toAta);
    if (!toAtaInfo) {
      tx.add(createAssociatedTokenAccountInstruction(
        fromPubkey,
        toAta,
        treasuryPubkey,
        usdtMint
      ));
    }

    tx.add(createTransferInstruction(
      fromAta,
      toAta,
      fromPubkey,
      Math.floor(amount * Math.pow(10, USDT_DECIMALS)),
      [],
      TOKEN_PROGRAM_ID
    ));
  }

  const { blockhash } = await connection.getLatestBlockhash("finalized");
  tx.recentBlockhash = blockhash;
  tx.feePayer = fromPubkey;

  return tx;
}

/**
 * Check if we should enforce payment (true) or skip it (beta mode, true/false flag).
 */
export function isPaymentRequired(): boolean {
  return !BETA_FREE;
}
