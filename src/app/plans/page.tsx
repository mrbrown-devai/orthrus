"use client";

import { useState } from "react";
import Link from "next/link";
import { PLANS, PlanId, BETA_FREE } from "@/lib/constants";
import { PaymentButton } from "@/components/PaymentButton";
import { useChimeraStore } from "@/lib/store";

export default function PlansPage() {
  const { agents, currentAgentId, updateAgent } = useChimeraStore();
  const currentAgent = agents.find(a => a.id === currentAgentId) || agents[0];
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubscribe = (planId: PlanId, signature: string, currency: string) => {
    if (currentAgent) {
      updateAgent(currentAgent.id, {
        plan: planId,
        planSubscribedAt: Date.now(),
        planPaymentTx: signature,
        planPaymentCurrency: currency,
      } as any);
    }
    setSuccess(`Subscribed to ${PLANS[planId].name}!`);
    setSelectedPlan(null);
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <h1 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 40, color: "#fff", marginBottom: 8, letterSpacing: 4, background: "linear-gradient(90deg, #00F5FF, #9945FF, #FF00E1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>CHOOSE YOUR PLAN</h1>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: "rgba(255,255,255,0.5)" }}>Pick a tier for your Orthrus agent. Pay in SOL.</p>
        {BETA_FREE && (
          <div style={{ display: "inline-block", marginTop: 12, padding: "8px 16px", borderRadius: 20, background: "rgba(0,255,163,0.1)", border: "1px solid rgba(0,255,163,0.3)" }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#00FFA3" }}>🎉 ALL PLANS FREE DURING BETA</span>
          </div>
        )}
      </div>

      {success && (
        <div style={{ background: "rgba(0,255,163,0.1)", border: "1px solid rgba(0,255,163,0.3)", borderRadius: 12, padding: 16, textAlign: "center", marginBottom: 24, maxWidth: 600, margin: "0 auto 24px" }}>
          <p style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 14, color: "#00FFA3", letterSpacing: 2 }}>✓ {success}</p>
        </div>
      )}

      {!currentAgent && (
        <div style={{ background: "rgba(255,0,225,0.08)", border: "1px solid rgba(255,0,225,0.25)", borderRadius: 16, padding: 24, textAlign: "center", marginBottom: 24, maxWidth: 600, margin: "0 auto 24px" }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>You need an Orthrus first to pick a plan</p>
          <Link href="/create" style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 12, color: "#FF00E1", textDecoration: "none", letterSpacing: 2 }}>FORGE ONE →</Link>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
        {(Object.keys(PLANS) as PlanId[]).map(planId => {
          const plan = PLANS[planId];
          const isCurrent = (currentAgent as any)?.plan === planId;
          return (
            <div key={planId} style={{
              background: isCurrent ? `${plan.color}12` : "rgba(255,255,255,0.02)",
              border: `1px solid ${isCurrent ? `${plan.color}50` : "rgba(255,255,255,0.08)"}`,
              borderRadius: 20, padding: 28, position: "relative",
              boxShadow: isCurrent ? `0 0 30px ${plan.color}20` : "none",
              transition: "all 0.3s",
            }}>
              {isCurrent && (
                <div style={{ position: "absolute", top: 12, right: 12, padding: "4px 10px", borderRadius: 6, background: plan.color, color: "#000", fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 9, letterSpacing: 1.5 }}>ACTIVE</div>
              )}
              <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 22, color: plan.color, letterSpacing: 2, marginBottom: 16 }}>{plan.name.toUpperCase()}</div>

              <div style={{ marginBottom: 20 }}>
                {plan.priceSol === 0 ? (
                  <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 36, color: "#fff", letterSpacing: 1 }}>FREE</div>
                ) : (
                  <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 36, color: "#fff", letterSpacing: 1 }}>
                    {plan.priceSol} <span style={{ fontSize: 20, color: plan.color }}>SOL</span>
                    <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>/mo</span>
                  </div>
                )}
              </div>

              <div style={{ borderTop: `1px solid ${plan.color}20`, paddingTop: 16, marginBottom: 20 }}>
                {plan.features.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                    <span style={{ color: plan.color, fontSize: 12 }}>✓</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{f}</span>
                  </div>
                ))}
              </div>

              {isCurrent ? (
                <button disabled style={{ width: "100%", padding: 14, borderRadius: 10, cursor: "not-allowed", background: `${plan.color}20`, border: `1px solid ${plan.color}40`, color: plan.color, fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 2 }}>
                  ACTIVE
                </button>
              ) : selectedPlan === planId ? (
                planId === "free" ? (
                  <button onClick={() => handleSubscribe("free", "NO_PAYMENT", "NONE")} style={{ width: "100%", padding: 14, borderRadius: 10, cursor: "pointer", background: `linear-gradient(135deg, ${plan.color}, ${plan.color})`, border: "none", color: "#000", fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 12, letterSpacing: 2 }}>
                    ACTIVATE FREE
                  </button>
                ) : (
                  <PaymentButton
                    priceUsdt={plan.priceUsdt}
                    priceSol={plan.priceSol}
                    label={`SUBSCRIBE ${plan.name}`}
                    onSuccess={(sig, cur) => handleSubscribe(planId, sig, cur)}
                  />
                )
              ) : (
                <button onClick={() => setSelectedPlan(planId)} disabled={!currentAgent} style={{
                  width: "100%", padding: 14, borderRadius: 10, cursor: currentAgent ? "pointer" : "not-allowed",
                  background: currentAgent ? `${plan.color}15` : "rgba(255,255,255,0.04)",
                  border: `1px solid ${currentAgent ? `${plan.color}40` : "rgba(255,255,255,0.08)"}`,
                  color: currentAgent ? plan.color : "rgba(255,255,255,0.3)",
                  fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 2,
                }}>
                  {planId === "free" ? "CHOOSE FREE" : "SUBSCRIBE"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 40, textAlign: "center" }}>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.3)", lineHeight: 1.8 }}>
          All plans: AI persona engine • PumpFun integration • Community voting • Marketplace access<br />
          Cancel anytime. Pay-as-you-go in SOL.
        </p>
      </div>
    </div>
  );
}
