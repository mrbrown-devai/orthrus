import { NextRequest, NextResponse } from "next/server";

// In-memory vote store (replace with DB in production)
const votes: Record<string, { personaA: number; personaB: number; voters: Set<string> }> = {};

export async function POST(request: NextRequest) {
  try {
    const { matchId, personaAName, personaBName, vote, voterWallet } = await request.json();

    if (!matchId || !vote || !voterWallet) {
      return NextResponse.json(
        { error: "matchId, vote, and voterWallet are required" },
        { status: 400 }
      );
    }

    // Initialize match if needed
    if (!votes[matchId]) {
      votes[matchId] = { personaA: 0, personaB: 0, voters: new Set() };
    }

    const match = votes[matchId];

    // Check if already voted
    if (match.voters.has(voterWallet)) {
      return NextResponse.json(
        { error: "You have already voted in this match" },
        { status: 400 }
      );
    }

    // Record vote
    match.voters.add(voterWallet);
    if (vote === "a") {
      match.personaA++;
    } else if (vote === "b") {
      match.personaB++;
    } else {
      return NextResponse.json(
        { error: "Vote must be 'a' or 'b'" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      matchId,
      results: {
        personaA: match.personaA,
        personaB: match.personaB,
        totalVotes: match.personaA + match.personaB,
      },
    });
  } catch (error) {
    console.error("Vote error:", error);
    return NextResponse.json(
      { error: "Failed to record vote" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get("matchId");

  if (matchId && votes[matchId]) {
    const match = votes[matchId];
    return NextResponse.json({
      matchId,
      personaA: match.personaA,
      personaB: match.personaB,
      totalVotes: match.personaA + match.personaB,
    });
  }

  // Return all active matches
  const allMatches = Object.entries(votes).map(([id, match]) => ({
    matchId: id,
    personaA: match.personaA,
    personaB: match.personaB,
    totalVotes: match.personaA + match.personaB,
  }));

  return NextResponse.json({ matches: allMatches });
}
