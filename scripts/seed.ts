import { PrismaClient } from "@prisma/client";
import { generateRandomMoveset } from "../lib/battle/movePoolResolver";
import { PokemonType } from "../lib/battle/types";

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

export async function seedPokemonRoster(forceRandomize: boolean = true) {
  console.log("Starting PokeAPI Seeder with unique random movesets from each Pokémon's pool...");

  const existingCount = await prisma.pokemonRoster.count();
  const shouldRefetch = existingCount < 151 || forceRandomize;

  if (!shouldRefetch) {
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

          // Full move pool for this specific Pokemon
          const movePool = data.moves.map((m) => m.move.name);

          // Randomly select 4 moves from this Pokemon's individual move pool
          const moves = await generateRandomMoveset(movePool, types);

          await prisma.pokemonRoster.upsert({
            where: { id },
            update: {
              name,
              spriteUrl,
              types: JSON.stringify(types),
              baseStats: JSON.stringify(baseStats),
              moves: JSON.stringify(moves),
              movePool: JSON.stringify(movePool),
            },
            create: {
              id,
              name,
              spriteUrl,
              types: JSON.stringify(types),
              baseStats: JSON.stringify(baseStats),
              moves: JSON.stringify(moves),
              movePool: JSON.stringify(movePool),
              eloRating: 1000.0,
            },
          });

          console.log(
            `[#${id}] ${name} seeded with moves: ${moves.map((m) => m.name).join(", ")}`
          );
        } catch (err) {
          console.error(`Error processing Pokemon #${id}:`, err);
        }
      })
    );
  }

  const finalCount = await prisma.pokemonRoster.count();
  console.log(`Seeding complete! Total Pokémon with unique random moves: ${finalCount}`);
}

if (require.main === module || process.argv[1]?.endsWith("seed.ts")) {
  seedPokemonRoster(true)
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
