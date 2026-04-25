"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useChimeraStore, ChimeraAgent } from "@/lib/store";
import { XComplianceModal } from "@/components/XComplianceModal";

export default function DashboardPage() {
  return <Suspense fallback={<DashboardLoading />}><DashboardContent /></Suspense>;
}
function DashboardLoading() {
  return <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px", textAlign: "center" }}><img src="/mint-icon.png" alt="Orthrus" style={{ height: 64, width: "auto", marginBottom: 16, filter: "drop-shadow(0 0 12px rgba(0,245,255,0.4))" }} /><p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Loading...</p></div>;
}
function DashboardContent() {
  const { agents, currentAgentId, setCurrentAgent, updateAgent, updateAgentPersonaWeight } = useChimeraStore();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"overview" | "autopilot" | "settings" | "posts">("overview");
  const [showXCompliance, setShowXCompliance] = useState(false);

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
        <img src="/mint-icon.png" alt="Orthrus" style={{ height: 120, width: "auto", marginBottom: 24, filter: "drop-shadow(0 0 20px rgba(0,245,255,0.4)) drop-shadow(0 0 40px rgba(255,0,225,0.3))" }} />
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
                {currentAgent.isActive ? "● LIVE" : "○ PAUSED"}
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
            {(["overview", "autopilot", "settings", "posts"] as const).map(tab => (
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
                  onConnect={() => setShowXCompliance(true)} />
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

          {activeTab === "autopilot" && <AutopilotTab agent={currentAgent} onUpdate={u => updateAgent(currentAgent.id, u)} />}

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

              {currentAgent.xConnected && <PostTweetButton agentId={currentAgent.id} personas={currentAgent.personas} fusion={currentAgent.fusion} />}
            </div>
          )}
        </>
      )}

      {/* X compliance modal */}
      {showXCompliance && currentAgent && (
        <XComplianceModal
          agentId={currentAgent.id}
          onCancel={() => setShowXCompliance(false)}
          onConfirm={() => {
            setShowXCompliance(false);
            window.location.href = `/api/auth/twitter?agentId=${currentAgent.id}`;
          }}
        />
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
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: connected ? "#00F5FF" : "rgba(255,255,255,0.4)" }}>{connected ? "● LINKED" : "○ NOT LINKED"}</span>
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
function PostTweetButton({ agentId, personas, fusion }: any) {
  const [posting, setPosting] = useState(false);
  const [text, setText] = useState("");
  const [show, setShow] = useState(false);

  const gen = async () => {
    try {
      const res = await fetch("/api/generate-post", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ personas, platform: "x", fusion }) });
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

// ====== AUTOPILOT TAB ======
function AutopilotTab({ agent, onUpdate }: { agent: ChimeraAgent; onUpdate: (u: Partial<ChimeraAgent>) => void }) {
  const [balance, setBalance] = useState<{ sol: number; tokens: any[] } | null>(null);
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [xAutopilotStatus, setXAutopilotStatus] = useState<any>(null);
  const [xToggling, setXToggling] = useState(false);
  const mode = agent.autopilotMode || "manual";
  const interval = agent.autopilotInterval || 4;
  const actions = agent.autopilotActions || [];
  const { addAutopilotAction } = useChimeraStore();

  const traits = agent.personas.flatMap(p => p.analysis?.traits || []);

  const fetchXStatus = async () => {
    try {
      const res = await fetch(`/api/autopilot-status?agentId=${agent.id}`);
      const d = await res.json();
      setXAutopilotStatus(d);
    } catch {}
  };

  const toggleXAutopilot = async (enable: boolean) => {
    setXToggling(true);
    try {
      if (enable) {
        const res = await fetch("/api/autopilot-register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agentId: agent.id,
            name: agent.name,
            plan: agent.plan || "free",
            personas: agent.personas,
            fusion: agent.fusion,
            enabled: true,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          alert(err.error || "Failed to enable autopilot");
          return;
        }
      } else {
        await fetch(`/api/autopilot-register?agentId=${agent.id}`, { method: "DELETE" });
      }
      await fetchXStatus();
    } catch (e: any) {
      alert("Autopilot toggle failed: " + (e?.message || "unknown"));
    } finally { setXToggling(false); }
  };

  const pauseFor24h = async () => {
    const pauseUntil = Date.now() + 24 * 60 * 60 * 1000;
    await fetch("/api/autopilot-register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentId: agent.id,
        name: agent.name,
        plan: agent.plan || "free",
        personas: agent.personas,
        fusion: agent.fusion,
        enabled: true,
        pauseUntil,
      }),
    });
    await fetchXStatus();
  };

  useEffect(() => { fetchXStatus(); }, [agent.id]);

  // Level / XP polling
  const [levelInfo, setLevelInfo] = useState<any>(null);
  const fetchLevel = async () => {
    try {
      const res = await fetch(`/api/agent/level-info?agentId=${agent.id}`);
      const d = await res.json();
      if (d.kvConfigured !== false) setLevelInfo(d);
    } catch {}
  };
  useEffect(() => { fetchLevel(); const id = setInterval(fetchLevel, 30000); return () => clearInterval(id); }, [agent.id]);

  const fetchBalance = async () => {
    try {
      const res = await fetch("/api/agent/balance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agentId: agent.id }) });
      const d = await res.json();
      if (d.success) setBalance({ sol: d.sol, tokens: d.tokens });
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchBalance(); }, [agent.id]);

  const runAutopilot = async () => {
    setRunning(true); setLastResult(null);
    try {
      const res = await fetch("/api/agent/autopilot", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: agent.id,
          traits,
          ownTokenMint: agent.tokenCA,
        }),
      });
      const d = await res.json();
      setLastResult(d);
      if (d.success && d.action) {
        addAutopilotAction(agent.id, {
          id: `ap_${Date.now()}`,
          timestamp: Date.now(),
          type: d.action.type,
          reason: d.action.reason,
          signature: d.signature,
          solscanUrl: d.solscanUrl,
          success: !!d.success,
          error: d.error,
        });
        fetchBalance(); // refresh
      }
    } catch (e) {
      setLastResult({ error: e instanceof Error ? e.message : "Failed" });
    } finally { setRunning(false); }
  };

  const xp = xAutopilotStatus;
  const planLabel: Record<string, string> = { free: "FREE", degen: "DEGEN", alpha: "ALPHA", whale: "WHALE" };
  const freeTier = (agent.plan || "free") === "free";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* LEVEL & XP — Pokemon-style progression */}
      {levelInfo && (
        <div style={{ background: "linear-gradient(135deg, rgba(0,245,255,0.06), rgba(255,0,225,0.04), rgba(153,69,255,0.06))", border: "1px solid rgba(0,245,255,0.3)", borderRadius: 16, padding: 24, boxShadow: "0 0 40px rgba(0,245,255,0.1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: 3, textTransform: "uppercase" }}>Level {levelInfo.level} / {levelInfo.maxLevel}</div>
              <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 32, fontWeight: 900, background: "linear-gradient(90deg, #00F5FF, #FF00E1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 2, marginTop: 2 }}>{levelInfo.levelName}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 24, fontWeight: 900, color: "#00FFA3" }}>{levelInfo.xp.toLocaleString()} XP</div>
              {levelInfo.xpToNext > 0 && (
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                  {levelInfo.xpToNext.toLocaleString()} XP to L{levelInfo.level + 1}
                </div>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {levelInfo.nextLevelXp && (
            <div style={{ height: 8, borderRadius: 4, background: "rgba(0,0,0,0.4)", overflow: "hidden", marginBottom: 16 }}>
              <div style={{
                height: "100%", width: `${Math.round(levelInfo.progressToNext * 100)}%`,
                background: "linear-gradient(90deg, #00F5FF, #9945FF, #FF00E1)",
                transition: "width 0.5s",
                boxShadow: "0 0 10px rgba(0,245,255,0.5)",
              }} />
            </div>
          )}

          {/* Unlocked skills */}
          {levelInfo.skills && levelInfo.skills.length > 0 && (
            <div>
              <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Unlocked Skills</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {levelInfo.skills.map((s: any) => (
                  <span key={s.key} title={s.description} style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                    padding: "6px 12px", borderRadius: 6,
                    background: "rgba(0,245,255,0.08)",
                    border: "1px solid rgba(0,245,255,0.25)",
                    color: "#00F5FF",
                  }}>{s.emoji} {s.name}</span>
                ))}
              </div>
            </div>
          )}

          {/* Achievements */}
          {levelInfo.achievements && levelInfo.achievements.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Achievements</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {levelInfo.achievements.map((a: any) => (
                  <span key={a.key} title={a.description} style={{
                    fontSize: 20, padding: "4px 8px", borderRadius: 6,
                    background: "rgba(255,0,225,0.08)",
                    border: "1px solid rgba(255,0,225,0.25)",
                  }}>{a.emoji}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* X Autopilot — the main feature users care about */}
      <div style={{ background: "linear-gradient(135deg, rgba(0,245,255,0.05), rgba(255,0,225,0.05))", border: "1px solid rgba(153,69,255,0.3)", borderRadius: 16, padding: 24, boxShadow: "0 0 30px rgba(0,245,255,0.08)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 14, background: "linear-gradient(90deg, #00F5FF, #FF00E1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 3, textTransform: "uppercase" }}>𝕏 Posting Autopilot</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>Bot posts to your connected X account on schedule</div>
          </div>
          {xp?.enabled && !xp?.paused && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, background: "rgba(0,255,163,0.15)", border: "1px solid rgba(0,255,163,0.4)" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00FFA3", animation: "pulse 2s infinite" }} />
              <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 10, color: "#00FFA3", letterSpacing: 2, fontWeight: 700 }}>ACTIVE</span>
            </div>
          )}
          {xp?.paused && (
            <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 10, color: "#FFA500", padding: "6px 12px", background: "rgba(255,165,0,0.1)", border: "1px solid rgba(255,165,0,0.3)", borderRadius: 20, letterSpacing: 2, fontWeight: 700 }}>⏸ PAUSED</span>
          )}
        </div>

        {!xp?.kvConfigured && (
          <div style={{ padding: 12, background: "rgba(255,165,0,0.1)", border: "1px solid rgba(255,165,0,0.3)", borderRadius: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#FFA500", marginBottom: 16 }}>
            ⚠ Server storage not configured. Autopilot requires Upstash Redis env vars.
          </div>
        )}

        {!xp?.xConnected && xp?.kvConfigured && (
          <div style={{ padding: 12, background: "rgba(255,0,225,0.08)", border: "1px solid rgba(255,0,225,0.2)", borderRadius: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#FF00E1", marginBottom: 16 }}>
            Connect your X account (Overview tab) before enabling autopilot.
          </div>
        )}

        {freeTier && (
          <div style={{ padding: 12, background: "rgba(153,69,255,0.08)", border: "1px solid rgba(153,69,255,0.2)", borderRadius: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#9945FF", marginBottom: 16 }}>
            Free tier doesn&apos;t include autopilot. Upgrade to Degen / Alpha / Whale on the Plans page.
          </div>
        )}

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12, marginBottom: 20 }}>
          <div style={{ padding: 12, background: "rgba(0,0,0,0.25)", borderRadius: 8 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: 1, textTransform: "uppercase" }}>Plan</div>
            <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 16, color: "#fff", fontWeight: 700, marginTop: 4 }}>{planLabel[agent.plan || "free"]}</div>
          </div>
          <div style={{ padding: 12, background: "rgba(0,0,0,0.25)", borderRadius: 8 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: 1, textTransform: "uppercase" }}>Daily Limit</div>
            <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 16, color: "#00F5FF", fontWeight: 700, marginTop: 4 }}>{xp?.dailyLimit ?? "—"}</div>
          </div>
          <div style={{ padding: 12, background: "rgba(0,0,0,0.25)", borderRadius: 8 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: 1, textTransform: "uppercase" }}>Posts Today</div>
            <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 16, color: "#FF00E1", fontWeight: 700, marginTop: 4 }}>{xp?.postsToday ?? 0}</div>
          </div>
          <div style={{ padding: 12, background: "rgba(0,0,0,0.25)", borderRadius: 8 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: 1, textTransform: "uppercase" }}>Remaining</div>
            <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 16, color: "#00FFA3", fontWeight: 700, marginTop: 4 }}>{xp?.remaining ?? 0}</div>
          </div>
        </div>

        {/* Toggle + Pause buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => toggleXAutopilot(!xp?.enabled)}
            disabled={xToggling || freeTier || !xp?.xConnected || !xp?.kvConfigured}
            style={{
              flex: 1, padding: 14, borderRadius: 10,
              cursor: (xToggling || freeTier || !xp?.xConnected || !xp?.kvConfigured) ? "not-allowed" : "pointer",
              background: xp?.enabled ? "rgba(255,0,225,0.15)" : "linear-gradient(135deg, #00F5FF, #9945FF, #FF00E1)",
              border: xp?.enabled ? "1px solid rgba(255,0,225,0.4)" : "none",
              color: xp?.enabled ? "#FF00E1" : "#000",
              fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 13, letterSpacing: 2, textTransform: "uppercase",
              opacity: (freeTier || !xp?.xConnected || !xp?.kvConfigured) ? 0.4 : 1,
            }}
          >
            {xToggling ? "..." : xp?.enabled ? "Disable Autopilot" : "Enable Autopilot"}
          </button>
          {xp?.enabled && !xp?.paused && (
            <button onClick={pauseFor24h} style={{
              padding: "14px 20px", borderRadius: 10, cursor: "pointer",
              background: "rgba(255,165,0,0.1)", border: "1px solid rgba(255,165,0,0.3)",
              color: "#FFA500", fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: 1.5,
            }}>⏸ PAUSE 24H</button>
          )}
        </div>

        {/* Footer info */}
        <div style={{ marginTop: 14, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.4)", lineHeight: 1.7 }}>
          {xp?.nextCronAt && <>⏱ Next batch: {new Date(xp.nextCronAt).toLocaleString()}<br /></>}
          {xp?.paused && xp?.pausedUntil && <>⏸ Paused until: {new Date(xp.pausedUntil).toLocaleString()}<br /></>}
          Posts spaced ~2 min apart. Auto-pauses on rate limits or auth errors.
        </div>
        <style jsx>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
      </div>

      {/* Wallet Balance */}
      <div style={{ background: "rgba(0,255,163,0.04)", border: "1px solid rgba(0,255,163,0.2)", borderRadius: 16, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 11, color: "#00FFA3", letterSpacing: 3, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8 }}>
            <img src="/mint-icon.png" alt="" style={{ width: 20, height: 20, objectFit: "contain" }} />
            Beast Wallet
          </div>
          {agent.walletAddress && (
            <a href={`https://solscan.io/account/${agent.walletAddress}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#00F5FF" }}>Solscan ↗</a>
          )}
        </div>
        {agent.walletAddress && (
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 16, wordBreak: "break-all" }}>{agent.walletAddress}</div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div>
            <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 32, color: "#00FFA3" }}>
              {balance ? balance.sol.toFixed(4) : "—"}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: 1 }}>SOL</div>
          </div>
          {balance && balance.tokens.length > 0 && (
            <div>
              <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 32, color: "#FF00E1" }}>{balance.tokens.length}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: 1 }}>TOKENS</div>
            </div>
          )}
        </div>
        <button onClick={fetchBalance} style={{ marginTop: 16, padding: "8px 16px", borderRadius: 8, cursor: "pointer", background: "rgba(0,245,255,0.08)", border: "1px solid rgba(0,245,255,0.2)", color: "#00F5FF", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>Refresh</button>
      </div>

      {/* Autopilot Mode */}
      <div style={{ background: "rgba(153,69,255,0.04)", border: "1px solid rgba(153,69,255,0.2)", borderRadius: 16, padding: 24 }}>
        <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 11, color: "#9945FF", letterSpacing: 3, textTransform: "uppercase", marginBottom: 16 }}>\uD83E\uDD16 Autopilot Mode</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
          {(["manual", "on-post", "scheduled"] as const).map(m => (
            <button key={m} onClick={() => onUpdate({ autopilotMode: m })} style={{
              padding: 14, borderRadius: 10, cursor: "pointer",
              background: mode === m ? "rgba(153,69,255,0.2)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${mode === m ? "rgba(153,69,255,0.5)" : "rgba(255,255,255,0.06)"}`,
              color: mode === m ? "#9945FF" : "rgba(255,255,255,0.5)",
              fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: 1, textTransform: "uppercase",
            }}>{m}</button>
          ))}
        </div>
        {mode === "scheduled" && (
          <div>
            <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 8, letterSpacing: 1, textTransform: "uppercase" }}>Interval: {interval}h</label>
            <input type="range" min={1} max={24} value={interval} onChange={e => onUpdate({ autopilotInterval: Number(e.target.value) })} style={{ width: "100%", accentColor: "#9945FF" }} />
          </div>
        )}
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 12, lineHeight: 1.6 }}>
          {mode === "manual" && "Click 'Run Autopilot Now' to trigger one action based on persona traits."}
          {mode === "on-post" && "Autopilot runs after every X post. Chain posting with on-chain actions."}
          {mode === "scheduled" && `Autopilot runs every ${interval}h automatically. Stays active while dashboard is open.`}
        </p>
      </div>

      {/* Run Button */}
      <button onClick={runAutopilot} disabled={running || !agent.walletAddress} style={{
        width: "100%", padding: 18, borderRadius: 12, cursor: running || !agent.walletAddress ? "not-allowed" : "pointer",
        background: running ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg, #00F5FF, #9945FF, #FF00E1)",
        border: "none", color: running ? "rgba(255,255,255,0.3)" : "#000",
        fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 14, letterSpacing: 3, textTransform: "uppercase",
        boxShadow: running ? "none" : "0 0 30px rgba(0,245,255,0.3), 0 0 50px rgba(255,0,225,0.2)",
      }}>
        {running ? "EXECUTING..." : "\uD83D\uDE80 RUN AUTOPILOT NOW"}
      </button>

      {/* Last Result */}
      {lastResult && (
        <div style={{ background: lastResult.success ? "rgba(0,255,163,0.08)" : "rgba(255,0,225,0.08)", border: `1px solid ${lastResult.success ? "rgba(0,255,163,0.3)" : "rgba(255,0,225,0.3)"}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 12, color: lastResult.success ? "#00FFA3" : "#FF00E1", marginBottom: 8, letterSpacing: 1 }}>
            {lastResult.success ? "✓ EXECUTED" : "⚠ FAILED"}
          </div>
          {lastResult.action && (
            <>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>Action: {lastResult.action.type}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{lastResult.action.reason}</div>
            </>
          )}
          {lastResult.signature && (
            <a href={lastResult.solscanUrl} target="_blank" rel="noopener noreferrer" style={{ display: "block", marginTop: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#00F5FF", wordBreak: "break-all" }}>
              TX: {lastResult.signature} ↗
            </a>
          )}
          {lastResult.error && (
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#FF00E1", marginTop: 4 }}>{lastResult.error}</div>
          )}
        </div>
      )}

      {/* Persona Triggers Info */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(0,245,255,0.1)", borderRadius: 12, padding: 20 }}>
        <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>Active Persona Traits</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {traits.map((t, i) => <span key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, padding: "4px 10px", borderRadius: 6, background: "rgba(0,245,255,0.08)", color: "#00F5FF", border: "1px solid rgba(0,245,255,0.2)" }}>{t}</span>)}
        </div>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 12, lineHeight: 1.7 }}>
          Traits like <b style={{ color: "#FF00E1" }}>aggressive/memetic</b> → buy own token • <b style={{ color: "#00FFA3" }}>generous/wholesome</b> → tip users • <b style={{ color: "#00F5FF" }}>analytical</b> → swap strategy
        </p>
      </div>

      {/* Action Log */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 20 }}>
        <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 16 }}>Action Log</div>
        {actions.length === 0 ? (
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>No actions yet. Run autopilot to start.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {actions.slice(0, 10).map(a => (
              <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: a.success ? "rgba(0,255,163,0.04)" : "rgba(255,0,225,0.04)", borderRadius: 8, border: `1px solid ${a.success ? "rgba(0,255,163,0.15)" : "rgba(255,0,225,0.15)"}` }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: a.success ? "#00FFA3" : "#FF00E1" }}>{a.type}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{a.reason}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{new Date(a.timestamp).toLocaleTimeString()}</div>
                  {a.solscanUrl && <a href={a.solscanUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#00F5FF" }}>TX ↗</a>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
