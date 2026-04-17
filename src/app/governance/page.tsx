"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

interface VoteMatch {
  id: string;
  personaA: { name: string; description: string; traits: string[] };
  personaB: { name: string; description: string; traits: string[] };
  votesA: number; votesB: number; hasVoted: boolean; userVote?: "a" | "b";
}

const FEATURED_MATCHES: VoteMatch[] = [
  { id: "m1", personaA: { name: "Elon Musk", description: "Tech visionary, SpaceX & Tesla CEO, meme lord", traits: ["visionary", "provocative", "memetic"] }, personaB: { name: "Kanye West", description: "Creative genius, fashion mogul, cultural provocateur", traits: ["creative", "unpredictable", "grandiose"] }, votesA: 247, votesB: 189, hasVoted: false },
  { id: "m2", personaA: { name: "Donald Trump", description: "45th/47th US President, media personality, dealmaker", traits: ["bold", "confrontational", "media-savvy"] }, personaB: { name: "Joe Rogan", description: "Podcaster, comedian, UFC commentator, free thinker", traits: ["curious", "open-minded", "authentic"] }, votesA: 312, votesB: 298, hasVoted: false },
  { id: "m3", personaA: { name: "Vitalik Buterin", description: "Ethereum co-founder, crypto philosopher, genius", traits: ["intellectual", "idealistic", "innovative"] }, personaB: { name: "MrBeast", description: "World's biggest YouTuber, philanthropist, entertainer", traits: ["generous", "ambitious", "enthusiastic"] }, votesA: 156, votesB: 203, hasVoted: false },
  { id: "m4", personaA: { name: "Andrew Tate", description: "Kickboxer, internet personality, Top G", traits: ["aggressive", "confident", "motivational"] }, personaB: { name: "Mark Zuckerberg", description: "Meta CEO, MMA fighter, metaverse visionary", traits: ["analytical", "competitive", "persistent"] }, votesA: 178, votesB: 134, hasVoted: false },
];

export default function GovernancePage() {
  const { publicKey, connected } = useWallet();
  const [matches, setMatches] = useState<VoteMatch[]>(FEATURED_MATCHES);
  const [voting, setVoting] = useState<string | null>(null);
  const totalVotes = matches.reduce((sum, m) => sum + m.votesA + m.votesB, 0);

  const handleVote = async (matchId: string, vote: "a" | "b") => {
    if (!connected || !publicKey) return;
    setVoting(matchId);
    try {
      const res = await fetch("/api/vote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ matchId, vote, voterWallet: publicKey.toBase58() }) });
      const data = await res.json();
      if (data.success) {
        setMatches(prev => prev.map(m => m.id === matchId ? { ...m, votesA: vote === "a" ? m.votesA + 1 : m.votesA, votesB: vote === "b" ? m.votesB + 1 : m.votesB, hasVoted: true, userVote: vote } : m));
      }
    } catch {} finally { setVoting(null); }
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px" }}>
      <h1 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 36, color: "#fff", marginBottom: 4, letterSpacing: 3, background: "linear-gradient(90deg, #00F5FF, #9945FF, #FF00E1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>PERSONA WARS</h1>
      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 32 }}>Vote which heads should dominate. Winners get pushed in future Orthrus fusions.</p>

      <div style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
        <div style={{ background: "rgba(0,245,255,0.08)", border: "1px solid rgba(0,245,255,0.2)", borderRadius: 12, padding: "12px 20px", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>🗳️</span>
          <div><div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 20, color: "#00F5FF" }}>{totalVotes.toLocaleString()}</div><div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: 1 }}>TOTAL VOTES</div></div>
        </div>
        <div style={{ background: "rgba(255,0,225,0.08)", border: "1px solid rgba(255,0,225,0.2)", borderRadius: 12, padding: "12px 20px", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>⚔️</span>
          <div><div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 20, color: "#FF00E1" }}>{matches.length}</div><div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: 1 }}>ACTIVE</div></div>
        </div>
      </div>

      {!connected && (
        <div style={{ background: "rgba(153,69,255,0.08)", border: "1px solid rgba(153,69,255,0.25)", borderRadius: 16, padding: 24, textAlign: "center", marginBottom: 32 }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 16 }}>Connect your Solana wallet to vote</p>
          <WalletMultiButton style={{ background: "linear-gradient(135deg, #00F5FF, #9945FF, #FF00E1)", borderRadius: 10, height: 40, fontSize: 13 }} />
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {matches.map(match => {
          const total = match.votesA + match.votesB;
          const pctA = total > 0 ? Math.round((match.votesA / total) * 100) : 50;
          const pctB = 100 - pctA;
          return (
            <div key={match.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(0,245,255,0.1)", borderRadius: 16, padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, marginBottom: 20 }}>
                <span style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 18, color: "#00F5FF", letterSpacing: 1 }}>{match.personaA.name}</span>
                <span style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 12, color: "rgba(255,255,255,0.3)", padding: "4px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 8, letterSpacing: 2 }}>VS</span>
                <span style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 18, color: "#FF00E1", letterSpacing: 1 }}>{match.personaB.name}</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                {([
                  { side: "a" as const, persona: match.personaA, color: "#00F5FF" },
                  { side: "b" as const, persona: match.personaB, color: "#FF00E1" },
                ]).map(({ side, persona, color }) => (
                  <div key={side} style={{ background: match.userVote === side ? `${color}15` : "rgba(255,255,255,0.02)", border: `1px solid ${match.userVote === side ? `${color}50` : "rgba(255,255,255,0.06)"}`, borderRadius: 12, padding: 16 }}>
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 10, lineHeight: 1.6 }}>{persona.description}</p>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{persona.traits.map(t => <span key={t} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, padding: "3px 8px", borderRadius: 6, background: `${color}15`, color }}>{t}</span>)}</div>
                    {!match.hasVoted && connected && <button onClick={() => handleVote(match.id, side)} disabled={voting === match.id} style={{ width: "100%", marginTop: 12, padding: 10, borderRadius: 8, cursor: "pointer", background: `${color}15`, border: `1px solid ${color}40`, color, fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 1 }}>{voting === match.id ? "..." : `VOTE`}</button>}
                    {match.userVote === side && <div style={{ marginTop: 12, textAlign: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color }}>\u2713 Your pick</div>}
                  </div>
                ))}
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#00F5FF" }}>{pctA}% ({match.votesA})</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#FF00E1" }}>{pctB}% ({match.votesB})</span>
                </div>
                <div style={{ height: 10, borderRadius: 5, background: "rgba(255,255,255,0.06)", overflow: "hidden", display: "flex" }}>
                  <div style={{ width: `${pctA}%`, background: "linear-gradient(90deg, #00F5FF, #9945FF)", transition: "width 0.5s" }} />
                  <div style={{ width: `${pctB}%`, background: "linear-gradient(90deg, #9945FF, #FF00E1)", transition: "width 0.5s" }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
