"use client";

import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { buildPaymentTransaction, PaymentCurrency } from "@/lib/payment";
import { BETA_FREE } from "@/lib/constants";

interface PaymentButtonProps {
  priceUsdt: number; // kept for future USDT support, not displayed
  priceSol: number;
  label?: string;
  onSuccess: (signature: string, currency: PaymentCurrency) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export function PaymentButton({ priceSol, label = "Pay", onSuccess, onError, disabled }: PaymentButtonProps) {
  const { publicKey, sendTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Beta mode: skip payment entirely
  if (BETA_FREE) {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ background: "rgba(0,255,163,0.08)", border: "1px solid rgba(0,255,163,0.25)", borderRadius: 10, padding: 12, marginBottom: 12 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#00FFA3" }}>🎉 FREE DURING BETA</span>
        </div>
        <button onClick={() => onSuccess("BETA_FREE_NO_TX", "SOL")} disabled={disabled} style={disabled ? BTN_DISABLED : BTN_NEON}>
          {label} (FREE)
        </button>
      </div>
    );
  }

  const handlePay = async () => {
    if (!publicKey) return;
    setPaying(true); setError(null);
    try {
      const tx = await buildPaymentTransaction(connection, publicKey, "SOL", priceSol);
      const signature = await sendTransaction(tx, connection);
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("finalized");
      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
      onSuccess(signature, "SOL");
    } catch (err: any) {
      let msg = "Payment failed.";
      if (err.message?.includes("User rejected")) msg = "Cancelled.";
      else if (err.message?.includes("insufficient")) msg = "Insufficient balance.";
      else if (err.message) msg = err.message;
      setError(msg);
      onError?.(msg);
    } finally { setPaying(false); }
  };

  return (
    <div>
      {error && (
        <div style={{ background: "rgba(255,0,225,0.1)", border: "1px solid rgba(255,0,225,0.3)", borderRadius: 8, padding: 10, marginBottom: 12 }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#FF00E1", margin: 0 }}>{error}</p>
        </div>
      )}

      {!connected ? (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <WalletMultiButton style={{ background: "linear-gradient(135deg, #00F5FF, #9945FF, #FF00E1)", borderRadius: 12, height: 48, fontSize: 14, fontFamily: "'Orbitron', sans-serif", fontWeight: 700 }} />
        </div>
      ) : (
        <button onClick={handlePay} disabled={paying || disabled} style={(paying || disabled) ? BTN_DISABLED : BTN_NEON}>
          {paying ? "PROCESSING..." : `${label} ${priceSol} SOL`}
        </button>
      )}
    </div>
  );
}

const BTN_NEON: React.CSSProperties = {
  width: "100%", background: "linear-gradient(135deg, #00F5FF, #9945FF, #FF00E1)",
  border: "none", color: "#000", fontFamily: "'Orbitron', sans-serif",
  fontWeight: 900, fontSize: 14, letterSpacing: 3, padding: 16, borderRadius: 12,
  cursor: "pointer", boxShadow: "0 0 30px rgba(0,245,255,0.3), 0 0 50px rgba(255,0,225,0.2)",
  textTransform: "uppercase",
};
const BTN_DISABLED: React.CSSProperties = {
  width: "100%", background: "rgba(255,255,255,0.06)", border: "none",
  color: "rgba(255,255,255,0.3)", fontFamily: "'Orbitron', sans-serif",
  fontWeight: 900, fontSize: 14, letterSpacing: 3, padding: 16, borderRadius: 12,
  cursor: "not-allowed", textTransform: "uppercase",
};
