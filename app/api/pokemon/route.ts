import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const pokemon = await prisma.pokemonRoster.findMany({
      orderBy: { id: "asc" },
    });

    const parsed = pokemon.map((p) => ({
      id: p.id,
      name: p.name,
      spriteUrl: p.spriteUrl,
      types: JSON.parse(p.types),
      baseStats: JSON.parse(p.baseStats),
      moves: JSON.parse(p.moves),
      eloRating: Math.round(p.eloRating),
    }));

    return NextResponse.json({ pokemon: parsed });
  } catch (error: any) {
    console.error("Error fetching pokemon list:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch pokemon" },
      { status: 500 }
    );
  }
}
