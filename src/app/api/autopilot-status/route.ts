// Returns server-side autopilot state for an agent:
// - registered (in KV)
// - plan tier limits
// - posts used today
// - pause state
// - next cron run time

import { NextRequest, NextResponse } from "next/server";
import { getAgent, getDailyPostCount, dailyLimitFor } from "@/lib/agent-registry";
import { loadTwitterTokensFromKV } from "@/lib/twitter-tokens";
import { isKvConfigured } from "@/lib/kv-store";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agentId");
  if (!agentId) return NextResponse.json({ error: "agentId required" }, { status: 400 });

  if (!isKvConfigured()) {
    return NextResponse.json({
      registered: false,
      kvConfigured: false,
      warning: "Server storage not configured",
    });
  }

  const config = await getAgent(agentId);
  const postsToday = await getDailyPostCount(agentId);
  const tokens = await loadTwitterTokensFromKV(agentId);

  // Next cron run: noon UTC today or tomorrow
  const now = new Date();
  const noonToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 0, 0));
  const nextCron = noonToday.getTime() > now.getTime()
    ? noonToday
    : new Date(noonToday.getTime() + 24 * 60 * 60 * 1000);

  return NextResponse.json({
    registered: !!config,
    kvConfigured: true,
    enabled: config?.autopilotEnabled || false,
    paused: config?.pausedUntil ? config.pausedUntil > Date.now() : false,
    pausedUntil: config?.pausedUntil,
    plan: config?.plan,
    dailyLimit: config ? dailyLimitFor(config.plan) : 0,
    postsToday,
    remaining: config ? Math.max(0, dailyLimitFor(config.plan) - postsToday) : 0,
    nextCronAt: nextCron.toISOString(),
    xConnected: !!tokens,
    xUsername: tokens?.username,
  });
}
