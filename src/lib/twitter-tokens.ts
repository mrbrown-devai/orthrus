// Twitter OAuth token persistence.
// Writes to BOTH httpOnly cookie (immediate session) AND Upstash KV (cron access).
// Reads KV first (works in cron), falls back to cookie (works in browser session).

import { cookies } from "next/headers";
import { encryptKey, decryptKey } from "./crypto";
import { kvSet, kvGet, kvDel, kvSadd, kvSrem, kvSmembers, isKvConfigured } from "./kv-store";

export interface TwitterTokens {
  agentId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  userId: string;
  username: string;
  connectedAt: number;
}

const COOKIE_PREFIX = "twitter_tokens_";
const KV_TOKEN_PREFIX = "twitter:tokens:";
const KV_ACTIVE_SET = "twitter:active-agents";

// Persist tokens to cookie (session) + KV (server-side / cron)
export async function saveTwitterTokens(tokens: TwitterTokens): Promise<void> {
  const json = JSON.stringify(tokens);

  // 1. Cookie (for same-session browser use)
  try {
    const cookieStore = await cookies();
    cookieStore.set(`${COOKIE_PREFIX}${tokens.agentId}`, json, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
  } catch (e) { console.warn("[twitter-tokens] cookie write skipped:", e); }

  // 2. KV (encrypted, so even if Upstash is compromised, tokens are safe)
  if (isKvConfigured()) {
    try {
      const encrypted = encryptKey(json);
      await kvSet(`${KV_TOKEN_PREFIX}${tokens.agentId}`, encrypted);
      await kvSadd(KV_ACTIVE_SET, tokens.agentId);
    } catch (e) { console.error("[twitter-tokens] KV write failed:", e); }
  }
}

// Read tokens — try cookie first (current user's session), then KV (for cron)
export async function loadTwitterTokens(agentId: string): Promise<TwitterTokens | null> {
  // 1. Try cookie
  try {
    const cookieStore = await cookies();
    const c = cookieStore.get(`${COOKIE_PREFIX}${agentId}`);
    if (c) return JSON.parse(c.value);
  } catch {}

  // 2. Try KV
  if (isKvConfigured()) {
    try {
      const encrypted = await kvGet<string>(`${KV_TOKEN_PREFIX}${agentId}`);
      if (encrypted) return JSON.parse(decryptKey(encrypted));
    } catch (e) { console.error("[twitter-tokens] KV read failed:", e); }
  }

  return null;
}

// Load tokens without cookie access (for cron)
export async function loadTwitterTokensFromKV(agentId: string): Promise<TwitterTokens | null> {
  if (!isKvConfigured()) return null;
  try {
    const encrypted = await kvGet<string>(`${KV_TOKEN_PREFIX}${agentId}`);
    if (!encrypted) return null;
    return JSON.parse(decryptKey(encrypted));
  } catch (e) {
    console.error("[twitter-tokens] KV-only read failed:", e);
    return null;
  }
}

// Delete tokens (user disconnected)
export async function deleteTwitterTokens(agentId: string): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(`${COOKIE_PREFIX}${agentId}`);
  } catch {}
  if (isKvConfigured()) {
    try {
      await kvDel(`${KV_TOKEN_PREFIX}${agentId}`);
      await kvSrem(KV_ACTIVE_SET, agentId);
    } catch (e) { console.error("[twitter-tokens] KV delete failed:", e); }
  }
}

// Get all agents with active X tokens (for cron)
export async function getAllActiveAgents(): Promise<string[]> {
  if (!isKvConfigured()) return [];
  return kvSmembers(KV_ACTIVE_SET);
}
