// Shared Anthropic client factory.
// Handles both standard API keys (sk-ant-api03-*) and Claude Max OAuth (sk-ant-oat01-*).
// OAuth tokens only work via Authorization: Bearer — the SDK's header merging
// unreliably sends x-api-key which gets rejected. So for OAuth we use a direct
// fetch-based client that exposes the same .messages.create() interface.

import Anthropic from "@anthropic-ai/sdk";

const BETA_HEADERS = ["oauth-2025-04-20", "web-search-2025-03-05"].join(",");
const API_URL = "https://api.anthropic.com/v1/messages";

export function isOAuthToken(): boolean {
  return (process.env.ANTHROPIC_API_KEY || "").startsWith("sk-ant-oat");
}

// Minimal fetch-based client with the same .messages.create API shape the SDK exposes.
class OAuthClient {
  constructor(private token: string) {}

  messages = {
    create: async (params: any) => {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.token}`,
          "anthropic-version": "2023-06-01",
          "anthropic-beta": BETA_HEADERS,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        const errTxt = await res.text();
        throw new Error(`${res.status} ${errTxt}`);
      }
      return res.json();
    },
  };
}

export function createAnthropicClient(): any {
  const key = process.env.ANTHROPIC_API_KEY || "";
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set");

  if (isOAuthToken()) {
    return new OAuthClient(key);
  }

  // Standard API key — use the SDK (which properly handles web_search)
  return new Anthropic({
    apiKey: key,
    defaultHeaders: { "anthropic-beta": "web-search-2025-03-05" },
  });
}
