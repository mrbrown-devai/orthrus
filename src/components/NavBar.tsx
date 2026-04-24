"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const links = [
  { href: "/", label: "Home" },
  { href: "/create", label: "Create" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/plans", label: "Plans" },
  { href: "/governance", label: "Vote" },
  { href: "/marketplace", label: "Marketplace" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 100,
      background: "rgba(4,4,10,0.85)", backdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(0,245,255,0.08)",
      padding: "0 32px", display: "flex", alignItems: "center", height: 56
    }}>
      <Link href="/" style={{ textDecoration: "none" }}>
        <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 18, marginRight: 40, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, letterSpacing: 2 }}>
          <OrthrusGlyph size={22} />
          <span style={{ background: "linear-gradient(90deg, #00F5FF, #9945FF, #FF00E1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ORTHRUS</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "rgba(153,69,255,0.2)", color: "#9945FF", marginLeft: 4, letterSpacing: 1 }}>SOL</span>
        </div>
      </Link>

      <div style={{ display: "flex", gap: 4, overflow: "auto" }}>
        {links.map(link => {
          const isActive = pathname === link.href;
          return (
            <Link key={link.href} href={link.href} style={{ textDecoration: "none" }}>
              <button style={{
                background: isActive ? "rgba(0,245,255,0.1)" : "transparent",
                border: "none", color: isActive ? "#00F5FF" : "rgba(255,255,255,0.45)",
                fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                padding: "8px 16px", borderRadius: 8, cursor: "pointer",
                transition: "all 0.2s", letterSpacing: 0.5, whiteSpace: "nowrap"
              }}>{link.label}</button>
            </Link>
          );
        })}
      </div>

      <div style={{ marginLeft: "auto" }}>
        <WalletMultiButton style={{
          background: "linear-gradient(135deg, #00F5FF, #9945FF, #FF00E1)",
          borderRadius: 10, height: 36, fontSize: 13,
          fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
        }} />
      </div>
    </nav>
  );
}

// Orthrus two-headed dog glyph
function OrthrusGlyph({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="orthrus-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00F5FF"/>
          <stop offset="100%" stopColor="#FF00E1"/>
        </linearGradient>
      </defs>
      <circle cx="10" cy="12" r="4" fill="url(#orthrus-grad)" opacity="0.9"/>
      <circle cx="22" cy="12" r="4" fill="url(#orthrus-grad)" opacity="0.9"/>
      <path d="M8 16 L16 24 L24 16 Z" fill="url(#orthrus-grad)" opacity="0.7"/>
      <circle cx="10" cy="12" r="1" fill="#fff"/>
      <circle cx="22" cy="12" r="1" fill="#fff"/>
    </svg>
  );
}
