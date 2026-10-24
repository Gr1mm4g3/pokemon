import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    let pokemonAId = parseInt(body.pokemonAId, 10);
    let pokemonBId = parseInt(body.pokemonBId, 10);

    if (!pokemonAId || !pokemonBId || pokemonAId === pokemonBId) {
      // Pick two random distinct Pokemon from 1 to 151
      pokemonAId = Math.floor(Math.random() * 151) + 1;
      do {
        pokemonBId = Math.floor(Math.random() * 151) + 1;
      } while (pokemonBId === pokemonAId);
    }

    // Find or create an exhibition tournament container
    let exhibitionTourney = await prisma.tournament.findFirst({
      where: { name: "Exhibition Arena" },
    });

    if (!exhibitionTourney) {
      exhibitionTourney = await prisma.tournament.create({
        data: {
          name: "Exhibition Arena",
          status: "in_progress",
          totalMatches: 9999,
        },
      });
    }

    const highestOrder = await prisma.match.findFirst({
      where: { tournamentId: exhibitionTourney.id },
      orderBy: { matchOrder: "desc" },
      select: { matchOrder: true },
    });

    const match = await prisma.match.create({
      data: {
        tournamentId: exhibitionTourney.id,
        matchOrder: (highestOrder?.matchOrder || 0) + 1,
        pokemonAId,
        pokemonBId,
        status: "pending",
      },
      include: {
        pokemonA: true,
        pokemonB: true,
      },
    });

    return NextResponse.json({ matchId: match.id, tournamentId: exhibitionTourney.id });
  } catch (error: any) {
    console.error("Error creating quick battle:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create quick battle" },
      { status: 500 }
    );
  }
}
