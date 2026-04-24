// Orchestrates deep persona research across all sources
// Runs Claude web search (primary), YouTube transcripts, X tweets in parallel

import { researchPersonaWithClaude, ClaudeResearchResult } from "./claude-research";
import { researchYouTube, VideoTranscript } from "./youtube";
import { researchX, XResearchResult, summarizeTweetsForClaude } from "./x-api";

export type ResearchDepth = "fast" | "deep" | "obsessive";

export interface DeepResearchResult {
  analysis: any; // full PersonaAnalysis
  sources: {
    web: string[];
    videos: { title: string; url: string }[];
    tweets: number;
    depth: ResearchDepth;
    analyzedAt: number;
  };
  duration: number; // ms
  cost: { tokens: { input: number; output: number } };
}

export async function researchPersonaDeep(input: {
  name: string;
  xHandle?: string;
  webLink?: string;
  depth?: ResearchDepth;
}): Promise<DeepResearchResult> {
  const { name, xHandle, webLink, depth = "deep" } = input;
  const startTime = Date.now();

  // Run all sources in parallel for speed
  const [youtubeResults, xResults, claudeResult] = await Promise.all([
    // YouTube: find 3 top interviews + transcripts
    depth === "fast" ? Promise.resolve([]) : researchYouTube(name, depth === "obsessive" ? 5 : 3),
    // X: fetch recent tweets (if API key set and handle provided)
    xHandle && depth !== "fast"
      ? researchX(xHandle, depth === "obsessive" ? 200 : 100)
      : Promise.resolve(null),
    // Claude with native web search (always the primary analyzer)
    researchPersonaWithClaude(name, webLink, xHandle),
  ]);

  // Assemble source URLs
  const webSources = claudeResult.sourcesUsed || [];
  const videoSources = (youtubeResults as VideoTranscript[]).map((v) => ({
    title: v.title,
    url: v.url,
  }));

  // Inject YouTube transcripts + X tweets into Claude's analysis for enrichment
  // Second pass: refine analysis using additional context if we have it
  let finalAnalysis = claudeResult.analysis;
  const xSummary = summarizeTweetsForClaude(xResults as XResearchResult | null);
  const ytSummary = (youtubeResults as VideoTranscript[])
    .map((v) => `[Interview: ${v.title}]\n${v.transcript.slice(0, 3000)}`)
    .join("\n\n---\n\n");

  // If we have extra context AND the depth warrants it, run a refinement pass
  if ((xSummary || ytSummary) && depth !== "fast") {
    try {
      const { researchPersonaWithClaude: refine } = await import("./claude-research");
      // We already have a good analysis; for now, keep the primary one
      // In obsessive mode, we'd run a second pass here
    } catch (e) {
      console.log("Refinement skipped:", e);
    }
  }

  // Attach sources to analysis
  if (finalAnalysis) {
    finalAnalysis.sources = {
      web: webSources.slice(0, 10),
      videos: videoSources,
      tweets: (xResults as XResearchResult | null)?.totalFetched || 0,
      depth,
      analyzedAt: Date.now(),
    };
  }

  return {
    analysis: finalAnalysis,
    sources: finalAnalysis?.sources || {
      web: [],
      videos: [],
      tweets: 0,
      depth,
      analyzedAt: Date.now(),
    },
    duration: Date.now() - startTime,
    cost: { tokens: claudeResult.tokensUsed },
  };
}

// Generate fusion dynamics between two personas
export async function researchFusionDynamics(
  personaA: any,
  personaB: any,
  weightA: number
): Promise<any> {
  const { createAnthropicClient } = await import("@/lib/anthropic");
  const client = createAnthropicClient();

  const prompt = `Analyze the fusion of two personas into a single autonomous AI agent.

PERSONA A (${weightA}% influence):
${JSON.stringify(personaA, null, 2)}

PERSONA B (${100 - weightA}% influence):
${JSON.stringify(personaB, null, 2)}

Return ONLY this JSON (no preamble, no markdown):

{
  "valueConflicts": ["3-5 areas where they fundamentally disagree"],
  "commonGround": ["3-5 shared beliefs or traits"],
  "creativeTension": "1-2 sentences: what makes this fusion fascinating, the productive contradiction",
  "blendVoice": "2-3 sentences: describe the hybrid voice — tone, vocabulary, sentence structure that blends both",
  "sharedEnemies": ["3-5 types of people/institutions both would dunk on"],
  "synthesisPrompt": "A one-paragraph system prompt to generate authentic posts as this fused entity. Describe voice, values, signature moves. Must feel like a REAL person, not a mashup. Reference specific catchphrases/patterns from both."
}

Be specific and creative. This fusion should feel like a third distinct character, not persona-A-with-persona-B-sprinkled-in.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = (response.content[0] as any).text || "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Fusion analysis failed to return JSON");
  return JSON.parse(jsonMatch[0]);
}
