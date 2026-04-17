import { NextRequest, NextResponse } from "next/server";

// GET: Scheduled autopilot runner (called by Vercel Cron)
// Note: in this beta, client-side agents live in Zustand localStorage, so the cron can't directly
// iterate server-side. This endpoint exists for future DB-backed scheduling.
// For now, scheduled autopilot is triggered client-side by a setInterval in the dashboard.
export async function GET(request: NextRequest) {
  const secret = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (expected && secret !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    message: "Cron endpoint ready. Scheduled autopilot runs client-side until DB-backed scheduling is added.",
    timestamp: Date.now(),
  });
}
