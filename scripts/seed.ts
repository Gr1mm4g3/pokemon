import { PrismaClient } from "@prisma/client";
import { MOVES_CATALOG } from "../lib/battle/moves";
import { Move, PokemonType } from "../lib/battle/types";

const prisma = new PrismaClient();

interface PokeApiPokemon {
  id: number;
  name: string;
  sprites: {
    front_default: string | null;
    other?: {
      "official-artwork"?: {
        front_default?: string | null;
      };
    };
  };
  types: Array<{
    slot: number;
    type: {
      name: string;
    };
  }>;
  stats: Array<{
    base_stat: number;
    stat: {
      name: string;
    };
  }>;
  moves: Array<{
    move: {
      name: string;
    };
  }>;
}

function selectMovesForPokemon(
  types: PokemonType[],
  availableMoveNames: Set<string>
): Move[] {
  const chosen: Move[] = [];
  const chosenIds = new Set<string>();

  const addMove = (m: Move | undefined) => {
    if (m && !chosenIds.has(m.id)) {
      chosen.push(m);
      chosenIds.add(m.id);
    }
  };

  // 1. Check for signature recovery or status moves learned by this pokemon
  for (const moveName of availableMoveNames) {
    const normalized = moveName.replace(/-/g, "_");
    const move = MOVES_CATALOG[normalized];
    if (move && move.category === "status" && chosen.length < 2) {
      addMove(move);
    }
  }

  // 2. Add STAB attacking moves matching the pokemon's types
  for (const t of types) {
    const stabCandidates = Object.values(MOVES_CATALOG).filter(
      (m) =>
        m.type === t &&
        m.category !== "status" &&
        (availableMoveNames.has(m.id.replace(/_/g, "-")) || availableMoveNames.has(m.id))
    );
    // Sort by power desc
    stabCandidates.sort((a, b) => b.power - a.power);
    if (stabCandidates[0]) {
      addMove(stabCandidates[0]);
    }
  }

  // 3. Add any other strong moves learned from the catalog
  const otherMoves = Object.values(MOVES_CATALOG).filter(
    (m) =>
      m.category !== "status" &&
      (availableMoveNames.has(m.id.replace(/_/g, "-")) || availableMoveNames.has(m.id))
  );
  otherMoves.sort((a, b) => b.power - a.power);
  for (const m of otherMoves) {
    if (chosen.length >= 4) break;
    addMove(m);
  }

  // 4. If still under 4 moves, fill with standard type-matching or universal moves
  const universalFallbacks = [
    MOVES_CATALOG.tackle,
    MOVES_CATALOG.body_slam,
    MOVES_CATALOG.quick_attack,
    MOVES_CATALOG.hyper_beam,
  ];

  for (const fb of universalFallbacks) {
    if (chosen.length >= 4) break;
    addMove(fb);
  }

  return chosen.slice(0, 4);
}

export async function seedPokemonRoster() {
  console.log("Starting PokeAPI Seeder for the first 151 Pokémon...");

  const existingCount = await prisma.pokemonRoster.count();
  if (existingCount >= 151) {
    console.log(`PokemonRoster already contains ${existingCount} Pokémon. Seeding skipped.`);
    return;
  }

  const batchSize = 10;
  for (let i = 1; i <= 151; i += batchSize) {
    const ids = Array.from(
      { length: Math.min(batchSize, 151 - i + 1) },
      (_, idx) => i + idx
    );

    await Promise.all(
      ids.map(async (id) => {
        try {
          const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
          if (!res.ok) {
            console.error(`Failed to fetch Pokemon #${id}: ${res.statusText}`);
            return;
          }
          const data: PokeApiPokemon = await res.json();

          const name =
            data.name.charAt(0).toUpperCase() + data.name.slice(1).toLowerCase();
          const spriteUrl =
            data.sprites.other?.["official-artwork"]?.front_default ||
            data.sprites.front_default ||
            `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

          const types = data.types.map((t) => t.type.name as PokemonType);

          const statMap: Record<string, number> = {};
          data.stats.forEach((s) => {
            statMap[s.stat.name] = s.base_stat;
          });

          const baseStats = {
            hp: statMap["hp"] || 50,
            attack: statMap["attack"] || 50,
            defense: statMap["defense"] || 50,
            specialAttack: statMap["special-attack"] || 50,
            specialDefense: statMap["special-defense"] || 50,
            speed: statMap["speed"] || 50,
          };

          const learnedMoveNames = new Set(data.moves.map((m) => m.move.name));
          const moves = selectMovesForPokemon(types, learnedMoveNames);

          await prisma.pokemonRoster.upsert({
            where: { id },
            update: {
              name,
              spriteUrl,
              types: JSON.stringify(types),
              baseStats: JSON.stringify(baseStats),
              moves: JSON.stringify(moves),
            },
            create: {
              id,
              name,
              spriteUrl,
              types: JSON.stringify(types),
              baseStats: JSON.stringify(baseStats),
              moves: JSON.stringify(moves),
              eloRating: 1000.0,
            },
          });

          console.log(`[#${id}] ${name} seeded successfully (${types.join("/")})`);
        } catch (err) {
          console.error(`Error processing Pokemon #${id}:`, err);
        }
      })
    );
  }

  const finalCount = await prisma.pokemonRoster.count();
  console.log(`Seeding complete! Total Pokémon in database: ${finalCount}`);
}

if (require.main === module || process.argv[1]?.endsWith("seed.ts")) {
  seedPokemonRoster()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
