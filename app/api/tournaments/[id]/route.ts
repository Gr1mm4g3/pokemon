import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNextPendingMatch } from "@/lib/tournament/orchestrator";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        user: {
          select: { username: true },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    const nextMatch = await getNextPendingMatch(id);

    const recentMatches = await prisma.match.findMany({
      where: {
        tournamentId: id,
        status: "finished",
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
      include: {
        pokemonA: {
          select: { id: true, name: true, spriteUrl: true, eloRating: true },
        },
        pokemonB: {
          select: { id: true, name: true, spriteUrl: true, eloRating: true },
        },
        winner: {
          select: { id: true, name: true, spriteUrl: true },
        },
      },
    });

    const pendingCount = await prisma.match.count({
      where: {
        tournamentId: id,
        status: "pending",
      },
    });

    const finishedCount = await prisma.match.count({
      where: {
        tournamentId: id,
        status: "finished",
      },
    });

    return NextResponse.json({
      tournament,
      nextMatch,
      recentMatches,
      stats: {
        totalMatches: tournament.totalMatches,
        finishedCount,
        pendingCount,
        progressPercent:
          tournament.totalMatches > 0
            ? Math.round((finishedCount / tournament.totalMatches) * 1000) / 10
            : 0,
      },
    });
  } catch (error: any) {
    console.error("Error fetching tournament details:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch tournament" },
      { status: 500 }
    );
  }
}
