import { NextRequest, NextResponse } from "next/server";
import {
  randomizePokemonMoves,
  randomizeAllPokemonMoves,
} from "@/lib/battle/movePoolResolver";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const pokemonId = body.pokemonId ? parseInt(body.pokemonId, 10) : null;
    const randomizeAll = body.randomizeAll ?? (pokemonId === null);

    if (pokemonId) {
      const newMoves = await randomizePokemonMoves(pokemonId);
      return NextResponse.json({
        success: true,
        pokemonId,
        moves: newMoves,
        message: `Randomized moves for Pokemon #${pokemonId}`,
      });
    }

    if (randomizeAll) {
      const count = await randomizeAllPokemonMoves();
      return NextResponse.json({
        success: true,
        count,
        message: `Randomized moves for all ${count} Pokémon from their individual move pools!`,
      });
    }

    return NextResponse.json(
      { error: "Provide pokemonId or randomizeAll: true" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error randomizing moves:", error);
    return NextResponse.json(
      { error: error.message || "Failed to randomize moves" },
      { status: 500 }
    );
  }
}
