import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCodeForTokens, getTwitterUser, type TwitterAuthState } from "@/lib/twitter";

const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID!;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/twitter/callback`
  : "https://orthrus.vercel.app/api/auth/twitter/callback";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://orthrus.vercel.app";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Handle user denial
  if (error) {
    return NextResponse.redirect(
      `${APP_URL}/dashboard?error=${encodeURIComponent(error)}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${APP_URL}/dashboard?error=missing_params`
    );
  }

  // Verify state
  const cookieStore = await cookies();
  const storedState = cookieStore.get("twitter_auth_state");
  
  if (!storedState) {
    return NextResponse.redirect(
      `${APP_URL}/dashboard?error=missing_state`
    );
  }

  let authState: TwitterAuthState;
  try {
    authState = JSON.parse(storedState.value);
  } catch {
    return NextResponse.redirect(
      `${APP_URL}/dashboard?error=invalid_state`
    );
  }

  if (authState.state !== state) {
    return NextResponse.redirect(
      `${APP_URL}/dashboard?error=state_mismatch`
    );
  }

  // Clear the state cookie
  cookieStore.delete("twitter_auth_state");

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(
      code,
      authState.codeVerifier,
      TWITTER_CLIENT_ID,
      TWITTER_CLIENT_SECRET,
      REDIRECT_URI
    );

    // Get user info
    const user = await getTwitterUser(tokens.access_token);

    // Store tokens in a secure cookie (in production, use encrypted storage)
    // The tokens are associated with the agentId
    const tokenData = {
      agentId: authState.agentId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + tokens.expires_in * 1000,
      userId: user.id,
      username: user.username,
      name: user.name,
      profileImageUrl: user.profile_image_url,
    };

    // Store in cookie (limited to 4KB, so for production use a DB)
    cookieStore.set(`twitter_tokens_${authState.agentId}`, JSON.stringify(tokenData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    // Redirect back to dashboard with success
    return NextResponse.redirect(
      `${APP_URL}/dashboard?twitter_connected=true&agentId=${authState.agentId}&username=${user.username}`
    );
  } catch (err) {
    console.error("Twitter callback error:", err);
    return NextResponse.redirect(
      `${APP_URL}/dashboard?error=token_exchange_failed`
    );
  }
}
