import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { postTweet, refreshAccessToken } from "@/lib/twitter";

const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID!;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET!;

interface TokenData {
  agentId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  userId: string;
  username: string;
}

export async function POST(request: NextRequest) {
  try {
    const { agentId, text } = await request.json();

    if (!agentId || !text) {
      return NextResponse.json(
        { error: "agentId and text required" },
        { status: 400 }
      );
    }

    if (text.length > 280) {
      return NextResponse.json(
        { error: "Tweet exceeds 280 characters" },
        { status: 400 }
      );
    }

    // Get tokens from cookie
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get(`twitter_tokens_${agentId}`);

    if (!tokenCookie) {
      return NextResponse.json(
        { error: "Twitter not connected for this agent" },
        { status: 401 }
      );
    }

    let tokenData: TokenData;
    try {
      tokenData = JSON.parse(tokenCookie.value);
    } catch {
      return NextResponse.json(
        { error: "Invalid token data" },
        { status: 401 }
      );
    }

    // Check if token is expired and refresh if needed
    let accessToken = tokenData.accessToken;
    if (Date.now() >= tokenData.expiresAt - 60000 && tokenData.refreshToken) {
      try {
        const newTokens = await refreshAccessToken(
          tokenData.refreshToken,
          TWITTER_CLIENT_ID,
          TWITTER_CLIENT_SECRET
        );
        
        accessToken = newTokens.access_token;
        
        // Update stored tokens
        const updatedTokenData = {
          ...tokenData,
          accessToken: newTokens.access_token,
          refreshToken: newTokens.refresh_token || tokenData.refreshToken,
          expiresAt: Date.now() + newTokens.expires_in * 1000,
        };
        
        cookieStore.set(`twitter_tokens_${agentId}`, JSON.stringify(updatedTokenData), {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30,
          path: "/",
        });
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        return NextResponse.json(
          { error: "Token expired, please reconnect Twitter" },
          { status: 401 }
        );
      }
    }

    // Post the tweet
    const tweet = await postTweet(accessToken, text);

    return NextResponse.json({
      success: true,
      tweet: {
        id: tweet.id,
        text: tweet.text,
        url: `https://twitter.com/${tokenData.username}/status/${tweet.id}`,
      },
    });
  } catch (error) {
    console.error("Tweet post error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to post tweet" },
      { status: 500 }
    );
  }
}
