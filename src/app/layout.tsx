import type { Metadata } from "next";
import "./globals.css";
import { SolanaProvider } from "@/lib/SolanaProvider";
import { NavBar } from "@/components/NavBar";

export const metadata: Metadata = {
  title: "ORTHRUS | Two Heads. One Chaos.",
  description: "Fuse two personalities into one autonomous X bot on Solana. Launch your memecoin. Let the beast shitpost.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&family=Orbitron:wght@400;700;900&display=swap" />
      </head>
      <body style={{ background: "#04040a", minHeight: "100vh" }}>
        <SolanaProvider>
          <NavBar />
          <main>{children}</main>
        </SolanaProvider>
      </body>
    </html>
  );
}
