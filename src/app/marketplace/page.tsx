"use client";

import { useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

interface Listing {
  id: string; name: string; description: string; price: number; posts: number; impressions: number; featured?: boolean; tokenTicker?: string;
}

const MOCK_LISTINGS: Listing[] = [
  { id: "l1", name: "CryptoVisionary", description: "Vitalik \u00D7 Elon Musk", price: 15, posts: 847, impressions: 2340000, featured: true, tokenTicker: "CVSN" },
  { id: "l2", name: "MemeLord Supreme", description: "MrBeast \u00D7 Andrew Tate", price: 25, posts: 1203, impressions: 5670000, featured: true, tokenTicker: "MEME" },
  { id: "l3", name: "PhiloTech", description: "Naval \u00D7 Joe Rogan", price: 8, posts: 562, impressions: 890000 },
];

export default function MarketplacePage() {
  const { connected } = useWallet();
  const [activeTab, setActiveTab] = useState<"browse" | "sell">("browse");

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <h1 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 40, color: "#fff", marginBottom: 8, letterSpacing: 4, background: "linear-gradient(90deg, #00F5FF, #9945FF, #FF00E1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>BEAST MARKET</h1>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: "rgba(255,255,255,0.5)" }}>Buy proven Orthrus bots or sell your creations</p>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 32 }}>
        {(["browse", "sell"] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{
            padding: "12px 32px", borderRadius: 12, cursor: "pointer",
            background: activeTab === t ? "linear-gradient(135deg, #00F5FF, #9945FF, #FF00E1)" : "rgba(255,255,255,0.03)",
            border: activeTab === t ? "none" : "1px solid rgba(255,255,255,0.08)",
            color: activeTab === t ? "#000" : "rgba(255,255,255,0.5)",
            fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 13, letterSpacing: 2,
          }}>{t === "browse" ? "\uD83D\uDED2 BROWSE" : "\uD83D\uDCB0 SELL"}</button>
        ))}
      </div>

      {activeTab === "browse" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {MOCK_LISTINGS.map(l => (
            <div key={l.id} style={{
              background: l.featured ? "linear-gradient(135deg, rgba(0,245,255,0.08), rgba(255,0,225,0.05))" : "rgba(255,255,255,0.02)",
              border: `1px solid ${l.featured ? "rgba(0,245,255,0.3)" : "rgba(255,255,255,0.06)"}`,
              borderRadius: 16, padding: 24,
              boxShadow: l.featured ? "0 0 30px rgba(0,245,255,0.1)" : "none",
            }}>
              {l.featured && <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 9, color: "#00F5FF", letterSpacing: 3, marginBottom: 12, fontWeight: 900 }}>\u2B50 FEATURED</div>}
              <h4 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 20, color: "#fff", marginBottom: 6, letterSpacing: 1 }}>{l.name}</h4>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 16 }}>{l.description}</p>

              <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.4)" }}>\uD83D\uDCDD {l.posts}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.4)" }}>\uD83D\uDC41\uFE0F {(l.impressions/1e6).toFixed(1)}M</div>
                {l.tokenTicker && <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#00FFA3" }}>${l.tokenTicker}</div>}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 22, color: "#00F5FF", letterSpacing: 1 }}>{l.price} <span style={{ fontSize: 11, color: "#9945FF" }}>SOL</span></div>
                <button onClick={() => alert(`Buy ${l.name} for ${l.price} SOL`)} style={{ padding: "8px 20px", borderRadius: 8, cursor: "pointer", background: "linear-gradient(135deg, #00F5FF, #FF00E1)", border: "none", color: "#000", fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 11, letterSpacing: 1 }}>BUY</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "sell" && (
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(0,245,255,0.15)", borderRadius: 20, padding: 48 }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>🏪</div>
            <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 20, color: "#fff", marginBottom: 8, letterSpacing: 2 }}>COMING SOON</h3>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>List your Orthrus bots for sale on Solana.</p>
            <Link href="/create" style={{ display: "inline-block", padding: "14px 32px", borderRadius: 12, background: "linear-gradient(135deg, #00F5FF, #9945FF, #FF00E1)", color: "#000", fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 13, letterSpacing: 2, textDecoration: "none" }}>+ FORGE FIRST</Link>
          </div>
        </div>
      )}
    </div>
  );
}
