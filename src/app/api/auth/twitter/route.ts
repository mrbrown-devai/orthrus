import { NextRequest, NextResponse } from "next/server";
import { getTwitterAuthUrl } from "@/lib/twitter";
import { cookies } from "next/headers";

const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL 
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/twitter/callback`
  : "https://orthrus.vercel.app/api/auth/twitter/callback";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const agentId = searchParams.get("agentId");

  if (!agentId) {
    return NextResponse.json({ error: "agentId required" }, { status: 400 });
  }

  if (!TWITTER_CLIENT_ID) {
    return NextResponse.json(
      { error: "Twitter not configured" },
      { status: 500 }
    );
  }

  try {
    const { url, state } = await getTwitterAuthUrl(
      TWITTER_CLIENT_ID,
      REDIRECT_URI,
      agentId
    );

    // Store state in cookie for verification
    const cookieStore = await cookies();
    cookieStore.set("twitter_auth_state", JSON.stringify(state), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    return NextResponse.redirect(url);
  } catch (error) {
    console.error("Twitter auth error:", error);
    return NextResponse.json(
      { error: "Failed to initiate Twitter auth" },
      { status: 500 }
    );
  }
}
