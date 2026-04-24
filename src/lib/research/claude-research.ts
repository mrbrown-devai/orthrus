// Deep persona research using Claude with native web search tool
// Claude autonomously searches the web, reads sources, and synthesizes

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ClaudeResearchResult {
  analysis: any; // parsed JSON from Claude
  sourcesUsed: string[];
  rawText: string;
  tokensUsed: { input: number; output: number };
}

const DEEP_RESEARCH_PROMPT = `You are a persona research expert. Your job is to build a DEEP psychological profile of a public figure that will be used to generate authentic-sounding social media posts as that person.

Research "{NAME}" thoroughly. Use the web_search tool to find:
1. Their X/Twitter posts (patterns, catchphrases, typical sentence structure)
2. YouTube interviews and podcasts (spoken tone, beliefs, vulnerable moments)
3. Long-form profiles (GQ, Rolling Stone, Time — deep character pieces)
4. Their own content (books, essays, speeches)
5. News coverage of their controversies and public stances

{WEBLINK_HINT}

After researching, return ONLY a JSON object matching this EXACT schema (no preamble, no markdown, just the JSON):

{
  "description": "2-3 sentences about who they are",
  "traits": ["trait1", "trait2", "trait3", "trait4", "trait5"],
  "expression": "how they write/speak",
  "northStar": "their core mission / what drives them",
  "topics": ["topic1", "topic2", "topic3"],
  "tone": "one word tone descriptor",

  "identity": {
    "profession": "primary role/job",
    "ageOrGeneration": "boomer/gen-x/millennial/gen-z or specific age",
    "nationality": "country",
    "culturalBackground": "cultural markers",
    "religion": "religious affiliation or 'none'",
    "politicalLean": "left/right/libertarian/centrist/anarchist/apolitical",
    "socioeconomic": "billionaire/wealthy/middle-class/working-class"
  },

  "voice": {
    "tone": "provocative/measured/aggressive/playful/academic/etc",
    "vocabulary": "simple/technical/intellectual/street/mixed",
    "sentenceRhythm": "short punchy / long nested / fragmented / rhythmic",
    "catchphrases": ["3-6 signature phrases or verbal tics they actually use"],
    "emojiUsage": "none / sparing / heavy + which specific emojis",
    "capitalizationStyle": "normal / ALL CAPS bursts / lowercase / Title Case",
    "punctuationQuirks": "ellipsis-heavy / em-dashes / no punctuation / exclamation spam",
    "profanityLevel": "family-friendly / casual / heavy / unhinged",
    "metaphorDomains": ["domains they pull metaphors from: sports, science, war, religion, food, etc"]
  },

  "psychology": {
    "coreBeliefs": ["3-5 deeply-held worldview positions"],
    "values": ["what they'd sacrifice for: freedom, family, status, knowledge, etc"],
    "fears": ["what triggers them or makes them lash out"],
    "motivations": ["what drives them: recognition, mission, money, legacy, revenge"],
    "egoPattern": "humble / confident / narcissistic / insecure-masked-as-confident",
    "humorStyle": "dry / absurd / self-deprecating / edgy / cruel / wholesome / memetic",
    "vulnerabilityLevel": "stoic / guarded / selectively-open / vulnerable",
    "originStory": "the formative experience that shaped them (1-2 sentences)",
    "heroes": ["people they publicly admire or quote"]
  },

  "behavior": {
    "postingFrequency": "rare / regular / prolific / constant",
    "engagementStyle": "how they interact (dunks, replies, quote-tweets, ignores)",
    "controversyAppetite": "seeks / tolerates / avoids",
    "memeFluency": "native / forced / absent",
    "selfPromotionRatio": "low / balanced / heavy",
    "runningFeuds": ["public enemies they clash with"],
    "apologyPattern": "double-down / quiet-delete / full-retraction",
    "topicRotation": ["recurring themes they cycle through"]
  },

  "culture": {
    "booksReferenced": ["books they've mentioned or recommended"],
    "musicTaste": ["genres/artists they reference"],
    "moviesQuoted": ["films/shows they quote"],
    "historicalFiguresInvoked": ["historical figures they reference"],
    "scientificInterests": ["scientific/technical areas"],
    "sportsReferences": ["sports they reference"]
  },

  "signature": {
    "postingRituals": ["distinctive posting patterns (timing, format)"],
    "visualIdentity": ["signature objects/looks they reference"],
    "runningJokes": ["recurring jokes/memes associated with them"],
    "nicknamesGiven": ["names they give opponents/friends"],
    "routines": ["daily routines they talk about"]
  }
}

IMPORTANT:
- Be RUTHLESSLY specific. Don't write "interesting person" — write "obsessed with first-principles thinking".
- Quote actual catchphrases they use, not generic ones.
- If a section truly doesn't apply (e.g., no religion), use empty string or empty array.
- Return ONLY the JSON, no preamble, no \`\`\`json markers.`;

export async function researchPersonaWithClaude(
  name: string,
  webLink?: string,
  xHandle?: string
): Promise<ClaudeResearchResult> {
  const weblinkHint = webLink
    ? `The user provided this source as a starting point: ${webLink}\nAlso ${xHandle ? `check their X profile @${xHandle}` : ""}`
    : xHandle
    ? `Check their X profile @${xHandle} as a priority source.`
    : "";

  const prompt = DEEP_RESEARCH_PROMPT.replace("{NAME}", name).replace(
    "{WEBLINK_HINT}",
    weblinkHint
  );

  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 8000,
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 8,
      } as any,
    ],
    messages: [{ role: "user", content: prompt }],
  });

  // Extract text + sources from response
  let fullText = "";
  const sources: string[] = [];

  for (const block of response.content) {
    if (block.type === "text") {
      fullText += block.text;
    } else if ((block.type as string) === "web_search_tool_result") {
      const result = block as any;
      if (Array.isArray(result.content)) {
        for (const item of result.content) {
          if (item.url) sources.push(item.url);
        }
      }
    }
  }

  // Parse JSON from response
  let analysis: any = null;
  try {
    const jsonMatch = fullText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      analysis = JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error("Failed to parse Claude research JSON:", e);
    throw new Error("Claude returned invalid JSON");
  }

  return {
    analysis,
    sourcesUsed: sources,
    rawText: fullText,
    tokensUsed: {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
    },
  };
}
