import { NextRequest, NextResponse } from "next/server";
import { getTournamentStandings } from "@/lib/tournament/orchestrator";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const standings = await getTournamentStandings(id);
    return NextResponse.json({ standings });
  } catch (error: any) {
    console.error("Error fetching standings:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch standings" },
      { status: 500 }
    );
  }
}
