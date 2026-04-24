import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Generate AI posts based on fused personas
export async function POST(req: NextRequest) {
  try {
    const { personas, context, type, platform, fusion } = await req.json();

    if (!personas || personas.length === 0) {
      return NextResponse.json({ error: "Personas required" }, { status: 400 });
    }

    // Weighted normalization
    const totalWeight = personas.reduce((sum: number, p: any) => sum + (p.weight || 50), 0);
    const normalized = personas.map((p: any) => ({
      ...p,
      influence: (p.weight || 50) / totalWeight,
    }));

    // PRIORITY 1: Use fusion synthesisPrompt + Claude Haiku (best quality + cheap)
    if (fusion?.synthesisPrompt && process.env.ANTHROPIC_API_KEY) {
      try {
        const post = await generateWithClaude(normalized, fusion, context, type, platform);
        return NextResponse.json({ success: true, post, generatedAt: Date.now(), method: "claude-fusion" });
      } catch (e) {
        console.error("Claude generation failed, falling back:", e);
      }
    }

    // PRIORITY 2: Fallback to rule-based generation (no Claude key / no fusion data)
    const post = generateFusedPost(normalized, context, type, platform || "x");
    return NextResponse.json({
      success: true,
      post,
      generatedAt: Date.now(),
      method: "rule-based",
    });
  } catch (error) {
    console.error("Generate post error:", error);
    return NextResponse.json({ error: "Failed to generate post" }, { status: 500 });
  }
}

// Use Claude Haiku with the fusion synthesisPrompt for authentic posts
async function generateWithClaude(
  personas: any[],
  fusion: any,
  context: string | undefined,
  type: "post" | "reply",
  platform: "x" | "telegram" = "x"
): Promise<string> {
  const charLimit = platform === "telegram" ? 1000 : 260;

  const systemPrompt = `${fusion.synthesisPrompt}

You are generating a single ${type === "reply" ? "reply" : "post"} for ${platform === "x" ? "X (Twitter)" : "Telegram"}.

STRICT RULES:
- Maximum ${charLimit} characters (HARD LIMIT)
- Sound EXACTLY like the fused persona, not generic AI
- Use specific catchphrases, quirks, sentence rhythms from the persona model
- Never mention being an AI, bot, or fusion
- No hashtags unless the persona uses them
- Match the tone, vocabulary, emoji usage, and punctuation style

PERSONAS BEING FUSED:
${personas.map((p: any, i) => `
${i + 1}. ${p.name} (${Math.round(p.influence * 100)}% influence)
Voice: ${p.voice?.tone || p.expression || "unknown"}
Catchphrases: ${(p.voice?.catchphrases || []).join(", ")}
Vocab: ${p.voice?.vocabulary || "normal"}
`).join("\n")}

${context ? `CONTEXT: ${context}\n` : ""}

Output ONLY the post text. No preamble, no quotes, no explanations.`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 400,
    messages: [{ role: "user", content: systemPrompt }],
  });

  const text = (response.content[0] as any).text || "";
  return text.trim().replace(/^["']|["']$/g, "").slice(0, charLimit);
}

function generateFusedPost(
  personas: any[],
  context?: string,
  type: "post" | "reply" = "post",
  platform: "x" | "telegram" = "x"
): string {
  // Analyze persona traits and styles
  const allTraits = personas.flatMap((p) => p.traits || []);
  const traitCounts: Record<string, number> = {};
  
  for (const trait of allTraits) {
    traitCounts[trait] = (traitCounts[trait] || 0) + 1;
  }

  // Get dominant traits
  const dominantTraits = Object.entries(traitCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([trait]) => trait);

  // Get sample posts for style reference
  const sampleStyles = personas.flatMap((p) => 
    (p.samplePosts || []).slice(0, 2)
  );

  // Generate based on traits
  let post = "";
  
  if (dominantTraits.includes("memetic")) {
    const memeStarters = [
      "ser,", "anon,", "imagine", "ngl", "hear me out:", "hot take:",
    ];
    post = memeStarters[Math.floor(Math.random() * memeStarters.length)] + " ";
  }

  if (dominantTraits.includes("technical")) {
    const techPhrases = [
      "just shipped something interesting",
      "been thinking about the architecture",
      "the data suggests",
      "here's what most people miss:",
    ];
    post += techPhrases[Math.floor(Math.random() * techPhrases.length)];
  } else if (dominantTraits.includes("humor")) {
    const funnyPhrases = [
      "we're so back",
      "it's over (it's not over)",
      "actually bullish on this",
      "ngmi vs wagmi energy",
    ];
    post += funnyPhrases[Math.floor(Math.random() * funnyPhrases.length)];
  } else if (dominantTraits.includes("wholesome")) {
    const wholesomePhrases = [
      "gm everyone, hope you have a great day",
      "appreciate this community",
      "we're all gonna make it",
      "building together 🤝",
    ];
    post += wholesomePhrases[Math.floor(Math.random() * wholesomePhrases.length)];
  } else {
    // Default
    const defaultPhrases = [
      "interesting developments happening",
      "keeping an eye on this",
      "thoughts on recent events:",
      "let's discuss",
    ];
    post += defaultPhrases[Math.floor(Math.random() * defaultPhrases.length)];
  }

  // Add context if provided
  if (context) {
    post += `\n\n${context}`;
  }

  // Add emoji based on traits
  if (dominantTraits.includes("memetic")) {
    const emojis = ["🚀", "💀", "😤", "🔥", "⚡"];
    post += " " + emojis[Math.floor(Math.random() * emojis.length)];
  }

  // Telegram posts can be longer and richer
  if (platform === "telegram") {
    const telegramExtras = [
      "\n\nWhat do you think? Drop your takes below 👇",
      "\n\nLet's discuss. Reply with your thoughts.",
      "\n\n🐕 Powered by Orthrus AI",
      "\n\nThis is the alpha most people miss.",
    ];
    post += telegramExtras[Math.floor(Math.random() * telegramExtras.length)];
  }

  return post.trim();
}
