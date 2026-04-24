"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useChimeraStore, PersonaAnalysis, ChimeraAgent } from "@/lib/store";
import { FORGE_FEE_USDT, FORGE_FEE_SOL } from "@/lib/constants";
import { useWallet } from "@solana/wallet-adapter-react";
import { PaymentButton } from "@/components/PaymentButton";

interface PersonaInput {
  name: string;
  xHandle: string;
  instagram: string;
  tiktok: string;
  webLink: string;
}

export default function CreatePage() {
  const router = useRouter();
  const { addAgent, clearSelectedPersonas } = useChimeraStore();
  const { publicKey } = useWallet();

  const [step, setStep] = useState(1);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [analyzePhase, setAnalyzePhase] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [personaA, setPersonaA] = useState<PersonaInput>({ name: "", xHandle: "", instagram: "", tiktok: "", webLink: "" });
  const [personaB, setPersonaB] = useState<PersonaInput>({ name: "", xHandle: "", instagram: "", tiktok: "", webLink: "" });
  const [analysisA, setAnalysisA] = useState<PersonaAnalysis | null>(null);
  const [analysisB, setAnalysisB] = useState<PersonaAnalysis | null>(null);
  const [weight, setWeight] = useState(50);
  const [agentName, setAgentName] = useState("");

  // Payment
  const [isPaying, setIsPaying] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [paymentSignature, setPaymentSignature] = useState<string | null>(null);
  const [paymentCurrency, setPaymentCurrency] = useState<string | null>(null);

  // PumpFun launch
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenDesc, setTokenDesc] = useState("");
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchResult, setLaunchResult] = useState<any>(null);

  // Generated wallet
  const [generatedWallet, setGeneratedWallet] = useState<{ address: string; privateKey: string } | null>(null);
  const [agentId] = useState(() => `orthrus_${Date.now()}`);

  const [fusionDynamics, setFusionDynamics] = useState<any>(null);

  const analyzePersonaDeep = async (persona: PersonaInput): Promise<PersonaAnalysis> => {
    const res = await fetch("/api/research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: persona.name,
        xHandle: persona.xHandle,
        webLink: persona.webLink,
        depth: "deep",
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.analysis) throw new Error(data.error || "Research failed");
    return data.analysis;
  };

  const startAnalysis = async () => {
    setAnalyzing(true); setAnalyzeProgress(0); setError(null); setFusionDynamics(null);
    try {
      setAnalyzePhase(`🔍 Searching web for ${personaA.name}...`); setAnalyzeProgress(8);
      // Run both persona analyses in parallel for speed
      const phasesA = ["🔍 Web search", "📺 YouTube interviews", "𝕏 X timeline", "🧠 Psychological model"];
      const phasesB = phasesA.map(p => p.replace("🔍", "🔍"));
      let phaseIdx = 0;
      const phaseInterval = setInterval(() => {
        if (phaseIdx < phasesA.length - 1) {
          phaseIdx++;
          setAnalyzePhase(`${phasesA[phaseIdx]} on both icons...`);
          setAnalyzeProgress(15 + phaseIdx * 15);
        }
      }, 4000);

      const [resultA, resultB] = await Promise.all([
        analyzePersonaDeep(personaA),
        analyzePersonaDeep(personaB),
      ]);
      clearInterval(phaseInterval);

      setAnalysisA(resultA); setAnalysisB(resultB); setAnalyzeProgress(80);
      setAnalyzePhase("🧬 Synthesizing fusion dynamics...");

      // Generate fusion dynamics
      try {
        const fusionRes = await fetch("/api/fuse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ personaA: resultA, personaB: resultB, weightA: weight }),
        });
        const fusionData = await fusionRes.json();
        if (fusionData.success) setFusionDynamics(fusionData.fusion);
      } catch (e) { console.log("Fusion dynamics failed (non-fatal):", e); }

      setAnalyzeProgress(100);
      setAnalyzePhase("🐕 Orthrus awakens");
      setTimeout(() => { setAnalyzing(false); setStep(2); }, 600);
    } catch (err: any) {
      setError(err.message || "Analysis failed."); setAnalyzing(false);
    }
  };


  const handleLaunchToken = async () => {
    if (!tokenName || !tokenSymbol) return;
    setIsLaunching(true); setError(null);
    try {
      const res = await fetch("/api/launch-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tokenName, symbol: tokenSymbol,
          description: tokenDesc || `${tokenName} - An Orthrus fusion of ${personaA.name} × ${personaB.name}`,
          creatorWallet: publicKey?.toBase58(),
          personas: [
            { name: personaA.name, weight },
            { name: personaB.name, weight: 100 - weight },
          ],
        }),
      });
      const data = await res.json();
      if (data.success) setLaunchResult(data);
      else setError(data.error || "Launch failed");
    } catch { setError("Network error."); }
    finally { setIsLaunching(false); }
  };

  const handleDeploy = () => {
    const agent: ChimeraAgent = {
      id: agentId,
      name: agentName,
      description: `Fusion of ${personaA.name} × ${personaB.name}`,
      personas: [
        { id: "a", name: personaA.name, xHandle: personaA.xHandle, instagram: personaA.instagram, tiktok: personaA.tiktok, analysis: analysisA || undefined, weight },
        { id: "b", name: personaB.name, xHandle: personaB.xHandle, instagram: personaB.instagram, tiktok: personaB.tiktok, analysis: analysisB || undefined, weight: 100 - weight },
      ],
      tokenCA: launchResult?.tokenAddress,
      tokenTicker: launchResult ? tokenSymbol : undefined,
      createdAt: Date.now(),
      postsToday: 0, totalPosts: 0, impressionsToday: 0, totalImpressions: 0, repliesToday: 0,
      isActive: false, postsPerDay: 5, replyToMentions: true, memeGenerationEnabled: false, memePrompt: "",
      xConnected: false, telegramConnected: false,
      walletAddress: generatedWallet?.address,
      autopilotMode: "manual",
      autopilotInterval: 4,
      autopilotActions: [],
      plan: "free",
      forgePaymentTx: paymentSignature || undefined,
      forgePaymentCurrency: paymentCurrency || undefined,
      fusion: fusionDynamics || undefined,
      activePlatforms: ["x"] as any,
      recentPosts: [],
    };
    addAgent(agent); clearSelectedPersonas(); router.push("/dashboard");
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px" }}>
      {/* Progress */}
      <div style={{ display: "flex", gap: 8, marginBottom: 48 }}>
        {[1, 2, 3, 4].map(s => (
          <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= step ? "linear-gradient(90deg, #00F5FF, #9945FF, #FF00E1)" : "rgba(255,255,255,0.06)", transition: "all 0.5s", boxShadow: s <= step ? "0 0 8px rgba(0,245,255,0.4)" : "none" }} />
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && !analyzing && (
        <div>
          <h2 style={H2}>Choose Two Icons</h2>
          <p style={SUB}>Enter two personalities to fuse. Our AI will absorb their essence from the web.</p>
          {error && <ErrorBox message={error} />}

          <div style={{ background: "rgba(0,245,255,0.03)", border: "1px solid rgba(0,245,255,0.2)", borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: "0 0 20px rgba(0,245,255,0.05)" }}>
            <div style={LABEL_CYAN}>HEAD A</div>
            <InputField label="Full Name *" value={personaA.name} onChange={v => setPersonaA({ ...personaA, name: v })} placeholder="e.g. Elon Musk" />
            <div style={{ marginTop: 12 }}>
              <InputField label="Web Link (Wikipedia, site)" value={personaA.webLink} onChange={v => setPersonaA({ ...personaA, webLink: v })} placeholder="https://..." />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 12 }}>
              <InputField label="X Handle" value={personaA.xHandle} onChange={v => setPersonaA({ ...personaA, xHandle: v })} placeholder="@handle" />
              <InputField label="Instagram" value={personaA.instagram} onChange={v => setPersonaA({ ...personaA, instagram: v })} placeholder="@user" />
              <InputField label="TikTok" value={personaA.tiktok} onChange={v => setPersonaA({ ...personaA, tiktok: v })} placeholder="@user" />
            </div>
          </div>

          <div style={{ background: "rgba(255,0,225,0.03)", border: "1px solid rgba(255,0,225,0.2)", borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: "0 0 20px rgba(255,0,225,0.05)" }}>
            <div style={LABEL_MAGENTA}>HEAD B</div>
            <InputField label="Full Name *" value={personaB.name} onChange={v => setPersonaB({ ...personaB, name: v })} placeholder="e.g. Kanye West" />
            <div style={{ marginTop: 12 }}>
              <InputField label="Web Link (Wikipedia, site)" value={personaB.webLink} onChange={v => setPersonaB({ ...personaB, webLink: v })} placeholder="https://..." />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 12 }}>
              <InputField label="X Handle" value={personaB.xHandle} onChange={v => setPersonaB({ ...personaB, xHandle: v })} placeholder="@handle" />
              <InputField label="Instagram" value={personaB.instagram} onChange={v => setPersonaB({ ...personaB, instagram: v })} placeholder="@user" />
              <InputField label="TikTok" value={personaB.tiktok} onChange={v => setPersonaB({ ...personaB, tiktok: v })} placeholder="@user" />
            </div>
          </div>

          {/* What the AI will do — sets expectations */}
          <div style={{ background: "linear-gradient(135deg, rgba(0,245,255,0.04), rgba(255,0,225,0.04))", border: "1px solid rgba(153,69,255,0.25)", borderRadius: 14, padding: 20, marginBottom: 20 }}>
            <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 11, background: "linear-gradient(90deg, #00F5FF, #FF00E1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 3, marginBottom: 14 }}>🧬 WHAT HAPPENS NEXT</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
              {[
                { icon: "🔍", label: "Web Search", desc: "Claude scans dozens of sources" },
                { icon: "📺", label: "YouTube", desc: "Top 3 interviews + transcripts" },
                { icon: "𝕏", label: "X Timeline", desc: "Voice patterns, catchphrases" },
                { icon: "🧠", label: "Psychology", desc: "7-dimension deep profile" },
                { icon: "🧬", label: "Fusion DNA", desc: "Creative tension + synthesis" },
              ].map((phase, i) => (
                <div key={i} style={{ padding: 10, background: "rgba(0,0,0,0.3)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{phase.icon}</div>
                  <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 11, color: "#fff", letterSpacing: 1, marginBottom: 3 }}>{phase.label}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>{phase.desc}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.4)", textAlign: "center" }}>
              ⏱ Takes ~2-5 min for deep analysis
            </div>
          </div>

          <button onClick={startAnalysis} disabled={!personaA.name || !personaB.name} style={(personaA.name && personaB.name) ? BTN_NEON : BTN_DISABLED}>
            🧬 ABSORB & FUSE
          </button>
        </div>
      )}

      {analyzing && (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <div style={{ width: 140, height: 140, margin: "0 auto 32px", borderRadius: "50%", background: "linear-gradient(135deg, rgba(0,245,255,0.2), rgba(255,0,225,0.2))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56, animation: "pulse 2s infinite", boxShadow: "0 0 60px rgba(0,245,255,0.4)" }}>🧬</div>
          <h2 style={{ ...H2, fontSize: 24 }}>Absorbing Data...</h2>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 32 }}>{analyzePhase}</p>
          <div style={{ maxWidth: 400, margin: "0 auto", height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${analyzeProgress}%`, background: "linear-gradient(90deg, #00F5FF, #9945FF, #FF00E1)", borderRadius: 3, transition: "width 0.5s" }} />
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div>
          <h2 style={H2}>Persona Fusion</h2>
          <p style={SUB}>Review what we absorbed. Adjust the blend between the two heads.</p>
          {analysisA && <AnalysisCard name={personaA.name} analysis={analysisA} color="#00F5FF" />}
          {analysisB && <AnalysisCard name={personaB.name} analysis={analysisB} color="#FF00E1" />}

          {/* FUSION DYNAMICS — the secret sauce showing WHY this combo is interesting */}
          {fusionDynamics && (
            <div style={{ background: "linear-gradient(135deg, rgba(0,245,255,0.06), rgba(255,0,225,0.06))", border: "1px solid rgba(153,69,255,0.3)", borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: "0 0 30px rgba(153,69,255,0.15)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 18, background: "linear-gradient(90deg, #00F5FF, #9945FF, #FF00E1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 2 }}>🧬 FUSION DYNAMICS</div>
              </div>

              {fusionDynamics.creativeTension && (
                <div style={{ marginBottom: 16, padding: 14, background: "rgba(153,69,255,0.08)", borderRadius: 10, border: "1px solid rgba(153,69,255,0.2)" }}>
                  <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 10, color: "#9945FF", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>⚡ Creative Tension</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.7 }}>{fusionDynamics.creativeTension}</div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                {fusionDynamics.commonGround && fusionDynamics.commonGround.length > 0 && (
                  <div style={{ padding: 12, background: "rgba(0,255,163,0.06)", borderRadius: 8, border: "1px solid rgba(0,255,163,0.2)" }}>
                    <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 9, color: "#00FFA3", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>🤝 Common Ground</div>
                    <ul style={{ margin: 0, paddingLeft: 16, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.7)", lineHeight: 1.8 }}>
                      {fusionDynamics.commonGround.slice(0, 4).map((c: string, i: number) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                )}
                {fusionDynamics.valueConflicts && fusionDynamics.valueConflicts.length > 0 && (
                  <div style={{ padding: 12, background: "rgba(255,0,225,0.06)", borderRadius: 8, border: "1px solid rgba(255,0,225,0.2)" }}>
                    <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 9, color: "#FF00E1", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>⚔️ Value Conflicts</div>
                    <ul style={{ margin: 0, paddingLeft: 16, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.7)", lineHeight: 1.8 }}>
                      {fusionDynamics.valueConflicts.slice(0, 4).map((c: string, i: number) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              {fusionDynamics.blendVoice && (
                <div style={{ padding: 12, background: "rgba(0,245,255,0.05)", borderRadius: 8, border: "1px solid rgba(0,245,255,0.15)", marginBottom: 12 }}>
                  <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 9, color: "#00F5FF", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>🗣️ Blend Voice</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 1.7 }}>{fusionDynamics.blendVoice}</div>
                </div>
              )}

              {fusionDynamics.sharedEnemies && fusionDynamics.sharedEnemies.length > 0 && (
                <div>
                  <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 9, color: "rgba(255,255,255,0.5)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>🎯 Shared Enemies</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {fusionDynamics.sharedEnemies.map((e: string, i: number) => (
                      <span key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, padding: "4px 10px", borderRadius: 6, background: "rgba(255,0,225,0.1)", color: "#FF00E1", border: "1px solid rgba(255,0,225,0.25)" }}>{e}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(153,69,255,0.2)", borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: "0 0 20px rgba(153,69,255,0.05)" }}>
            <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 16 }}>Blend Ratio</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#00F5FF" }}>{personaA.name} {weight}%</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#FF00E1" }}>{personaB.name} {100 - weight}%</span>
            </div>
            <input type="range" min={10} max={90} value={weight} onChange={e => setWeight(Number(e.target.value))} style={{ width: "100%", accentColor: "#00F5FF" }} />
            <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden", display: "flex", marginTop: 12 }}>
              <div style={{ width: `${weight}%`, background: "linear-gradient(90deg, #00F5FF, #9945FF)", transition: "width 0.3s" }} />
              <div style={{ width: `${100 - weight}%`, background: "linear-gradient(90deg, #9945FF, #FF00E1)", transition: "width 0.3s" }} />
            </div>
          </div>

          <PaymentButton
            priceUsdt={FORGE_FEE_USDT}
            priceSol={FORGE_FEE_SOL}
            label="FORGE BEAST"
            disabled={isPaying}
            onSuccess={async (sig, cur) => {
              setIsPaying(true); setError(null);
              try {
                const walletRes = await fetch("/api/generate-wallet", { method: "POST" });
                const walletData = await walletRes.json();
                if (walletData.success) {
                  setGeneratedWallet({ address: walletData.address, privateKey: walletData.privateKey });
                  setPaymentSignature(sig);
                  setPaymentCurrency(cur);
                  try {
                    await fetch("/api/agent/store-key", {
                      method: "POST", headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ agentId, privateKey: walletData.privateKey }),
                    });
                  } catch (e) { console.log("Failed to store key:", e); }
                  setPaymentDone(true);
                  setStep(3);
                }
              } catch (e) { setError("Wallet generation failed."); }
              finally { setIsPaying(false); }
            }}
            onError={msg => setError(msg)}
          />
        </div>
      )}

      {/* Step 3: Beast Forged (wallet info) */}
      {step === 3 && (
        <div>
          <h2 style={H2}>Beast Forged</h2>
          <p style={SUB}>Your Orthrus wallet has been generated. Save the private key — you can take custody anytime.</p>

          <div style={{ background: "linear-gradient(135deg, rgba(0,245,255,0.05), rgba(255,0,225,0.05))", border: "1px solid rgba(0,245,255,0.3)", borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: "0 0 30px rgba(0,245,255,0.1)" }}>
            <div style={{ fontSize: 48, marginBottom: 16, textAlign: "center" }}>🐕</div>
            <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 14, color: "#00F5FF", letterSpacing: 3, textTransform: "uppercase", marginBottom: 16, textAlign: "center" }}>Beast Wallet Ready</div>

            {generatedWallet && (
              <>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.5)", marginBottom: 6, letterSpacing: 1, textTransform: "uppercase" }}>Public Address</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#00F5FF", wordBreak: "break-all", background: "rgba(0,0,0,0.3)", padding: 10, borderRadius: 8, border: "1px solid rgba(0,245,255,0.15)" }}>{generatedWallet.address}</div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#FF00E1", marginBottom: 6, letterSpacing: 1, textTransform: "uppercase" }}>⚠ Private Key (Save This!)</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.75)", wordBreak: "break-all", background: "rgba(255,0,225,0.08)", padding: 10, borderRadius: 8, border: "1px solid rgba(255,0,225,0.2)" }}>{generatedWallet.privateKey}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 8, lineHeight: 1.6 }}>
                    This key gives full control of the beast's wallet. Save it securely. We also store an encrypted copy so the beast can act autonomously.
                  </div>
                </div>
              </>
            )}

            <div style={{ background: "rgba(0,255,163,0.08)", border: "1px solid rgba(0,255,163,0.25)", borderRadius: 10, padding: 12, textAlign: "center", marginTop: 8 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#00FFA3" }}>🎉 FREE DURING BETA</span>
            </div>
          </div>

          <button onClick={() => setStep(4)} style={BTN_NEON}>Continue →</button>
        </div>
      )}

      {/* Step 4: Name + PumpFun */}
      {step === 4 && (
        <div>
          <h2 style={H2}>Unleash the Beast</h2>
          <p style={SUB}>Name your Orthrus and optionally launch its memecoin on PumpFun.</p>
          {error && <ErrorBox message={error} />}

          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(0,245,255,0.15)", borderRadius: 16, padding: 24, marginBottom: 24 }}>
            <InputField label="Orthrus Name *" value={agentName} onChange={setAgentName} placeholder="Name your beast" />
          </div>

          <div style={{ background: "rgba(0,255,163,0.04)", border: "1px solid rgba(0,255,163,0.2)", borderRadius: 16, padding: 24, marginBottom: 24 }}>
            <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 11, color: "#00FFA3", letterSpacing: 3, textTransform: "uppercase", marginBottom: 16 }}>🚀 Launch on PumpFun (Optional)</div>
            {launchResult ? (
              <div style={{ background: "rgba(0,255,163,0.1)", border: "1px solid rgba(0,255,163,0.3)", borderRadius: 12, padding: 16 }}>
                <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 14, color: "#00FFA3", marginBottom: 8, letterSpacing: 1 }}>🚀 TOKEN LAUNCHED</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.7)", wordBreak: "break-all" }}>
                  {launchResult.tokenAddress}
                </div>
                {launchResult.pumpfunUrl && (
                  <a href={launchResult.pumpfunUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#00F5FF", display: "block", marginTop: 8 }}>
                    View on PumpFun →
                  </a>
                )}
              </div>
            ) : (
              <>
                <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
                  <InputField label="Token Name" value={tokenName} onChange={setTokenName} placeholder="e.g. Orthrus Coin" />
                  <InputField label="Symbol" value={tokenSymbol} onChange={v => setTokenSymbol(v.toUpperCase().slice(0, 6))} placeholder="ORTHRUS" />
                  <InputField label="Description" value={tokenDesc} onChange={setTokenDesc} placeholder="Describe the beast..." />
                </div>
                <button onClick={handleLaunchToken} disabled={isLaunching || !tokenName || !tokenSymbol} style={(tokenName && tokenSymbol && !isLaunching) ? { ...BTN_NEON, background: "linear-gradient(135deg, #00FFA3, #9945FF)" } : BTN_DISABLED}>
                  {isLaunching ? "Launching..." : "🚀 LAUNCH ON PUMPFUN"}
                </button>
              </>
            )}
          </div>

          <div style={{ background: "rgba(0,245,255,0.03)", border: "1px solid rgba(0,245,255,0.15)", borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 10, color: "#00F5FF", letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>Summary</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 2 }}>
              <div>Name: {agentName || "—"}</div>
              <div>Fusion: {personaA.name} × {personaB.name}</div>
              <div>Blend: {weight}% / {100 - weight}%</div>
              <div>X posting: Link after deploy</div>
              {launchResult && <div>Token: ${tokenSymbol}</div>}
            </div>
          </div>

          <button onClick={handleDeploy} disabled={!agentName} style={agentName ? BTN_NEON : BTN_DISABLED}>
            🐕 UNLEASH ORTHRUS
          </button>
        </div>
      )}

      <style jsx>{`@keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.05); opacity: 0.8; } }`}</style>
    </div>
  );
}

// Shared styles
const H2: React.CSSProperties = { fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 32, color: "#fff", marginBottom: 8, letterSpacing: 2 };
const SUB: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 40 };
const LABEL_CYAN: React.CSSProperties = { fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 11, color: "#00F5FF", letterSpacing: 4, marginBottom: 20, textTransform: "uppercase" };
const LABEL_MAGENTA: React.CSSProperties = { fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 11, color: "#FF00E1", letterSpacing: 4, marginBottom: 20, textTransform: "uppercase" };
const BTN_NEON: React.CSSProperties = { width: "100%", background: "linear-gradient(135deg, #00F5FF, #9945FF, #FF00E1)", border: "none", color: "#000", fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 14, letterSpacing: 3, padding: 16, borderRadius: 12, cursor: "pointer", boxShadow: "0 0 30px rgba(0,245,255,0.3), 0 0 50px rgba(255,0,225,0.2)", textTransform: "uppercase" };
const BTN_DISABLED: React.CSSProperties = { width: "100%", background: "rgba(255,255,255,0.06)", border: "none", color: "rgba(255,255,255,0.3)", fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 14, letterSpacing: 3, padding: 16, borderRadius: 12, cursor: "not-allowed", textTransform: "uppercase" };

function ErrorBox({ message }: { message: string }) {
  return <div style={{ background: "rgba(255,0,225,0.1)", border: "1px solid rgba(255,0,225,0.3)", borderRadius: 12, padding: 16, marginBottom: 20 }}><p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#FF00E1", margin: 0 }}>⚠️ {message}</p></div>;
}
function InputField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return <div><label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 6, letterSpacing: 1, textTransform: "uppercase" }}>{label}</label><input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "12px 16px", color: "#fff", fontFamily: "'JetBrains Mono', monospace", fontSize: 13, outline: "none" }} /></div>;
}
function AnalysisCard({ name, analysis, color }: { name: string; analysis: PersonaAnalysis; color: string }) {
  const [expanded, setExpanded] = useState(false);
  const hasDepth = !!(analysis.identity || analysis.voice || analysis.psychology);

  const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 10, color: "rgba(255,255,255,0.45)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      {children}
    </div>
  );
  const Tag = ({ text }: { text: string }) => (
    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, padding: "5px 10px", borderRadius: 6, background: `${color}15`, color, border: `1px solid ${color}30` }}>{text}</span>
  );
  const Text = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.7 }}>{children}</div>
  );
  const Row = ({ k, v }: { k: string; v?: string }) => v ? (
    <div style={{ display: "flex", gap: 8, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>
      <span style={{ color: "rgba(255,255,255,0.4)", minWidth: 100 }}>{k}:</span>
      <span style={{ color: "rgba(255,255,255,0.8)" }}>{v}</span>
    </div>
  ) : null;

  return (
    <div style={{ background: `${color}08`, border: `1px solid ${color}30`, borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: `0 0 20px ${color}10` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 20, color, letterSpacing: 1 }}>{name}</div>
        {hasDepth && (
          <button onClick={() => setExpanded(!expanded)} style={{ padding: "4px 12px", borderRadius: 6, cursor: "pointer", background: `${color}15`, border: `1px solid ${color}30`, color, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: 1 }}>
            {expanded ? "− COLLAPSE" : "+ DEEP DIVE"}
          </button>
        )}
      </div>

      <div style={{ display: "grid", gap: 20 }}>
        <Section label="Who They Are"><Text>{analysis.description}</Text></Section>

        <Section label="Core Traits">
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {analysis.traits.map(t => <Tag key={t} text={t} />)}
          </div>
        </Section>

        <Section label="Expression"><Text>{analysis.expression}</Text></Section>

        <div style={{ background: `${color}10`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 10, color, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>🌟 North Star</div>
          <Text>{analysis.northStar}</Text>
        </div>

        {/* Deep-dive panel — only shown when expanded and data exists */}
        {expanded && hasDepth && (
          <div style={{ display: "grid", gap: 20, padding: 16, background: "rgba(0,0,0,0.25)", borderRadius: 12, border: `1px solid ${color}20` }}>

            {analysis.identity && (
              <Section label="🆔 Identity">
                <Row k="Profession" v={analysis.identity.profession} />
                <Row k="Generation" v={analysis.identity.ageOrGeneration} />
                <Row k="Culture" v={analysis.identity.culturalBackground} />
                <Row k="Political" v={analysis.identity.politicalLean} />
                <Row k="Socioeconomic" v={analysis.identity.socioeconomic} />
              </Section>
            )}

            {analysis.voice && (
              <Section label="🗣️ Voice">
                <Row k="Tone" v={analysis.voice.tone} />
                <Row k="Vocabulary" v={analysis.voice.vocabulary} />
                <Row k="Rhythm" v={analysis.voice.sentenceRhythm} />
                <Row k="Emojis" v={analysis.voice.emojiUsage} />
                <Row k="Caps" v={analysis.voice.capitalizationStyle} />
                <Row k="Profanity" v={analysis.voice.profanityLevel} />
                {analysis.voice.catchphrases && analysis.voice.catchphrases.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>Catchphrases:</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {analysis.voice.catchphrases.map(c => <Tag key={c} text={`"${c}"`} />)}
                    </div>
                  </div>
                )}
              </Section>
            )}

            {analysis.psychology && (
              <Section label="🧠 Psychology">
                <Row k="Ego" v={analysis.psychology.egoPattern} />
                <Row k="Humor" v={analysis.psychology.humorStyle} />
                <Row k="Vulnerability" v={analysis.psychology.vulnerabilityLevel} />
                {analysis.psychology.coreBeliefs && analysis.psychology.coreBeliefs.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>Core beliefs:</div>
                    <ul style={{ margin: 0, paddingLeft: 16, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.7)", lineHeight: 1.7 }}>
                      {analysis.psychology.coreBeliefs.slice(0, 5).map((b, i) => <li key={i}>{b}</li>)}
                    </ul>
                  </div>
                )}
                {analysis.psychology.fears && analysis.psychology.fears.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>Fears/Triggers:</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {analysis.psychology.fears.map((f, i) => <Tag key={i} text={f} />)}
                    </div>
                  </div>
                )}
                {analysis.psychology.originStory && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>Origin story:</div>
                    <Text>{analysis.psychology.originStory}</Text>
                  </div>
                )}
              </Section>
            )}

            {analysis.behavior && (
              <Section label="📱 Behavior">
                <Row k="Frequency" v={analysis.behavior.postingFrequency} />
                <Row k="Engagement" v={analysis.behavior.engagementStyle} />
                <Row k="Controversy" v={analysis.behavior.controversyAppetite} />
                <Row k="Memes" v={analysis.behavior.memeFluency} />
                <Row k="Apology" v={analysis.behavior.apologyPattern} />
                {analysis.behavior.runningFeuds && analysis.behavior.runningFeuds.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>Running feuds:</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {analysis.behavior.runningFeuds.slice(0, 6).map((f, i) => <Tag key={i} text={f} />)}
                    </div>
                  </div>
                )}
              </Section>
            )}

            {analysis.signature && (
              <Section label="✨ Signature">
                {analysis.signature.runningJokes && analysis.signature.runningJokes.length > 0 && (
                  <div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>Running jokes:</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                      {analysis.signature.runningJokes.slice(0, 5).map((j, i) => <Tag key={i} text={j} />)}
                    </div>
                  </div>
                )}
                {analysis.signature.postingRituals && analysis.signature.postingRituals.length > 0 && (
                  <div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>Posting rituals:</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {analysis.signature.postingRituals.slice(0, 5).map((r, i) => <Tag key={i} text={r} />)}
                    </div>
                  </div>
                )}
              </Section>
            )}

            {analysis.sources && (
              <div style={{ paddingTop: 12, borderTop: `1px solid ${color}15`, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                Analyzed from {analysis.sources.web?.length || 0} web sources
                {analysis.sources.videos && analysis.sources.videos.length > 0 && ` • ${analysis.sources.videos.length} videos`}
                {analysis.sources.tweets && analysis.sources.tweets > 0 && ` • ${analysis.sources.tweets} tweets`}
                {" "}• depth: {analysis.sources.depth}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
