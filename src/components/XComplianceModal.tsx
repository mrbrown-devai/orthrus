"use client";

import { useState } from "react";

interface XComplianceModalProps {
  agentId: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const CHECKLIST = [
  {
    key: "automated_label",
    label: "I'll enable the 'Automated' account label",
    hint: "X Settings → Your Account → Automation → toggle on",
    link: "https://help.x.com/en/using-x/automated-label",
  },
  {
    key: "bot_in_name",
    label: "My X account name contains 'Bot', 'AI', 'Parody', or similar",
    hint: "e.g. 'Muskanye Bot', 'OrthrusParody', 'EloneKanye_AI'",
  },
  {
    key: "bio_mentions_ai",
    label: "My X bio mentions this is an AI-generated persona",
    hint: "Something like: '🧬 Fusion of X × Y by Orthrus | Not the real persons'",
  },
  {
    key: "no_impersonation",
    label: "I understand this bot is parody/fan content, NOT claiming to be the real people",
    hint: "Required by X policy. Claims like 'I am Elon Musk' = instant suspension.",
  },
];

export function XComplianceModal({ agentId, onConfirm, onCancel }: XComplianceModalProps) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const allChecked = CHECKLIST.every((item) => checked[item.key]);

  const toggle = (key: string) => {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 10000, padding: 20,
    }}>
      <div style={{
        background: "#0a0a12", border: "1px solid rgba(255,0,225,0.3)",
        borderRadius: 20, padding: 32, maxWidth: 560, width: "100%",
        maxHeight: "85vh", overflowY: "auto",
        boxShadow: "0 0 60px rgba(255,0,225,0.15), 0 0 120px rgba(0,245,255,0.1)",
      }}>
        <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 20, background: "linear-gradient(90deg, #00F5FF, #FF00E1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 2, marginBottom: 8 }}>
          ⚠️ BEFORE YOU LINK X
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 20, lineHeight: 1.6 }}>
          X has strict rules for automated/bot accounts. If your account breaks these, X will <b style={{ color: "#FF00E1" }}>suspend it</b> — and we can&apos;t recover it.
        </div>

        <div style={{ background: "rgba(255,0,225,0.06)", border: "1px solid rgba(255,0,225,0.2)", borderRadius: 10, padding: 14, marginBottom: 20 }}>
          <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 10, color: "#FF00E1", letterSpacing: 2, marginBottom: 8 }}>🛡️ ACKNOWLEDGE</div>
          {CHECKLIST.map((item) => (
            <label key={item.key} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer" }}>
              <input type="checkbox" checked={!!checked[item.key]} onChange={() => toggle(item.key)}
                style={{ marginTop: 3, width: 18, height: 18, accentColor: "#FF00E1", cursor: "pointer" }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "rgba(255,255,255,0.9)", lineHeight: 1.5 }}>{item.label}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 4, lineHeight: 1.5 }}>
                  {item.hint}
                  {item.link && (
                    <> &nbsp;<a href={item.link} target="_blank" rel="noopener noreferrer" style={{ color: "#00F5FF" }}>[docs]</a></>
                  )}
                </div>
              </div>
            </label>
          ))}
        </div>

        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 20, lineHeight: 1.7 }}>
          By continuing, you confirm the above and accept that any X suspension is your responsibility. Orthrus posts <b>on your behalf</b> — we do not control X&apos;s moderation.
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: 14, borderRadius: 10, cursor: "pointer",
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.7)", fontFamily: "'Orbitron', sans-serif",
            fontWeight: 700, fontSize: 12, letterSpacing: 2,
          }}>CANCEL</button>
          <button onClick={onConfirm} disabled={!allChecked} style={{
            flex: 1, padding: 14, borderRadius: 10, cursor: allChecked ? "pointer" : "not-allowed",
            background: allChecked ? "linear-gradient(135deg, #00F5FF, #FF00E1)" : "rgba(255,255,255,0.08)",
            border: "none", color: allChecked ? "#000" : "rgba(255,255,255,0.3)",
            fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 12, letterSpacing: 2,
          }}>CONNECT X →</button>
        </div>
      </div>
    </div>
  );
}
