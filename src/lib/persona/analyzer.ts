import { Persona } from "@/lib/store";
import { PERSONA_TRAITS } from "@/lib/constants";

interface WaybackSnapshot {
  url: string;
  timestamp: string;
  content?: string;
}

interface ScrapedProfile {
  handle: string;
  name: string;
  bio?: string;
  tweets: string[];
  waybackData: WaybackSnapshot[];
}

/**
 * Fetch historical data from Web Archive (Wayback Machine)
 */
async function fetchWaybackData(handle: string): Promise<WaybackSnapshot[]> {
  try {
    const cdxUrl = `https://web.archive.org/cdx/search/cdx?url=twitter.com/${handle}&output=json&limit=10&fl=timestamp,original`;
    const response = await fetch(cdxUrl);
    
    if (!response.ok) return [];
    
    const data = await response.json();
    if (!Array.isArray(data) || data.length < 2) return [];
    
    // Skip header row
    const snapshots: WaybackSnapshot[] = data.slice(1).map(([timestamp, url]: [string, string]) => ({
      timestamp,
      url: `https://web.archive.org/web/${timestamp}/${url}`,
    }));
    
    return snapshots;
  } catch (error) {
    console.error("Wayback fetch error:", error);
    return [];
  }
}

/**
 * Scrape current profile data from nitter/public sources
 */
async function scrapeProfile(handle: string): Promise<ScrapedProfile | null> {
  try {
    // Try multiple nitter instances
    const nitterInstances = [
      "nitter.poast.org",
      "nitter.privacydev.net",
      "nitter.woodland.cafe",
    ];
    
    let profileHtml = "";
    for (const instance of nitterInstances) {
      try {
        const response = await fetch(`https://${instance}/${handle}`, {
          headers: { "User-Agent": "Mozilla/5.0" },
        });
        if (response.ok) {
          profileHtml = await response.text();
          break;
        }
      } catch {
        continue;
      }
    }
    
    if (!profileHtml) {
      // Fallback: return minimal data
      return {
        handle,
        name: handle,
        tweets: [],
        waybackData: await fetchWaybackData(handle),
      };
    }
    
    // Basic parsing (in production, use proper HTML parser)
    const nameMatch = profileHtml.match(/<title>([^<]+)/);
    const bioMatch = profileHtml.match(/class="profile-bio"[^>]*>([^<]+)/);
    const tweetMatches = profileHtml.matchAll(/class="tweet-content[^"]*"[^>]*>([^<]+)/g);
    
    const tweets: string[] = [];
    for (const match of tweetMatches) {
      if (tweets.length < 20) {
        tweets.push(match[1].trim());
      }
    }
    
    const waybackData = await fetchWaybackData(handle);
    
    return {
      handle,
      name: nameMatch ? nameMatch[1].split("(")[0].trim() : handle,
      bio: bioMatch ? bioMatch[1].trim() : undefined,
      tweets,
      waybackData,
    };
  } catch (error) {
    console.error("Profile scrape error:", error);
    return null;
  }
}

/**
 * Analyze profile using Claude to extract personality traits
 * Uses Claude MAX via Anthropic API
 */
export async function analyzePersona(handle: string): Promise<Persona | null> {
  try {
    // 1. Scrape profile data from X + Web Archive
    const profile = await scrapeProfile(handle);
    
    if (!profile) {
      return null;
    }
    
    // 2. Build analysis prompt
    const analysisPrompt = buildAnalysisPrompt(profile);
    
    // 3. Call Claude API for deep personality analysis
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        handle,
        profile,
        prompt: analysisPrompt,
      }),
    });
    
    if (!response.ok) {
      throw new Error("Analysis API failed");
    }
    
    const analysis = await response.json();
    
    // 4. Build Persona object
    const persona: Persona = {
      id: `persona_${handle}_${Date.now()}`,
      name: profile.name || handle,
      handle: handle.startsWith("@") ? handle : `@${handle}`,
      avatar: `https://unavatar.io/twitter/${handle}`,
      traits: analysis.traits || extractTraitsFromTweets(profile.tweets),
      samplePosts: analysis.samplePosts || profile.tweets.slice(0, 5),
      weight: 50,
    };
    
    return persona;
  } catch (error) {
    console.error("Persona analysis error:", error);
    
    // Return basic persona on error
    return {
      id: `persona_${handle}_${Date.now()}`,
      name: handle,
      handle: handle.startsWith("@") ? handle : `@${handle}`,
      avatar: `https://unavatar.io/twitter/${handle}`,
      traits: ["unknown"],
      samplePosts: [],
      weight: 50,
    };
  }
}

function buildAnalysisPrompt(profile: ScrapedProfile): string {
  return `Analyze this X/Twitter profile to understand their personality, communication style, and mindset.

Handle: @${profile.handle}
Name: ${profile.name}
Bio: ${profile.bio || "N/A"}

Recent tweets:
${profile.tweets.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Web Archive snapshots available: ${profile.waybackData.length} historical captures

Based on this data, identify:
1. Their top 3-5 personality traits from: ${PERSONA_TRAITS.join(", ")}
2. Their communication style (casual, formal, meme-heavy, etc.)
3. Topics they frequently discuss
4. 5 example posts that capture their essence

Return as JSON:
{
  "traits": ["trait1", "trait2", ...],
  "style": "description of style",
  "topics": ["topic1", "topic2", ...],
  "samplePosts": ["post1", "post2", ...]
}`;
}

function extractTraitsFromTweets(tweets: string[]): string[] {
  const traits: string[] = [];
  const content = tweets.join(" ").toLowerCase();
  
  // Simple keyword-based trait detection
  if (content.includes("lol") || content.includes("😂") || content.includes("funny")) {
    traits.push("humor");
  }
  if (content.includes("code") || content.includes("dev") || content.includes("build")) {
    traits.push("technical");
  }
  if (content.includes("think") || content.includes("meaning") || content.includes("life")) {
    traits.push("philosophical");
  }
  if (content.includes("❤️") || content.includes("love") || content.includes("support")) {
    traits.push("wholesome");
  }
  if (content.includes("gm") || content.includes("wagmi") || content.includes("meme")) {
    traits.push("memetic");
  }
  
  return traits.length > 0 ? traits : ["informative"];
}

/**
 * Generate fusion prompt for two personas
 */
export function generateFusionPrompt(persona1: Persona, persona2: Persona): string {
  const weight1 = persona1.weight / (persona1.weight + persona2.weight);
  const weight2 = persona2.weight / (persona1.weight + persona2.weight);
  
  return `You are a fusion of two X/Twitter personalities:

PERSONA 1 (${Math.round(weight1 * 100)}% influence): ${persona1.name} (@${persona1.handle})
Traits: ${persona1.traits.join(", ")}
Sample posts:
${persona1.samplePosts.map(p => `- "${p}"`).join("\n")}

PERSONA 2 (${Math.round(weight2 * 100)}% influence): ${persona2.name} (@${persona2.handle})
Traits: ${persona2.traits.join(", ")}
Sample posts:
${persona2.samplePosts.map(p => `- "${p}"`).join("\n")}

Generate posts that blend both personalities proportionally. Match their combined energy, topics, and style.
Be authentic — don't just copy, synthesize something new that honors both voices.`;
}
