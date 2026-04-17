"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useChimeraStore, PersonaAnalysis, ChimeraAgent } from "@/lib/store";
import { FUSION_PRICE_SOL, TREASURY_ADDRESS } from "@/lib/constants";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Transaction, SystemProgram, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

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
  const { publicKey, sendTransaction, connected } = useWallet();
  const { connection } = useConnection();

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
  const [txSignature, setTxSignature] = useState<string | null>(null);

  // PumpFun launch
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenDesc, setTokenDesc] = useState("");
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchResult, setLaunchResult] = useState<any>(null);

  // Generated wallet
  const [generatedWallet, setGeneratedWallet] = useState<{ address: string; privateKey: string } | null>(null);

  const analyzePersona = async (persona: PersonaInput): Promise<PersonaAnalysis> => {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(persona),
    });
    const data = await res.json();
    if (!res.ok || !data.analysis) throw new Error(data.error || "Analysis failed");
    return data.analysis;
  };

  const startAnalysis = async () => {
    setAnalyzing(true); setAnalyzeProgress(0); setError(null);
    try {
      setAnalyzePhase(`Absorbing ${personaA.name}...`); setAnalyzeProgress(15);
      const resultA = await analyzePersona(personaA); setAnalysisA(resultA); setAnalyzeProgress(45);
      setAnalyzePhase(`Absorbing ${personaB.name}...`);
      const resultB = await analyzePersona(personaB); setAnalysisB(resultB); setAnalyzeProgress(80);
      setAnalyzePhase("Fusing heads..."); setAnalyzeProgress(95);
      await new Promise(r => setTimeout(r, 500));
      setAnalyzePhase("Orthrus awakens \u2713"); setAnalyzeProgress(100);
      setTimeout(() => { setAnalyzing(false); setStep(2); }, 500);
    } catch (err: any) {
      setError(err.message || "Analysis failed."); setAnalyzing(false);
    }
  };

  const handlePayment = async () => {
    if (!publicKey) { setError("Connect wallet first"); return; }
    setIsPaying(true); setError(null);
    try {
      const treasuryPubkey = new PublicKey(TREASURY_ADDRESS);
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: treasuryPubkey,
          lamports: Math.floor(FUSION_PRICE_SOL * LAMPORTS_PER_SOL),
        })
      );
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("finalized");
      tx.recentBlockhash = blockhash; tx.feePayer = publicKey;
      const sig = await sendTransaction(tx, connection);
      setTxSignature(sig);
      await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");

      // Generate Orthrus wallet
      const walletRes = await fetch("/api/generate-wallet", { method: "POST" });
      const walletData = await walletRes.json();
      if (walletData.success) setGeneratedWallet({ address: walletData.address, privateKey: walletData.privateKey });

      setPaymentDone(true);
      setTimeout(() => setStep(4), 500);
    } catch (err: any) {
      let msg = "Payment failed.";
      if (err.message?.includes("User rejected")) msg = "Cancelled.";
      else if (err.message) msg = err.message;
      setError(msg);
    } finally { setIsPaying(false); }
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
          description: tokenDesc || `${tokenName} - An Orthrus fusion of ${personaA.name} \u00D7 ${personaB.name}`,
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
      id: `orthrus_${Date.now()}`,
      name: agentName,
      description: `Fusion of ${personaA.name} \u00D7 ${personaB.name}`,
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
          <p style={SUB}>Enter two personalities to fuse. Claude AI will absorb their essence from the web.</p>
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

          <button onClick={() => setStep(3)} style={BTN_NEON}>Continue to Payment →</button>
        </div>
      )}

      {/* Step 3: Pay */}
      {step === 3 && (
        <div>
          <h2 style={H2}>Forge the Beast</h2>
          <p style={SUB}>Pay {FUSION_PRICE_SOL} SOL to forge your Orthrus.</p>
          {error && <ErrorBox message={error} />}

          <div style={{ background: "rgba(153,69,255,0.05)", border: "1px solid rgba(153,69,255,0.3)", borderRadius: 16, padding: 32, textAlign: "center", marginBottom: 24, boxShadow: "0 0 30px rgba(153,69,255,0.1)" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>💎</div>
            <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 56, background: "linear-gradient(135deg, #00F5FF, #9945FF, #FF00E1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 8, letterSpacing: 2 }}>
              {FUSION_PRICE_SOL} SOL
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>One-time fusion fee</div>

            <div style={{ textAlign: "left", background: "rgba(0,0,0,0.3)", borderRadius: 12, padding: 20, marginBottom: 24 }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>What you get:</div>
              {[
                "Fused AI persona (Claude-analyzed)",
                "Dedicated Solana wallet for the beast",
                "PumpFun memecoin launch integration",
                "Autonomous X posting (shitposting mode)",
                "10 posts + 10 replies per day",
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ color: "#00F5FF", fontSize: 14 }}>\u2713</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{item}</span>
                </div>
              ))}
            </div>

            {txSignature && (
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 16, wordBreak: "break-all" }}>
                TX: {txSignature}
              </div>
            )}

            {paymentDone ? (
              <div style={{ background: "rgba(0,245,255,0.1)", border: "1px solid rgba(0,245,255,0.3)", borderRadius: 12, padding: 16 }}>
                <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 14, color: "#00F5FF", letterSpacing: 2 }}>\u2713 PAYMENT CONFIRMED</div>
                {generatedWallet && (
                  <div style={{ marginTop: 12, textAlign: "left" }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Orthrus Wallet:</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#00F5FF", wordBreak: "break-all", marginBottom: 8 }}>{generatedWallet.address}</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#FF00E1", marginBottom: 4 }}>Private Key (save this!):</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.6)", wordBreak: "break-all", background: "rgba(255,0,225,0.1)", padding: 8, borderRadius: 6, border: "1px solid rgba(255,0,225,0.2)" }}>{generatedWallet.privateKey}</div>
                  </div>
                )}
              </div>
            ) : !connected ? (
              <div style={{ display: "flex", justifyContent: "center" }}>
                <WalletMultiButton style={{ background: "linear-gradient(135deg, #00F5FF, #9945FF, #FF00E1)", borderRadius: 12, height: 48, fontSize: 14, fontFamily: "'Orbitron', sans-serif", fontWeight: 700 }} />
              </div>
            ) : (
              <button onClick={handlePayment} disabled={isPaying} style={isPaying ? BTN_DISABLED : BTN_NEON}>
                {isPaying ? "Processing..." : `PAY ${FUSION_PRICE_SOL} SOL`}
              </button>
            )}
          </div>

          {paymentDone && <button onClick={() => setStep(4)} style={BTN_NEON}>Continue →</button>}
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
              <div>Name: {agentName || "\u2014"}</div>
              <div>Fusion: {personaA.name} \u00D7 {personaB.name}</div>
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
  return <div style={{ background: "rgba(255,0,225,0.1)", border: "1px solid rgba(255,0,225,0.3)", borderRadius: 12, padding: 16, marginBottom: 20 }}><p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#FF00E1", margin: 0 }}>\u26A0\uFE0F {message}</p></div>;
}
function InputField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return <div><label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 6, letterSpacing: 1, textTransform: "uppercase" }}>{label}</label><input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "12px 16px", color: "#fff", fontFamily: "'JetBrains Mono', monospace", fontSize: 13, outline: "none" }} /></div>;
}
function AnalysisCard({ name, analysis, color }: { name: string; analysis: PersonaAnalysis; color: string }) {
  return (
    <div style={{ background: `${color}08`, border: `1px solid ${color}30`, borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: `0 0 20px ${color}10` }}>
      <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 20, color, marginBottom: 20, letterSpacing: 1 }}>{name}</div>
      <div style={{ display: "grid", gap: 20 }}>
        <div><div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Who They Are</div><div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.7 }}>{analysis.description}</div></div>
        <div><div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Traits</div><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{analysis.traits.map(t => <span key={t} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, padding: "5px 12px", borderRadius: 8, background: `${color}15`, color, border: `1px solid ${color}30` }}>{t}</span>)}</div></div>
        <div><div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Expression</div><div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.7 }}>{analysis.expression}</div></div>
        <div style={{ background: `${color}10`, borderRadius: 10, padding: 16 }}><div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 10, color, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>🌟 North Star</div><div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.7 }}>{analysis.northStar}</div></div>
      </div>
    </div>
  );
}
