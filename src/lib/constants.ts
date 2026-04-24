// Network Configuration - Solana
export const NETWORK = "mainnet-beta";
// Default: PublicNode (Allnodes) free public RPC — CORS-friendly, no API key, no rate cap surprises.
// Ankr started requiring API keys in 2025. For production-grade reliability,
// set NEXT_PUBLIC_SOLANA_RPC_URL to Helius/QuickNode.
export const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://solana-rpc.publicnode.com";

// Beta Flag - while true, all payments are bypassed (free for testing)
export const BETA_FREE = true;

// Payment Configuration
export const TREASURY_ADDRESS = "BLUkZhZu7reiTQQe9HTDChJgz5LkBZqN8pr1htUPkaMs";
export const FORGE_FEE_USDT = 10;   // One-time fee to forge an Orthrus
export const FORGE_FEE_SOL = 0.12;  // SOL equivalent (~$10 at $85/SOL)

// USDT on Solana (Tether)
export const USDT_MINT = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";
export const USDT_DECIMALS = 6;

// Plan Tiers — monthly pricing
export type PlanId = "free" | "degen" | "alpha" | "whale";

export interface PlanConfig {
  id: PlanId;
  name: string;
  postsPerDay: number;
  repliesPerDay: number;
  autopilot: boolean;
  priceUsdt: number;
  priceSol: number;
  color: string;
  features: string[];
}

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: "free", name: "Free", postsPerDay: 3, repliesPerDay: 0, autopilot: false,
    priceUsdt: 0, priceSol: 0, color: "#9E9E9E",
    features: ["3 posts/day", "No replies", "Manual posting only", "Community voting"],
  },
  degen: {
    id: "degen", name: "Degen", postsPerDay: 10, repliesPerDay: 10, autopilot: true,
    priceUsdt: 20, priceSol: 0.25, color: "#FF00E1",
    features: ["10 posts/day", "10 replies/day", "Manual autopilot", "Basic on-chain actions"],
  },
  alpha: {
    id: "alpha", name: "Alpha", postsPerDay: 30, repliesPerDay: 50, autopilot: true,
    priceUsdt: 80, priceSol: 1, color: "#9945FF",
    features: ["30 posts/day", "50 replies/day", "On-post autopilot", "All on-chain actions", "Priority queue"],
  },
  whale: {
    id: "whale", name: "Whale", postsPerDay: 100, repliesPerDay: 200, autopilot: true,
    priceUsdt: 300, priceSol: 3.5, color: "#00FFA3",
    features: ["100 posts/day", "200 replies/day", "Scheduled autopilot", "All on-chain actions", "Priority queue", "Marketplace featured"],
  },
};

// PumpFun / Pumpportal Configuration
// NOTE: Neither Pump.fun nor Pumpportal operate an official referral program.
// We pass the env var to the API in case it's ever honored, but expected revenue = $0.
// Actual revenue comes from the forge fee + plan subscriptions + any Orthrus launch fee.
export const PUMPFUN_API_URL = "https://pumpportal.fun/api";
export const PUMP_FUN_REFERRAL_WALLET = process.env.PUMP_FUN_REFERRAL_WALLET || TREASURY_ADDRESS;

// Fusion limits
export const MAX_PERSONAS_TO_FUSE = 2;

// Brand colors (Orthrus palette)
export const ORTHRUS_CYAN = "#00F5FF";
export const ORTHRUS_MAGENTA = "#FF00E1";
export const ORTHRUS_PURPLE = "#9945FF";
export const ORTHRUS_GREEN = "#00FFA3";

// Supported persona traits
export const PERSONA_TRAITS = [
  "humor", "technical", "philosophical", "aggressive", "wholesome",
  "memetic", "informative", "controversial", "motivational", "artistic",
] as const;

// Agent activation platforms - X/Twitter only for Orthrus
export const AGENT_PLATFORMS = [
  { id: "x", name: "X (Twitter)", icon: "\u{1D54F}", description: "Post & shitpost on X" },
] as const;

// Supported Launchpads
export const SUPPORTED_LAUNCHPADS = [
  { name: "PumpFun", url: "https://pump.fun" },
  { name: "Raydium", url: "https://raydium.io" },
  { name: "Jupiter", url: "https://jup.ag" },
] as const;

// Legacy (kept for backward compat)
export const FUSION_PRICE_SOL = FORGE_FEE_SOL;
export const DAILY_POST_LIMIT = 10;
export const DAILY_REPLY_LIMIT = 10;
