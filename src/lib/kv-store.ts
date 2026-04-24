// Lightweight key-value store using Upstash Redis REST API.
// Free tier (10K commands/day) is plenty for beta.
// Gracefully degrades if UPSTASH_REDIS_URL + UPSTASH_REDIS_TOKEN not set.
// Setup: https://upstash.com/ → create Redis → copy REST URL + token → add to Vercel env vars

const URL = process.env.UPSTASH_REDIS_URL;
const TOKEN = process.env.UPSTASH_REDIS_TOKEN;

export function isKvConfigured(): boolean {
  return !!(URL && TOKEN);
}

async function call(cmd: string[]): Promise<any> {
  if (!URL || !TOKEN) throw new Error("KV_NOT_CONFIGURED");
  const res = await fetch(URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cmd),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`KV error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.result;
}

// Generic helpers
export async function kvSet(key: string, value: any, ttlSeconds?: number): Promise<void> {
  const cmd = ["SET", key, JSON.stringify(value)];
  if (ttlSeconds) { cmd.push("EX", String(ttlSeconds)); }
  await call(cmd);
}

export async function kvGet<T = any>(key: string): Promise<T | null> {
  const result = await call(["GET", key]);
  if (!result) return null;
  try { return JSON.parse(result); } catch { return result as any; }
}

export async function kvDel(key: string): Promise<void> {
  await call(["DEL", key]);
}

export async function kvKeys(pattern: string): Promise<string[]> {
  return (await call(["KEYS", pattern])) || [];
}

// Set operations (for tracking active agents)
export async function kvSadd(setKey: string, value: string): Promise<void> {
  await call(["SADD", setKey, value]);
}
export async function kvSrem(setKey: string, value: string): Promise<void> {
  await call(["SREM", setKey, value]);
}
export async function kvSmembers(setKey: string): Promise<string[]> {
  return (await call(["SMEMBERS", setKey])) || [];
}

// Increment (for daily post counters)
export async function kvIncr(key: string, ttlSeconds?: number): Promise<number> {
  const val = await call(["INCR", key]);
  if (ttlSeconds) await call(["EXPIRE", key, String(ttlSeconds)]);
  return val;
}
