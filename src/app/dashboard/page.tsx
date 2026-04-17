"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useChimeraStore, ChimeraAgent } from "@/lib/store";

export default function DashboardPage() {
  return <Suspense fallback={<DashboardLoading />}><DashboardContent /></Suspense>;
}
function DashboardLoading() {
  return <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px", textAlign: "center" }}><div style={{ fontSize: 40, marginBottom: 16 }}>🐕</div><p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Loading...</p></div>;
}
function DashboardContent() {
  const { agents, currentAgentId, setCurrentAgent, updateAgent, updateAgentPersonaWeight } = useChimeraStore();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"overview" | "settings" | "posts">("overview");

  useEffect(() => {
    const twitterConnected = searchParams.get("twitter_connected");
    const agentId = searchParams.get("agentId");
    const username = searchParams.get("username");
    if (twitterConnected === "true" && agentId && username) {
      updateAgent(agentId, {
        xConnected: true, xHandle: username,
        xProfileUrl: `https://x.com/${username}`,
        activePlatforms: ["x"] as any,
      });
      window.history.replaceState({}, "", "/dashboard");
    }
  }, [searchParams, updateAgent]);

  const currentAgent = agents.find(a => a.id === currentAgentId) || agents[0];

  if (agents.length === 0) {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>🐕</div>
        <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 28, color: "#fff", marginBottom: 12, letterSpacing: 3 }}>NO ORTHRUS YET</h2>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 32 }}>Forge your first beast by fusing two icons.</p>
        <Link href="/create" style={{ display: "inline-block", background: "linear-gradient(135deg, #00F5FF, #9945FF, #FF00E1)", color: "#000", fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 14, letterSpacing: 2, padding: "14px 32px", borderRadius: 12, textDecoration: "none", boxShadow: "0 0 30px rgba(0,245,255,0.3)" }}>+ FORGE ORTHRUS</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>
      {agents.length > 1 && (
        <div style={{ display: "flex", gap: 12, marginBottom: 24, overflowX: "auto", paddingBottom: 8 }}>
          {agents.map(agent => (
            <button key={agent.id} onClick={() => setCurrentAgent(agent.id)} style={{
              padding: "12px 20px", borderRadius: 10, cursor: "pointer", whiteSpace: "nowrap",
              background: agent.id === currentAgentId ? "rgba(0,245,255,0.1)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${agent.id === currentAgentId ? "rgba(0,245,255,0.4)" : "rgba(255,255,255,0.06)"}`,
              color: agent.id === currentAgentId ? "#00F5FF" : "rgba(255,255,255,0.6)",
              fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: 1,
            }}>{agent.name}</button>
          ))}
        </div>
      )}

      {currentAgent && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
            <div>
              <h1 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 32, color: "#fff", marginBottom: 4, letterSpacing: 2 }}>{currentAgent.name}</h1>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{currentAgent.description}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: currentAgent.isActive ? "#00F5FF" : "rgba(255,255,255,0.4)" }}>
                {currentAgent.isActive ? "\u25CF LIVE" : "\u25CB PAUSED"}
              </span>
              <button onClick={() => updateAgent(currentAgent.id, { isActive: !currentAgent.isActive })} style={{
                padding: "10px 20px", borderRadius: 10, cursor: "pointer",
                background: currentAgent.isActive ? "rgba(255,0,225,0.1)" : "rgba(0,245,255,0.1)",
                border: `1px solid ${currentAgent.isActive ? "rgba(255,0,225,0.3)" : "rgba(0,245,255,0.3)"}`,
                color: currentAgent.isActive ? "#FF00E1" : "#00F5FF",
                fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 2,
              }}>{currentAgent.isActive ? "PAUSE" : "UNLEASH"}</button>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 24, borderBottom: "1px solid rgba(0,245,255,0.1)", paddingBottom: 16 }}>
            {(["overview", "settings", "posts"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: "10px 20px", borderRadius: 8, cursor: "pointer", border: "none",
                background: activeTab === tab ? "rgba(0,245,255,0.1)" : "transparent",
                color: activeTab === tab ? "#00F5FF" : "rgba(255,255,255,0.5)",
                fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: 2,
              }}>{tab}</button>
            ))}
          </div>

          {activeTab === "overview" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
                <StatCard label="Posts Today" value={currentAgent.postsToday} icon="📝" color="#00F5FF" />
                <StatCard label="Total Posts" value={currentAgent.totalPosts || 0} icon="📊" color="#9945FF" />
                <StatCard label="Impressions" value={formatNumber(currentAgent.impressionsToday || 0)} icon="👁️" color="#FF00E1" />
                <StatCard label="Total Reach" value={formatNumber(currentAgent.totalImpressions || 0)} icon="🚀" color="#00FFA3" />
              </div>

              <div style={{ marginBottom: 20 }}>
                <PlatformCard platform="X (Twitter)" icon="𝕏" connected={currentAgent.xConnected} handle={currentAgent.xHandle}
                  url={currentAgent.xProfileUrl}
                  onConnect={() => { window.location.href = `/api/auth/twitter?agentId=${currentAgent.id}`; }} />
              </div>

              {/* Memecoin */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(0,255,163,0.15)", borderRadius: 16, padding: 20, marginBottom: 20 }}>
                <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>Memecoin</div>
                {currentAgent.tokenCA ? (
                  <div>
                    <span style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 20, color: "#00FFA3", letterSpacing: 1 }}>${currentAgent.tokenTicker || "TOKEN"}</span>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 8, wordBreak: "break-all" }}>{currentAgent.tokenCA}</div>
                    <a href={`https://pump.fun/coin/${currentAgent.tokenCA}`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#00F5FF" }}>View on PumpFun →</a>
                  </div>
                ) : (
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 12 }}>No memecoin linked</p>
                    <a href="https://pump.fun" target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", padding: "10px 24px", borderRadius: 10, background: "rgba(0,255,163,0.1)", border: "1px solid rgba(0,255,163,0.3)", color: "#00FFA3", fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 12, textDecoration: "none", letterSpacing: 2 }}>🚀 LAUNCH ON PUMPFUN</a>
                  </div>
                )}
              </div>

              <PersonalityWeightCard agent={currentAgent} onWeightChange={(pId, w) => updateAgentPersonaWeight(currentAgent.id, pId, w)} />
            </div>
          )}

          {activeTab === "settings" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <SettingCard title="Posts Per Day" description="Max daily posts the beast will make">
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <input type="range" min={1} max={10} value={currentAgent.postsPerDay || 5} onChange={e => updateAgent(currentAgent.id, { postsPerDay: Number(e.target.value) })} style={{ flex: 1, accentColor: "#00F5FF" }} />
                  <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 18, color: "#00F5FF", minWidth: 40, textAlign: "center", fontWeight: 700 }}>{currentAgent.postsPerDay || 5}</span>
                </div>
              </SettingCard>
              <SettingCard title="Reply to Mentions" description="Auto-reply when mentioned">
                <ToggleSwitch enabled={currentAgent.replyToMentions ?? true} onChange={e => updateAgent(currentAgent.id, { replyToMentions: e })} />
              </SettingCard>
              <PersonalityWeightCard agent={currentAgent} onWeightChange={(pId, w) => updateAgentPersonaWeight(currentAgent.id, pId, w)} />
            </div>
          )}

          {activeTab === "posts" && (
            <div>
              <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 18, color: "#fff", marginBottom: 20, letterSpacing: 2 }}>RECENT POSTS</h3>
              {(!currentAgent.recentPosts || currentAgent.recentPosts.length === 0) ? (
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 40, textAlign: "center" }}>
                  <div style={{ fontSize: 40, marginBottom: 16 }}>📭</div>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>No posts yet. Unleash the beast!</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {currentAgent.recentPosts.slice(0, 10).map(post => <PostCard key={post.id} post={post} />)}
                </div>
              )}

              {currentAgent.xConnected && <PostTweetButton agentId={currentAgent.id} personas={currentAgent.personas} />}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  return (
    <div style={{ background: `${color}08`, border: `1px solid ${color}25`, borderRadius: 12, padding: 20, boxShadow: `0 0 20px ${color}10` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1 }}>{label}</span>
      </div>
      <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 26, color, letterSpacing: 1 }}>{value}</div>
    </div>
  );
}
function PlatformCard({ platform, icon, connected, handle, url, onConnect }: any) {
  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(0,245,255,0.15)", borderRadius: 16, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 22 }}>{icon}</span>
          <span style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 14, color: "#fff", letterSpacing: 1 }}>{platform}</span>
        </div>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: connected ? "#00F5FF" : "rgba(255,255,255,0.4)" }}>{connected ? "\u25CF LINKED" : "\u25CB NOT LINKED"}</span>
      </div>
      {connected && handle ? (
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "rgba(255,255,255,0.7)" }}>@{handle}</span>
          {url && <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#00F5FF", textDecoration: "none" }}>View →</a>}
        </div>
      ) : (
        <button onClick={onConnect} style={{ width: "100%", padding: 10, borderRadius: 8, cursor: "pointer", background: "rgba(0,245,255,0.1)", border: "1px solid rgba(0,245,255,0.3)", color: "#00F5FF", fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 2 }}>CONNECT</button>
      )}
    </div>
  );
}
function PersonalityWeightCard({ agent, onWeightChange }: any) {
  const a = agent.personas[0]; const b = agent.personas[1];
  if (!a || !b) return null;
  const w = a.weight ?? 50;
  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(153,69,255,0.2)", borderRadius: 16, padding: 24 }}>
      <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 20 }}>Head Blend</div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "#00F5FF" }}>{a.name} {w}%</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "#FF00E1" }}>{b.name} {100 - w}%</span>
      </div>
      <input type="range" min={10} max={90} value={w} onChange={e => onWeightChange(a.id, Number(e.target.value))} style={{ width: "100%", accentColor: "#00F5FF", marginBottom: 12 }} />
      <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden", display: "flex" }}>
        <div style={{ width: `${w}%`, background: "linear-gradient(90deg, #00F5FF, #9945FF)" }} />
        <div style={{ width: `${100 - w}%`, background: "linear-gradient(90deg, #9945FF, #FF00E1)" }} />
      </div>
    </div>
  );
}
function SettingCard({ title, description, children }: any) {
  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(0,245,255,0.1)", borderRadius: 16, padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 14, color: "#fff", marginBottom: 4, letterSpacing: 1 }}>{title}</h4>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{description}</p>
      </div>
      {children}
    </div>
  );
}
function ToggleSwitch({ enabled, onChange }: any) {
  return (
    <button onClick={() => onChange(!enabled)} style={{
      width: 52, height: 28, borderRadius: 14, cursor: "pointer",
      background: enabled ? "linear-gradient(135deg, #00F5FF, #FF00E1)" : "rgba(255,255,255,0.1)",
      border: "none", position: "relative", transition: "all 0.3s",
    }}>
      <div style={{ width: 22, height: 22, borderRadius: 11, background: "#fff", position: "absolute", top: 3, left: enabled ? 27 : 3, transition: "left 0.3s" }} />
    </button>
  );
}
function PostCard({ post }: any) {
  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(0,245,255,0.08)", borderRadius: 12, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.4)" }}>𝕏 {new Date(post.timestamp).toLocaleString()}</span>
        {post.url && <a href={post.url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#00F5FF" }}>View →</a>}
      </div>
      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.6, marginBottom: 12 }}>{post.content}</p>
    </div>
  );
}
function PostTweetButton({ agentId, personas }: any) {
  const [posting, setPosting] = useState(false);
  const [text, setText] = useState("");
  const [show, setShow] = useState(false);

  const gen = async () => {
    try {
      const res = await fetch("/api/generate-post", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ personas: personas.map((p: any) => p.name), platform: "x" }) });
      const d = await res.json();
      if (d.post) setText(d.post);
    } catch {}
  };
  const post = async () => {
    if (!text.trim()) return;
    setPosting(true);
    try {
      const res = await fetch("/api/tweet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agentId, text }) });
      const d = await res.json();
      if (d.success) { alert("Posted!"); setText(""); setShow(false); }
      else alert("Failed: " + d.error);
    } catch { alert("Failed"); }
    finally { setPosting(false); }
  };
  if (!show) return <button onClick={() => setShow(true)} style={{ marginTop: 12, width: "100%", padding: 14, borderRadius: 12, cursor: "pointer", background: "linear-gradient(135deg, #00F5FF, #9945FF, #FF00E1)", border: "none", color: "#000", fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 13, letterSpacing: 2 }}>𝕏 UNLEASH A POST</button>;
  return (
    <div style={{ marginTop: 12, background: "rgba(0,245,255,0.04)", border: "1px solid rgba(0,245,255,0.2)", borderRadius: 12, padding: 16 }}>
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder="What's the beast thinking?" maxLength={280} style={{ width: "100%", minHeight: 80, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: 12, color: "#fff", fontFamily: "'JetBrains Mono', monospace", fontSize: 13, marginBottom: 12 }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: text.length > 260 ? "#FF00E1" : "rgba(255,255,255,0.4)" }}>{text.length}/280</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={gen} style={{ padding: "8px 16px", borderRadius: 8, cursor: "pointer", background: "rgba(0,245,255,0.1)", border: "1px solid rgba(0,245,255,0.3)", color: "#00F5FF", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>🧬 Generate</button>
          <button onClick={post} disabled={posting || !text.trim()} style={{ padding: "8px 16px", borderRadius: 8, cursor: "pointer", background: "linear-gradient(135deg, #00F5FF, #FF00E1)", border: "none", color: "#000", fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: 1 }}>{posting ? "POSTING..." : "POST"}</button>
        </div>
      </div>
    </div>
  );
}
function formatNumber(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return n.toString();
}
