import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTournament } from "@/lib/tournament/orchestrator";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const tournaments = await prisma.tournament.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        _count: {
          select: { matches: true },
        },
      },
    });

    return NextResponse.json({ tournaments });
  } catch (error: any) {
    console.error("Error fetching tournaments:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch tournaments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    let userId: string | undefined;
    try {
      const authObj = await auth();
      userId = authObj.userId || undefined;
    } catch {
      // Unauthenticated or optional auth
    }

    const body = await request.json().catch(() => ({}));
    const name = body.name || `Kanto 151 Championship #${Math.floor(1000 + Math.random() * 9000)}`;

    const tournament = await createTournament(userId, name);

    return NextResponse.json({ tournament }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating tournament:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create tournament" },
      { status: 500 }
    );
  }
}
