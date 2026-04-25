// Pokemon-style leveling for Orthrus agents.
// Pure functions — no side effects, no KV. Used by xp-store + UI.

import { PlanId } from "./constants";

// Cumulative XP needed to REACH each level. Index = level.
// L1 starts at 0 XP. To reach L2 you need 100 XP. To reach L3 you need 250. etc.
export const XP_THRESHOLDS = [
  0,      // L1 (start)
  100,    // L2
  250,    // L3
  500,    // L4
  1000,   // L5
  2000,   // L6
  4000,   // L7
  8000,   // L8
  15000,  // L9
  30000,  // L10
  60000,  // L11+ (capped)
];

export const MAX_LEVEL = 10;

// Display names per level — Pokemon-style evolutions
export const LEVEL_NAMES = [
  "Pup",       // L1
  "Hound",     // L2
  "Beast",     // L3
  "Alpha",     // L4
  "Cerberus",  // L5
  "Hydra",     // L6
  "Titan",     // L7
  "Ascended",  // L8
  "Mythic",    // L9
  "Legend",    // L10
];

export type SkillKey =
  | "post"            // L1 — basic posting (always on)
  | "balance_check"   // L1 — read on-chain balance
  | "reply_mode"      // L2 — auto-reply to mentions
  | "tipster_plus"    // L3 — tip with custom message + higher cap
  | "sniper"          // L4 — auto-buy mentioned tokens
  | "trader_plus"     // L5 — multi-hop swaps + higher cap
  | "news_hunter"     // L6 — pulls live data into posts
  | "meme_maker"      // L7 — AI image generation
  | "collab_mode"     // L8 — multi-agent quote tweets
  | "dao_voter"       // L9 — auto-vote on governance
  | "custom";         // L10 — user picks any skill

export interface SkillDef {
  key: SkillKey;
  name: string;
  emoji: string;
  description: string;
  unlocksAtLevel: number;
}

export const SKILLS: SkillDef[] = [
  { key: "post",          name: "Posting",      emoji: "📝", description: "Tweet on X timeline",                       unlocksAtLevel: 1 },
  { key: "balance_check", name: "Wallet Vision",emoji: "👁️", description: "Read its own balances on-chain",            unlocksAtLevel: 1 },
  { key: "reply_mode",    name: "Reply Mode",   emoji: "💬", description: "Auto-reply to @mentions in persona voice",  unlocksAtLevel: 2 },
  { key: "tipster_plus",  name: "Tipster+",     emoji: "🎁", description: "Tip with custom message, higher cap (0.2 SOL)", unlocksAtLevel: 3 },
  { key: "sniper",        name: "Sniper",       emoji: "🎯", description: "Auto-buy token CAs mentioned in replies",    unlocksAtLevel: 4 },
  { key: "trader_plus",   name: "Trader+",      emoji: "💱", description: "Multi-hop Jupiter swaps, 5 SOL cap",         unlocksAtLevel: 5 },
  { key: "news_hunter",   name: "News Hunter",  emoji: "📰", description: "Live market data + news in posts",           unlocksAtLevel: 6 },
  { key: "meme_maker",    name: "Meme Maker",   emoji: "🎨", description: "AI image generation attached to tweets",     unlocksAtLevel: 7 },
  { key: "collab_mode",   name: "Collab Mode",  emoji: "🤝", description: "Quote-tweet other Orthrus agents",           unlocksAtLevel: 8 },
  { key: "dao_voter",     name: "DAO Voter",    emoji: "🗳️", description: "Auto-vote on governance with persona alignment", unlocksAtLevel: 9 },
  { key: "custom",        name: "Wild Card",    emoji: "⚡", description: "Pick any premium skill",                     unlocksAtLevel: 10 },
];

// XP rewards per action — base values (multiplied by plan tier)
export const XP_REWARDS = {
  post: 1,
  post_engagement_10: 10,    // tweet hit 10+ likes
  post_engagement_100: 50,
  post_engagement_1k: 200,
  reply: 2,
  tip: 5,
  swap: 10,
  buy_own_token: 5,
  // Performance milestones (one-time per agent)
  token_1k_mcap: 100,
  token_10k_mcap: 500,
  token_100k_mcap: 2000,
  token_100_holders: 500,
  token_graduated: 1000,     // graduates to Raydium
  // Social milestones
  survive_7_days: 50,
  survive_30_days: 200,
  win_persona_war: 300,
  upgrade_plan: 500,
  // Marketplace
  sold_on_marketplace: 200,  // transferred to new owner
} as const;

// Plan tier multipliers — Whale levels 3x faster
export function xpMultiplier(plan?: PlanId): number {
  switch (plan) {
    case "whale": return 3;
    case "alpha": return 2;
    case "degen": return 1.5;
    default: return 1;
  }
}

// Calculate level from total XP
export function levelForXp(xp: number): number {
  for (let lvl = MAX_LEVEL; lvl >= 1; lvl--) {
    if (xp >= XP_THRESHOLDS[lvl - 1]) return lvl;
  }
  return 1;
}

// XP needed to reach the next level. Returns null if at max.
export function nextLevelXp(currentLevel: number): number | null {
  if (currentLevel >= MAX_LEVEL) return null;
  return XP_THRESHOLDS[currentLevel];
}

// Progress fraction toward next level (0..1)
export function progressToNext(xp: number): number {
  const lvl = levelForXp(xp);
  if (lvl >= MAX_LEVEL) return 1;
  const baseXp = XP_THRESHOLDS[lvl - 1];
  const nextXp = XP_THRESHOLDS[lvl];
  return Math.min(1, Math.max(0, (xp - baseXp) / (nextXp - baseXp)));
}

// Skills available at a given level (cumulative)
export function skillsForLevel(level: number): SkillDef[] {
  return SKILLS.filter((s) => s.unlocksAtLevel <= level);
}

// Has this agent unlocked a specific skill?
export function hasSkill(level: number, key: SkillKey): boolean {
  const def = SKILLS.find((s) => s.key === key);
  return !!def && level >= def.unlocksAtLevel;
}

// Achievement definitions — lifetime badges (separate from leveling)
export type AchievementKey =
  | "first_forge"        // Among first 1000 agents created
  | "viral_post"         // Got a tweet with 1k+ likes
  | "whale_tipper"       // Tipped 5+ SOL total lifetime
  | "pumper"             // Own token reached $10k mcap
  | "graduate"           // Token graduated to Raydium
  | "persona_war_winner" // Won 10 governance matches
  | "veteran"            // Survived 90 days no ban
  | "diamond_hands"      // Held own token 30+ days
  | "artist"             // 100+ memes generated (req: meme_maker)
  | "collaborator";      // Posted with 5+ agents (req: collab_mode)

export interface AchievementDef {
  key: AchievementKey;
  name: string;
  emoji: string;
  description: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { key: "first_forge",        name: "First Forge",         emoji: "🥇", description: "Among the first 1000 Orthrus agents" },
  { key: "viral_post",         name: "Viral",               emoji: "🔥", description: "A tweet hit 1k+ likes" },
  { key: "whale_tipper",       name: "Whale Tipper",        emoji: "💰", description: "Tipped 5+ SOL total" },
  { key: "pumper",             name: "Pumper",              emoji: "📈", description: "Own token reached $10k market cap" },
  { key: "graduate",           name: "Graduate",            emoji: "🎓", description: "Token graduated to Raydium" },
  { key: "persona_war_winner", name: "Persona War Winner",  emoji: "👑", description: "Won 10 governance votes" },
  { key: "veteran",            name: "Veteran",             emoji: "🛡️", description: "90 days, zero X bans" },
  { key: "diamond_hands",      name: "Diamond Hands",       emoji: "💎", description: "Held own token 30+ days" },
  { key: "artist",             name: "Artist",              emoji: "🎨", description: "100+ memes generated" },
  { key: "collaborator",       name: "Collaborator",        emoji: "🤝", description: "Posted with 5+ agents" },
];
