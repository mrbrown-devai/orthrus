// Shared Anthropic SDK factory
// Handles both standard API keys (sk-ant-api03-*) and Claude Max OAuth tokens (sk-ant-oat01-*)
import Anthropic from "@anthropic-ai/sdk";

// Beta headers needed for advanced features (web search, etc.)
// OAuth tokens require the oauth beta flag + any feature betas
const BETA_HEADERS = [
  "oauth-2025-04-20",           // Required for OAuth token use
  "web-search-2025-03-05",      // Enables web_search tool
].join(",");

export function createAnthropicClient() {
  const key = process.env.ANTHROPIC_API_KEY || "";
  if (!key) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }

  // OAuth tokens (Claude Max subscription) use the Authorization: Bearer header
  if (key.startsWith("sk-ant-oat")) {
    return new Anthropic({
      authToken: key,
      defaultHeaders: {
        "anthropic-beta": BETA_HEADERS,
      },
    });
  }

  // Standard API key (sk-ant-api03-*)
  return new Anthropic({
    apiKey: key,
    defaultHeaders: {
      "anthropic-beta": "web-search-2025-03-05",
    },
  });
}

export function isOAuthToken(): boolean {
  return (process.env.ANTHROPIC_API_KEY || "").startsWith("sk-ant-oat");
}
