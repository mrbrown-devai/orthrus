// Deep persona research endpoint — uses the full 7-dimension model
// Calls Claude with native web search + YouTube API + X API (if keys configured)

import { NextRequest, NextResponse } from "next/server";
import { researchPersonaDeep, ResearchDepth } from "@/lib/research/orchestrator";

export const maxDuration = 300; // 5 min for deep research

export async function POST(request: NextRequest) {
  try {
    const { name, xHandle, webLink, depth } = await request.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Default to "deep" depth
    const depthValue: ResearchDepth = depth || "deep";

    console.log(`[research] Starting ${depthValue} research for "${name}"`);
    const startTime = Date.now();

    const result = await researchPersonaDeep({
      name,
      xHandle,
      webLink,
      depth: depthValue,
    });

    const elapsedMs = Date.now() - startTime;
    console.log(`[research] Completed "${name}" in ${elapsedMs}ms`);

    if (!result.analysis) {
      console.error(`[research] No analysis returned for "${name}"`);
      return NextResponse.json(
        {
          error: "Research returned no analysis",
          details: "Claude responded but the JSON couldn't be parsed. Check Vercel logs.",
          elapsed: elapsedMs,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      name,
      analysis: result.analysis,
      sources: result.sources,
      duration: result.duration,
      source: "deep-research",
    });
  } catch (error) {
    console.error("Deep research error:", error);
    const msg = error instanceof Error ? error.message : "Research failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
