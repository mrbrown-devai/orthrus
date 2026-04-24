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

  // OAuth tokens (Claude Max) AND standard API keys both work via x-api-key.
  // The SDK always sends x-api-key, so if we use authToken only, x-api-key goes as empty → 401.
  // Fix: pass the token as apiKey. Verified: sk-ant-oat01-* works with x-api-key header.
  const isOAuth = key.startsWith("sk-ant-oat");
  return new Anthropic({
    apiKey: key,
    defaultHeaders: {
      "anthropic-beta": isOAuth ? BETA_HEADERS : "web-search-2025-03-05",
    },
  });
}

export function isOAuthToken(): boolean {
  return (process.env.ANTHROPIC_API_KEY || "").startsWith("sk-ant-oat");
}
