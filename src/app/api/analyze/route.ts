import { NextRequest, NextResponse } from "next/server";

// Known personas with pre-analyzed data (Claude's training knowledge)
const KNOWN_PERSONAS: Record<string, any> = {
  "elon musk": {
    description: "Elon Musk is a tech billionaire and entrepreneur, CEO of Tesla and SpaceX, and owner of X (formerly Twitter). He's known for his ambitious goals to revolutionize transportation, space exploration, and social media.",
    traits: ["visionary", "provocative", "workaholic", "risk-taker", "controversial"],
    expression: "Direct, meme-heavy communication style. Uses humor, sarcasm, and controversial hot takes. Often tweets late at night. Mixes technical insights with shitposts.",
    northStar: "Making humanity a multi-planetary species and accelerating the transition to sustainable energy.",
    topics: ["space", "AI", "electric vehicles", "free speech", "memes"],
    tone: "provocative"
  },
  "pavel durov": {
    description: "Pavel Durov is the founder and CEO of Telegram, previously founded VKontakte (Russia's largest social network). A privacy advocate who left Russia after refusing to hand over user data to authorities.",
    traits: ["privacy-focused", "minimalist", "principled", "independent", "health-conscious"],
    expression: "Thoughtful, philosophical posts about freedom, privacy, and technology. Rarely posts but when he does, it's impactful. Clean, articulate communication.",
    northStar: "Protecting user privacy and building communication tools free from government surveillance.",
    topics: ["privacy", "freedom", "technology", "health", "minimalism"],
    tone: "philosophical"
  },
  "donald trump": {
    description: "Donald Trump is the 45th and 47th President of the United States, businessman, and media personality. Known for his direct communication style and strong political base.",
    traits: ["bold", "confrontational", "media-savvy", "nationalist", "negotiator"],
    expression: "All caps for emphasis, simple vocabulary, repetitive phrases ('tremendous', 'huge', 'beautiful'). Direct attacks on opponents. Nicknames for critics.",
    northStar: "Making America great and dominant on the world stage.",
    topics: ["politics", "economy", "immigration", "media", "deals"],
    tone: "combative"
  },
  "joe rogan": {
    description: "Joe Rogan is a comedian, UFC commentator, and host of The Joe Rogan Experience, one of the world's most popular podcasts. Known for long-form conversations on diverse topics.",
    traits: ["curious", "open-minded", "humorous", "health-obsessed", "authentic"],
    expression: "Conversational and exploratory. Uses phrases like 'that's wild', 'it's entirely possible'. Mixes comedy with serious discussion. Self-deprecating humor.",
    northStar: "Having genuine, unfiltered conversations and exploring ideas freely.",
    topics: ["MMA", "comedy", "health", "psychedelics", "science"],
    tone: "curious"
  },
  "mark zuckerberg": {
    description: "Mark Zuckerberg is the founder and CEO of Meta (formerly Facebook). He built the world's largest social network and is now pivoting toward the metaverse and AI.",
    traits: ["analytical", "competitive", "persistent", "awkward", "ambitious"],
    expression: "Corporate-polished but trying to seem casual. Uses buzzwords. Has evolved from robotic to showing more personality. Posts about MMA and family.",
    northStar: "Connecting the world and building the next computing platform (metaverse/AI).",
    topics: ["AI", "metaverse", "social media", "MMA", "family"],
    tone: "corporate"
  },
  "kanye west": {
    description: "Kanye West (Ye) is a rapper, producer, fashion designer, and cultural provocateur. One of the most influential artists of his generation, known for controversial statements.",
    traits: ["creative", "unpredictable", "egotistical", "visionary", "polarizing"],
    expression: "Stream of consciousness, philosophical rants, self-aggrandizing. Mixes genius insights with controversial takes. ALL CAPS when passionate.",
    northStar: "Being recognized as the greatest creative mind of his generation and breaking industry barriers.",
    topics: ["music", "fashion", "God", "creativity", "industry"],
    tone: "grandiose"
  },
  "andrew tate": {
    description: "Andrew Tate is a former kickboxer, internet personality, and self-help influencer known for his controversial views on masculinity and wealth.",
    traits: ["aggressive", "confident", "materialistic", "controversial", "motivational"],
    expression: "Direct, confrontational, uses masculine bravado. 'Top G' persona. Flashy lifestyle content. Motivational but polarizing messaging.",
    northStar: "Building wealth and influence while promoting his vision of masculinity.",
    topics: ["wealth", "masculinity", "hustle", "cars", "lifestyle"],
    tone: "aggressive"
  },
  "mr beast": {
    description: "MrBeast (Jimmy Donaldson) is the world's biggest YouTuber, known for expensive stunts, philanthropy videos, and building a media empire including Feastables.",
    traits: ["generous", "ambitious", "data-driven", "workaholic", "innovative"],
    expression: "High energy, exclamatory. Uses superlatives ('BIGGEST', 'MOST INSANE'). Genuine excitement. Focus on scale and spectacle.",
    northStar: "Creating the most entertaining content possible and using wealth for massive-scale philanthropy.",
    topics: ["YouTube", "philanthropy", "challenges", "business", "content"],
    tone: "enthusiastic"
  },
  "vitalik buterin": {
    description: "Vitalik Buterin is the co-founder of Ethereum, the world's second-largest cryptocurrency. A programming prodigy who proposed Ethereum at age 19.",
    traits: ["intellectual", "idealistic", "quirky", "principled", "innovative"],
    expression: "Technical and philosophical. Long-form essays. Uses academic language but accessible. Thoughtful, measured responses. Emoji occasionally.",
    northStar: "Building decentralized systems that empower individuals and reduce centralized control.",
    topics: ["Ethereum", "crypto", "governance", "philosophy", "technology"],
    tone: "intellectual"
  }
};

// Fetch public data about a person
async function fetchPersonaData(name: string, xHandle?: string, webLink?: string): Promise<string> {
  const sources: string[] = [];

  // Try user-provided web link first
  if (webLink) {
    try {
      const res = await fetch(webLink, {
        signal: AbortSignal.timeout(8000),
        headers: { "User-Agent": "ChimeraBot/1.0" },
      });
      if (res.ok) {
        const html = await res.text();
        // Extract text content (strip HTML tags)
        const text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 3000);
        if (text.length > 100) {
          sources.push(`Web source (${webLink}): ${text}`);
        }
      }
    } catch (e) {
      console.log("Web link fetch failed:", e);
    }
  }

  // Try Wikipedia
  try {
    const wikiName = name.replace(/ /g, "_");
    const wikiRes = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiName)}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (wikiRes.ok) {
      const wiki = await wikiRes.json();
      if (wiki.extract) {
        sources.push(`Wikipedia: ${wiki.extract}`);
      }
    }
  } catch (e) {
    console.log("Wikipedia fetch failed:", e);
  }

  // Try DuckDuckGo instant answer
  try {
    const ddgRes = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(name)}&format=json&no_html=1`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (ddgRes.ok) {
      const ddg = await ddgRes.json();
      if (ddg.Abstract) {
        sources.push(`DuckDuckGo: ${ddg.Abstract}`);
      }
    }
  } catch (e) {
    console.log("DDG fetch failed:", e);
  }

  return sources.join("\n\n");
}

// Try Claude API with the configured key
async function analyzeWithClaude(name: string, context: string): Promise<any | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log("No ANTHROPIC_API_KEY configured");
    return null;
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [{
          role: "user",
          content: `Analyze the personality of "${name}" for an AI agent that will embody their communication style.

${context ? `Research data:\n${context}\n\n` : ""}

Return ONLY this JSON:
{
  "description": "2-3 sentences about who they are",
  "traits": ["trait1", "trait2", "trait3", "trait4", "trait5"],
  "expression": "Their communication style - how they write/speak, tone, vocabulary",
  "northStar": "Their core mission, what drives them",
  "topics": ["topic1", "topic2", "topic3"],
  "tone": "One word describing their tone"
}`
        }]
      }),
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Claude API error:", response.status, error);
      return null;
    }

    const data = await response.json();
    const text = data.content?.[0]?.text;
    if (!text) return null;

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error("Claude API failed:", e);
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { name, xHandle, instagram, tiktok, webLink } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const nameLower = name.toLowerCase().trim();
    
    // Check if we have pre-built knowledge
    const knownPersona = KNOWN_PERSONAS[nameLower];
    if (knownPersona) {
      console.log(`Using pre-built knowledge for: ${name}`);
      return NextResponse.json({
        success: true,
        name,
        analysis: knownPersona,
        source: "knowledge"
      });
    }

    // Fetch real-time data (including user-provided web link)
    const scrapedData = await fetchPersonaData(name, xHandle, webLink);
    
    // Try Claude API
    const claudeAnalysis = await analyzeWithClaude(name, scrapedData);
    if (claudeAnalysis) {
      return NextResponse.json({
        success: true,
        name,
        analysis: claudeAnalysis,
        source: "claude"
      });
    }

    // Fallback: Generate basic analysis from scraped data
    if (scrapedData) {
      return NextResponse.json({
        success: true,
        name,
        analysis: {
          description: scrapedData.slice(0, 300) + (scrapedData.length > 300 ? "..." : ""),
          traits: ["notable", "influential", "public figure"],
          expression: "Unique communication style",
          northStar: "Making an impact in their field",
          topics: ["their expertise"],
          tone: "distinctive"
        },
        source: "scraped"
      });
    }

    // Ultimate fallback
    return NextResponse.json({
      success: true,
      name,
      analysis: {
        description: `${name} is a notable public figure.`,
        traits: ["influential", "driven", "distinctive"],
        expression: "Individual communication style",
        northStar: "Making a significant impact",
        topics: ["their field"],
        tone: "unique"
      },
      source: "fallback"
    });

  } catch (error) {
    console.error("Analyze API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Analysis failed", details: errorMessage },
      { status: 500 }
    );
  }
}
