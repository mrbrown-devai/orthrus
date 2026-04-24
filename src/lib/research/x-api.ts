// X (Twitter) API research — fetch recent tweets for voice analysis
// Uses X API v2 with Bearer Token (X_API_BEARER_TOKEN)
// Pay-per-use: ~$0.005 per tweet read

const X_BEARER = process.env.X_API_BEARER_TOKEN;
const X_API_BASE = "https://api.twitter.com/2";

export interface XTweet {
  id: string;
  text: string;
  created_at: string;
  public_metrics?: { like_count: number; retweet_count: number; reply_count: number };
}

export interface XResearchResult {
  username: string;
  userId: string;
  tweets: XTweet[];
  totalFetched: number;
}

// Get user ID from username (costs 1 profile lookup ~$0.01)
async function getUserByUsername(username: string): Promise<string | null> {
  if (!X_BEARER) return null;
  const clean = username.replace(/^@/, "");
  try {
    const res = await fetch(`${X_API_BASE}/users/by/username/${clean}`, {
      headers: { Authorization: `Bearer ${X_BEARER}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data?.id || null;
  } catch (e) {
    console.error("X user lookup failed:", e);
    return null;
  }
}

// Fetch recent tweets for a user
async function getUserTweets(userId: string, maxResults: number = 100): Promise<XTweet[]> {
  if (!X_BEARER) return [];
  try {
    const url = `${X_API_BASE}/users/${userId}/tweets?max_results=${Math.min(maxResults, 100)}&tweet.fields=created_at,public_metrics&exclude=retweets,replies`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${X_BEARER}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.error("X tweets fetch failed:", res.status);
      return [];
    }
    const data = await res.json();
    return data.data || [];
  } catch (e) {
    console.error("X tweets fetch error:", e);
    return [];
  }
}

/**
 * Fetch recent tweets for a persona.
 * Returns empty array if X API not configured or username invalid.
 * Cost: ~$0.005 per tweet × N tweets = ~$0.50 for 100 tweets.
 */
export async function researchX(
  xHandle: string,
  maxTweets: number = 100
): Promise<XResearchResult | null> {
  if (!X_BEARER || !xHandle) return null;

  const clean = xHandle.replace(/^@/, "");
  const userId = await getUserByUsername(clean);
  if (!userId) return null;

  const tweets = await getUserTweets(userId, maxTweets);
  return {
    username: clean,
    userId,
    tweets,
    totalFetched: tweets.length,
  };
}

// Summarize tweets into a compact string for Claude context
export function summarizeTweetsForClaude(result: XResearchResult | null): string {
  if (!result || result.tweets.length === 0) return "";

  const topTweets = result.tweets
    .sort((a, b) => (b.public_metrics?.like_count || 0) - (a.public_metrics?.like_count || 0))
    .slice(0, 30); // Top 30 by engagement

  return `X profile: @${result.username}\nRecent high-engagement tweets:\n${topTweets
    .map((t, i) => `${i + 1}. "${t.text}"`)
    .join("\n")}`;
}
