// Network Configuration - Solana
export const NETWORK = "mainnet-beta";
export const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

// Payment Configuration
export const FUSION_PRICE_SOL = 1; // 1 SOL to use the platform
export const TREASURY_ADDRESS = "53tyNpNDS8yQQY58RBG8xVULJk2GMK4Vra6XzpETpvGR";

// PumpFun Configuration
export const PUMPFUN_API_URL = "https://pumpportal.fun/api";

// Rate Limits
export const DAILY_POST_LIMIT = 10;
export const DAILY_REPLY_LIMIT = 10;

// Fusion limits
export const MAX_PERSONAS_TO_FUSE = 2;

// Brand colors (Orthrus palette)
export const ORTHRUS_CYAN = "#00F5FF";
export const ORTHRUS_MAGENTA = "#FF00E1";
export const ORTHRUS_PURPLE = "#9945FF";

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
