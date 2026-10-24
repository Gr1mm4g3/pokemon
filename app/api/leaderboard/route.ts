import { NextResponse } from "next/server";
import { getGlobalLeaderboard } from "@/lib/tournament/orchestrator";

export async function GET() {
  try {
    const leaderboard = await getGlobalLeaderboard(151);
    return NextResponse.json({ leaderboard });
  } catch (error: any) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
