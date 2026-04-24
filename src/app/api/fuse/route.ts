// Fusion dynamics endpoint — analyzes how two deep personas combine
// Returns: valueConflicts, commonGround, creativeTension, blendVoice, synthesisPrompt

import { NextRequest, NextResponse } from "next/server";
import { researchFusionDynamics } from "@/lib/research/orchestrator";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { personaA, personaB, weightA } = await request.json();

    if (!personaA || !personaB) {
      return NextResponse.json({ error: "Both personas required" }, { status: 400 });
    }
    if (typeof weightA !== "number" || weightA < 0 || weightA > 100) {
      return NextResponse.json({ error: "weightA must be 0-100" }, { status: 400 });
    }

    const fusion = await researchFusionDynamics(personaA, personaB, weightA);

    return NextResponse.json({
      success: true,
      fusion,
    });
  } catch (error) {
    console.error("Fusion error:", error);
    const msg = error instanceof Error ? error.message : "Fusion analysis failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
