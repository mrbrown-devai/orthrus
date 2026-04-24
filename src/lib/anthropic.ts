// Shared Anthropic SDK factory
// Handles both standard API keys (sk-ant-api03-*) and Claude Max OAuth tokens (sk-ant-oat01-*)
import Anthropic from "@anthropic-ai/sdk";

export function createAnthropicClient() {
  const key = process.env.ANTHROPIC_API_KEY || "";
  if (!key) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }

  // OAuth tokens (Claude Max subscription) use the Authorization: Bearer header,
  // not x-api-key. The SDK supports this via `authToken`.
  if (key.startsWith("sk-ant-oat")) {
    return new Anthropic({
      authToken: key,
      // Claude Max OAuth requires this beta header for some features
      defaultHeaders: {
        "anthropic-beta": "oauth-2025-04-20",
      },
    });
  }

  // Standard API key
  return new Anthropic({ apiKey: key });
}

// Is the configured key an OAuth token? (used to disable features OAuth doesn't support)
export function isOAuthToken(): boolean {
  return (process.env.ANTHROPIC_API_KEY || "").startsWith("sk-ant-oat");
}
