// Vercel Cron — runs once daily (Hobby plan limit).
// Each run processes all autopilot-enabled agents and posts their daily batch.
// Posts are spaced ~2 min apart within the run to avoid X rate limits.

import { NextRequest, NextResponse } from "next/server";
import {
  getAllAutopilotAgents,
  getAgent,
  incrementDailyPostCount,
  getDailyPostCount,
  dailyLimitFor,
} from "@/lib/agent-registry";
import { loadTwitterTokensFromKV, saveTwitterTokens } from "@/lib/twitter-tokens";
import { postTweet, refreshAccessToken } from "@/lib/twitter";
import { isKvConfigured } from "@/lib/kv-store";

export const maxDuration = 300; // 5 min

const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID!;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://orthrus-theta.vercel.app";

export async function GET(request: NextRequest) {
  // Vercel Cron sends a specific header we can check for, or auth via CRON_SECRET
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (expected && authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isKvConfigured()) {
    return NextResponse.json({
      ok: true,
      warning: "UPSTASH_REDIS_URL + UPSTASH_REDIS_TOKEN not set — autopilot inactive",
      skipped: true,
    });
  }

  const started = Date.now();
  const report: any[] = [];

  try {
    const agentIds = await getAllAutopilotAgents();
    console.log(`[autopost] Running for ${agentIds.length} agents`);

    for (const agentId of agentIds) {
      try {
        const result = await processAgent(agentId);
        report.push({ agentId, ...result });
      } catch (e: any) {
        console.error(`[autopost] ${agentId} failed:`, e);
        report.push({ agentId, error: e?.message || "failed" });
      }
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "cron failed" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    duration: Date.now() - started,
    processed: report.length,
    report,
  });
}

async function processAgent(agentId: string): Promise<any> {
  const config = await getAgent(agentId);
  if (!config || !config.autopilotEnabled) return { skipped: "not enabled" };
  if (config.pausedUntil && config.pausedUntil > Date.now()) return { skipped: "paused" };

  const limit = dailyLimitFor(config.plan);
  if (limit <= 0) return { skipped: "free tier, no autopilot" };

  const postsToday = await getDailyPostCount(agentId);
  const remaining = limit - postsToday;
  if (remaining <= 0) return { skipped: `daily limit reached (${limit})` };

  // Load twitter tokens from KV (cookies unavailable in cron context)
  let tokens = await loadTwitterTokensFromKV(agentId);
  if (!tokens) return { skipped: "no twitter tokens" };

  // Refresh if expired
  if (Date.now() >= tokens.expiresAt - 60_000 && tokens.refreshToken) {
    try {
      const newTokens = await refreshAccessToken(tokens.refreshToken, TWITTER_CLIENT_ID, TWITTER_CLIENT_SECRET);
      tokens = {
        ...tokens,
        accessToken: newTokens.access_token,
        refreshToken: newTokens.refresh_token || tokens.refreshToken,
        expiresAt: Date.now() + newTokens.expires_in * 1000,
      };
      await saveTwitterTokens(tokens);
    } catch (e) {
      return { error: "token refresh failed" };
    }
  }

  // Post "remaining" tweets, spaced 2 min apart
  const MAX_BATCH = 10; // don't post more than 10 in one cron run for safety
  const toPost = Math.min(remaining, MAX_BATCH);
  const posted: string[] = [];
  const errors: string[] = [];

  for (let i = 0; i < toPost; i++) {
    try {
      // Generate the post using the fusion engine
      const genRes = await fetch(`${APP_URL}/api/generate-post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personas: config.personas,
          fusion: config.fusion,
          platform: "x",
          type: "post",
        }),
      });
      const genData = await genRes.json();
      if (!genData.post) { errors.push("gen failed"); continue; }

      const text = String(genData.post).slice(0, 280);
      const tweet = await postTweet(tokens.accessToken, text);
      posted.push(tweet.id);
      await incrementDailyPostCount(agentId);

      // Space posts 2 min apart (except last one)
      if (i < toPost - 1) await new Promise((r) => setTimeout(r, 120_000));
    } catch (e: any) {
      console.error(`[autopost] ${agentId} post ${i} failed:`, e);
      errors.push(e?.message || "post failed");
      // If we hit rate limit or auth error, stop the batch
      if (e?.message?.includes("401") || e?.message?.includes("429")) break;
    }
  }

  return { posted: posted.length, errors, remaining: remaining - posted.length };
}
