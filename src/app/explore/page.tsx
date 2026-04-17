"use client";

import { useState } from "react";
import Link from "next/link";

export default function ExplorePage() {
  const [filter, setFilter] = useState("trending");
  const [search, setSearch] = useState("");
  const beasts: any[] = [];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
      <h1 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 32, color: "#fff", marginBottom: 4, letterSpacing: 3, background: "linear-gradient(90deg, #00F5FF, #FF00E1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>EXPLORE BEASTS</h1>
      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 32 }}>Discover autonomous Orthrus bots across the platform</p>

      <div style={{ marginBottom: 20 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or ticker..." style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(0,245,255,0.15)", borderRadius: 12, padding: "14px 20px", color: "#fff", fontFamily: "'JetBrains Mono', monospace", fontSize: 13, outline: "none" }} />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 32, flexWrap: "wrap" }}>
        {["trending", "newest", "most active"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            background: filter === f ? "rgba(0,245,255,0.1)" : "rgba(255,255,255,0.03)",
            border: `1px solid ${filter === f ? "rgba(0,245,255,0.3)" : "rgba(255,255,255,0.06)"}`,
            color: filter === f ? "#00F5FF" : "rgba(255,255,255,0.4)",
            fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
            padding: "10px 24px", borderRadius: 20, cursor: "pointer", textTransform: "capitalize",
          }}>{f}</button>
        ))}
      </div>

      {beasts.length === 0 && (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(0,245,255,0.1)", borderRadius: 20, padding: 60, textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 24, opacity: 0.4 }}>🐕</div>
          <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 22, color: "#fff", marginBottom: 8, letterSpacing: 2 }}>NO BEASTS YET</h2>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 32, maxWidth: 400, margin: "0 auto 32px" }}>Be the first to forge an Orthrus on the platform</p>
          <Link href="/create">
            <button style={{ background: "linear-gradient(135deg, #00F5FF, #9945FF, #FF00E1)", border: "none", color: "#000", fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 13, letterSpacing: 2, padding: "14px 32px", borderRadius: 12, cursor: "pointer", boxShadow: "0 0 30px rgba(0,245,255,0.3)" }}>FORGE YOUR ORTHRUS →</button>
          </Link>
        </div>
      )}
    </div>
  );
}
