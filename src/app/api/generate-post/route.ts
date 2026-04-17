import { NextRequest, NextResponse } from "next/server";

// Generate AI posts based on fused personas
export async function POST(req: NextRequest) {
  try {
    const { personas, context, type, platform } = await req.json();

    if (!personas || personas.length === 0) {
      return NextResponse.json(
        { error: "Personas required" },
        { status: 400 }
      );
    }

    // Calculate weighted influence of each persona
    const totalWeight = personas.reduce((sum: number, p: any) => sum + (p.weight || 50), 0);
    const normalizedPersonas = personas.map((p: any) => ({
      ...p,
      influence: (p.weight || 50) / totalWeight,
    }));

    // Generate post based on persona styles
    const post = generateFusedPost(normalizedPersonas, context, type, platform || "x");

    return NextResponse.json({
      success: true,
      post,
      generatedAt: Date.now(),
    });
  } catch (error) {
    console.error("Generate post error:", error);
    return NextResponse.json(
      { error: "Failed to generate post" },
      { status: 500 }
    );
  }
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
