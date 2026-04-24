"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

// Neon particle background with cyan/magenta tones
function NeonParticleBG() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let w = canvas.width = window.innerWidth, h = canvas.height = window.innerHeight;
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 0.5,
      color: Math.random() > 0.5 ? "0,245,255" : "255,0,225"
    }));
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},0.5)`; ctx.fill();
        // Glow
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},0.1)`; ctx.fill();
      });
      for (let i = 0; i < particles.length; i++)
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0,245,255,${0.04 * (1 - dist / 140)})`; ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    const resize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />;
}

// Greek meander/key pattern border
function MeanderBorder({ color = "#00F5FF", flip = false }: { color?: string; flip?: boolean }) {
  return (
    <svg width="100%" height="20" viewBox="0 0 400 20" preserveAspectRatio="none" style={{ transform: flip ? "scaleY(-1)" : undefined, filter: `drop-shadow(0 0 6px ${color})` }}>
      <defs>
        <pattern id={`meander-${color}`} x="0" y="0" width="40" height="20" patternUnits="userSpaceOnUse">
          <path d="M0 2 L30 2 L30 16 L10 16 L10 8 L22 8 L22 14 L14 14 L14 10 L20 10" fill="none" stroke={color} strokeWidth="1.5"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#meander-${color})`}/>
    </svg>
  );
}

// Solana Logo
function SolanaLogo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 398 312" fill="none">
      <linearGradient id="sol-g" x1="360" y1="0" x2="141" y2="312" gradientUnits="userSpaceOnUse">
        <stop stopColor="#00FFA3"/><stop offset="1" stopColor="#DC1FFF"/>
      </linearGradient>
      <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z" fill="url(#sol-g)"/>
      <path d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z" fill="url(#sol-g)"/>
      <path d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" fill="url(#sol-g)"/>
    </svg>
  );
}

function GlassCard({ children, hoverable, style }: { children: React.ReactNode; hoverable?: boolean; style?: React.CSSProperties }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onMouseEnter={() => hoverable && setHovered(true)} onMouseLeave={() => hoverable && setHovered(false)}
      style={{
        background: hovered ? "rgba(0,245,255,0.04)" : "rgba(255,255,255,0.02)",
        border: `1px solid ${hovered ? "rgba(0,245,255,0.3)" : "rgba(255,255,255,0.06)"}`,
        borderRadius: 16, padding: 24, transition: "all 0.3s",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered ? "0 0 30px rgba(0,245,255,0.15)" : "none",
        ...style
      }}>
      {children}
    </div>
  );
}

export default function Home() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 100); }, []);

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <NeonParticleBG />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Hero */}
        <section style={{ minHeight: "90vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "60px 24px" }}>
          {/* Mascot */}
          <div style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(30px)", transition: "all 1s cubic-bezier(0.16,1,0.3,1)", marginBottom: 24 }}>
            <img
              src="/logo.png"
              alt="Orthrus"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/mascot-1.jpg"; }}
              style={{
                width: "min(420px, 80vw)",
                height: "auto",
                mixBlendMode: "screen",
                filter: "brightness(1.15) contrast(1.15) drop-shadow(0 0 40px rgba(0,245,255,0.4)) drop-shadow(0 0 80px rgba(255,0,225,0.3))"
              }}
            />
          </div>

          {/* Hidden SEO H1 (logo image contains the wordmark) */}
          <h1 style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}>ORTHRUS</h1>

          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: "clamp(32px, 5vw, 56px)", color: "#fff", margin: "16px 0 0", lineHeight: 1.1, letterSpacing: -1, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(40px)", transition: "all 1s cubic-bezier(0.16,1,0.3,1) 0.4s" }}>
            Two Heads.<br />
            <span style={{ background: "linear-gradient(135deg, #00F5FF, #FF00E1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>One Chaos.</span>
          </h2>

          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "clamp(13px, 1.6vw, 16px)", color: "rgba(255,255,255,0.5)", maxWidth: 620, margin: "24px auto 16px", lineHeight: 1.6, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(30px)", transition: "all 1s cubic-bezier(0.16,1,0.3,1) 0.5s" }}>
            Fuse two icons into one autonomous X bot. Launch its memecoin on PumpFun. Unleash the beast on the timeline.
          </p>

          {/* Badges */}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 32, opacity: visible ? 1 : 0, transition: "all 1s cubic-bezier(0.16,1,0.3,1) 0.6s" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 20, fontSize: 12, background: "rgba(153,69,255,0.15)", color: "#00FFA3", border: "1px solid rgba(0,255,163,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>
              <SolanaLogo size={16} /> Built on Solana
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 20, fontSize: 12, background: "rgba(255,0,225,0.1)", color: "#FF00E1", border: "1px solid rgba(255,0,225,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>
              𝕏 X-Native Posting
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 20, fontSize: 12, background: "rgba(0,245,255,0.1)", color: "#00F5FF", border: "1px solid rgba(0,245,255,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>
              🚀 PumpFun Ready
            </span>
          </div>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", opacity: visible ? 1 : 0, transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)", transition: "all 1s cubic-bezier(0.16,1,0.3,1) 0.7s" }}>
            <Link href="/create">
              <button style={{ background: "linear-gradient(135deg, #00F5FF, #9945FF, #FF00E1)", border: "none", color: "#000", fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 14, letterSpacing: 2, padding: "16px 48px", borderRadius: 12, cursor: "pointer", boxShadow: "0 0 40px rgba(0,245,255,0.4), 0 0 60px rgba(255,0,225,0.3)", textTransform: "uppercase" }}>
                Forge Your Orthrus →
              </button>
            </Link>
            <Link href="/governance">
              <button style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(0,245,255,0.2)", color: "rgba(255,255,255,0.8)", fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: 1, padding: "16px 32px", borderRadius: 12, cursor: "pointer", textTransform: "uppercase" }}>
                Vote Personas
              </button>
            </Link>
          </div>
        </section>

        {/* How It Works */}
        <section style={{ padding: "80px 24px", maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 14, letterSpacing: 6, textTransform: "uppercase", color: "#00F5FF", textAlign: "center", marginBottom: 8 }}>How It Works</h2>
          <div style={{ width: 80, height: 2, background: "linear-gradient(90deg, transparent, #00F5FF, transparent)", margin: "0 auto 60px" }} />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 20 }}>
            {[
              { num: "01", title: "Pick 2 Icons", desc: "Select two personalities to fuse into one beast." },
              { num: "02", title: "AI Fuses", desc: "Claude absorbs web data + merges the minds." },
              { num: "03", title: "Pay 1 SOL", desc: "Connect Phantom + pay to forge your Orthrus." },
              { num: "04", title: "Launch Coin", desc: "Deploy its memecoin on PumpFun in one click." },
              { num: "05", title: "Unleash on X", desc: "Link your X account — the beast starts posting." },
            ].map((item, i) => (
              <GlassCard key={i} hoverable style={{ textAlign: "center", padding: 24 }}>
                <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 24, background: "linear-gradient(135deg, #00F5FF, #FF00E1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 12 }}>{item.num}</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, color: "#fff", marginBottom: 8 }}>{item.title}</div>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* Features */}
        <section style={{ padding: "40px 24px 80px", maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 14, letterSpacing: 6, textTransform: "uppercase", color: "#FF00E1", textAlign: "center", marginBottom: 8 }}>Powered By</h2>
          <div style={{ width: 80, height: 2, background: "linear-gradient(90deg, transparent, #FF00E1, transparent)", margin: "0 auto 32px" }} />

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            {[
              { icon: "🧠", name: "Claude AI", desc: "Persona research" },
              { icon: <SolanaLogo size={28} />, name: "Solana", desc: "Blockchain layer" },
              { icon: "🚀", name: "PumpFun", desc: "Token launches" },
              { icon: "𝕏", name: "X Posting", desc: "Autonomous shitposting" },
              { icon: "🗳️", name: "Governance", desc: "Community voting" },
            ].map((t, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(0,245,255,0.1)", borderRadius: 12, padding: "20px 28px", textAlign: "center", minWidth: 140 }}>
                <div style={{ marginBottom: 10, display: "flex", justifyContent: "center", alignItems: "center", fontSize: 28, height: 32 }}>{t.icon}</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: "#fff", marginBottom: 4 }}>{t.name}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{t.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer style={{ textAlign: "center", padding: "40px 24px 60px", color: "rgba(255,255,255,0.25)", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
          <div style={{ width: "min(400px, 80vw)", margin: "0 auto 20px", opacity: 0.4 }}>
            <MeanderBorder color="#9945FF" />
          </div>
          <p>ORTHRUS — Two Heads. One Chaos. | Built on Solana | Powered by Claude AI</p>
        </footer>
      </div>
    </div>
  );
}
