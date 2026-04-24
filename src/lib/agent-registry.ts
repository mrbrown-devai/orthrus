// Server-side agent registry (KV-backed) for cron autopilot.
// Client writes minimal agent config here when autopilot is enabled.

import { kvSet, kvGet, kvDel, kvSadd, kvSrem, kvSmembers, kvIncr, isKvConfigured } from "./kv-store";
import { PLANS, PlanId } from "./constants";

export interface AutopilotConfig {
  agentId: string;
  name: string;
  plan: PlanId;
  personas: { name: string; weight: number; analysis?: any }[];
  fusion?: any; // FusionDynamics with synthesisPrompt
  autopilotEnabled: boolean;
  pausedUntil?: number; // timestamp — when to resume
  lastPostAt?: number;
  updatedAt: number;
}

const REGISTRY_PREFIX = "agent:config:";
const AUTOPILOT_SET = "agents:autopilot-enabled";
const DAILY_POST_COUNTER_PREFIX = "agent:posts-today:";

export async function registerAgent(config: AutopilotConfig): Promise<void> {
  if (!isKvConfigured()) return;
  await kvSet(`${REGISTRY_PREFIX}${config.agentId}`, config);
  if (config.autopilotEnabled && !config.pausedUntil) {
    await kvSadd(AUTOPILOT_SET, config.agentId);
  } else {
    await kvSrem(AUTOPILOT_SET, config.agentId);
  }
}

export async function getAgent(agentId: string): Promise<AutopilotConfig | null> {
  if (!isKvConfigured()) return null;
  return kvGet<AutopilotConfig>(`${REGISTRY_PREFIX}${agentId}`);
}

export async function unregisterAgent(agentId: string): Promise<void> {
  if (!isKvConfigured()) return;
  await kvDel(`${REGISTRY_PREFIX}${agentId}`);
  await kvSrem(AUTOPILOT_SET, agentId);
}

export async function getAllAutopilotAgents(): Promise<string[]> {
  if (!isKvConfigured()) return [];
  return kvSmembers(AUTOPILOT_SET);
}

// Daily post counter (resets every 24h)
export async function incrementDailyPostCount(agentId: string): Promise<number> {
  if (!isKvConfigured()) return 0;
  const dayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const key = `${DAILY_POST_COUNTER_PREFIX}${agentId}:${dayKey}`;
  return kvIncr(key, 86400); // auto-expire after 24h
}

export async function getDailyPostCount(agentId: string): Promise<number> {
  if (!isKvConfigured()) return 0;
  const dayKey = new Date().toISOString().slice(0, 10);
  const val = await kvGet<number>(`${DAILY_POST_COUNTER_PREFIX}${agentId}:${dayKey}`);
  return Number(val) || 0;
}

export function dailyLimitFor(plan: PlanId): number {
  return PLANS[plan]?.postsPerDay || 0;
}
