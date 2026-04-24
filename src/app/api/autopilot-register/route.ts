// POST: Register an agent for autopilot (store config in KV)
// DELETE: Unregister / disable autopilot

import { NextRequest, NextResponse } from "next/server";
import { registerAgent, unregisterAgent, getAgent, AutopilotConfig } from "@/lib/agent-registry";
import { isKvConfigured } from "@/lib/kv-store";

export async function POST(request: NextRequest) {
  if (!isKvConfigured()) {
    return NextResponse.json(
      { error: "Autopilot storage not configured. Add UPSTASH_REDIS_URL + UPSTASH_REDIS_TOKEN env vars." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { agentId, name, plan, personas, fusion, enabled, pauseUntil } = body;
    if (!agentId || !name || !plan || !personas) {
      return NextResponse.json({ error: "agentId, name, plan, personas required" }, { status: 400 });
    }

    const existing = await getAgent(agentId);
    const config: AutopilotConfig = {
      agentId,
      name,
      plan,
      personas,
      fusion,
      autopilotEnabled: !!enabled,
      pausedUntil: pauseUntil ? Number(pauseUntil) : existing?.pausedUntil,
      lastPostAt: existing?.lastPostAt,
      updatedAt: Date.now(),
    };

    await registerAgent(config);
    return NextResponse.json({ success: true, config });
  } catch (e: any) {
    console.error("[autopilot-register]", e);
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isKvConfigured()) {
    return NextResponse.json({ success: true, skipped: true });
  }
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agentId");
  if (!agentId) return NextResponse.json({ error: "agentId required" }, { status: 400 });

  try {
    await unregisterAgent(agentId);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}
