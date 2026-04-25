// Returns level + XP + achievements + unlocked skills for an agent.
// Used by the dashboard for the level UI.

import { NextRequest, NextResponse } from "next/server";
import { getXp, getAchievements } from "@/lib/xp-store";
import {
  levelForXp,
  nextLevelXp,
  progressToNext,
  skillsForLevel,
  LEVEL_NAMES,
  XP_THRESHOLDS,
  MAX_LEVEL,
  ACHIEVEMENTS,
} from "@/lib/leveling";
import { isKvConfigured } from "@/lib/kv-store";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agentId");
  if (!agentId) return NextResponse.json({ error: "agentId required" }, { status: 400 });

  if (!isKvConfigured()) {
    return NextResponse.json({ kvConfigured: false, xp: 0, level: 1 });
  }

  const xp = await getXp(agentId);
  const level = levelForXp(xp);
  const next = nextLevelXp(level);
  const skills = skillsForLevel(level);
  const achKeys = await getAchievements(agentId);
  const achievements = achKeys
    .map((k) => ACHIEVEMENTS.find((a) => a.key === k))
    .filter(Boolean);

  return NextResponse.json({
    kvConfigured: true,
    agentId,
    xp,
    level,
    levelName: LEVEL_NAMES[level - 1] || "Legend",
    maxLevel: MAX_LEVEL,
    progressToNext: progressToNext(xp),
    currentLevelXp: XP_THRESHOLDS[level - 1],
    nextLevelXp: next,
    xpToNext: next ? next - xp : 0,
    skills,
    achievements,
  });
}
