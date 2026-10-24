import fs from "fs";
import path from "path";
import { Move, PokemonType } from "./types";
import { prisma } from "../prisma";

const CACHE_DIR = path.join(process.cwd(), "data");
const CACHE_FILE = path.join(CACHE_DIR, "moves-cache.json");

let memoryCache: Record<string, Move> | null = null;

function loadCache(): Record<string, Move> {
  if (memoryCache) return memoryCache;
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const content = fs.readFileSync(CACHE_FILE, "utf-8");
      memoryCache = JSON.parse(content);
      return memoryCache || {};
    }
  } catch (err) {
    console.warn("Failed to load moves-cache.json, starting fresh", err);
  }
  memoryCache = {};
  return memoryCache;
}

function saveCache(cache: Record<string, Move>) {
  memoryCache = cache;
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write moves-cache.json", err);
  }
}

function classifyEffect(
  name: string,
  damageClass: string,
  flavorText?: string
): Move["effect"] | undefined {
  const n = name.toLowerCase();
  const desc = (flavorText || "").toLowerCase();

  // Healing
  if (
    n.includes("recover") ||
    n.includes("soft-boiled") ||
    n.includes("milk-drink") ||
    n.includes("roost") ||
    n.includes("slack-off") ||
    n.includes("synthesis") ||
    n.includes("morning-sun") ||
    n.includes("moonlight") ||
    n.includes("wish") ||
    n.includes("heal-order")
  ) {
    return "heal_50";
  }
  if (n === "rest") return "heal_100_sleep";

  // Status conditions
  if (
    n.includes("spore") ||
    n.includes("sleep") ||
    n.includes("hypnosis") ||
    n.includes("sing") ||
    n.includes("yawn") ||
    desc.includes("puts the target to sleep")
  ) {
    return "status_sleep";
  }
  if (
    n.includes("toxic") ||
    n.includes("poison-powder") ||
    n.includes("poison-gas") ||
    desc.includes("badly poisons")
  ) {
    return "status_poison";
  }
  if (
    n.includes("thunder-wave") ||
    n.includes("stun-spore") ||
    n.includes("glare") ||
    desc.includes("paralyzes the target")
  ) {
    return "status_paralyze";
  }
  if (
    n.includes("will-o-wisp") ||
    desc.includes("inflicts a burn")
  ) {
    return "status_burn";
  }
  if (n.includes("leech-seed")) return "leech_seed";

  if (damageClass === "status") {
    if (
      n.includes("dance") ||
      n.includes("plot") ||
      n.includes("mind") ||
      n.includes("bulk") ||
      n.includes("agility") ||
      n.includes("harden") ||
      n.includes("defense") ||
      n.includes("growth") ||
      n.includes("charge")
    ) {
      return "stat_buff";
    }
    if (
      n.includes("growl") ||
      n.includes("tail-whip") ||
      n.includes("leer") ||
      n.includes("screech") ||
      n.includes("string") ||
      n.includes("smokescreen")
    ) {
      return "stat_debuff";
    }
  }

  return undefined;
}

/**
 * Fetches full Move details from PokeAPI with local filesystem caching
 */
export async function fetchMoveDetails(moveName: string): Promise<Move> {
  const normalizedId = moveName.toLowerCase().replace(/_/g, "-");
  const cache = loadCache();

  if (cache[normalizedId]) {
    return cache[normalizedId];
  }

  try {
    const res = await fetch(`https://pokeapi.co/api/v2/move/${normalizedId}`);
    if (!res.ok) {
      throw new Error(`PokeAPI move ${normalizedId} returned status ${res.status}`);
    }
    const data = await res.json();

    const formattedName = data.name
      .split("-")
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    const type = data.type.name as PokemonType;
    const category = data.damage_class.name as "physical" | "special" | "status";
    const power = data.power || 0;
    const accuracy = data.accuracy || 100;
    const pp = data.pp || 15;

    const flavor = data.flavor_text_entries?.find(
      (f: any) => f.language?.name === "en"
    )?.flavor_text?.replace(/\n|\f/g, " ");

    const effect = classifyEffect(data.name, category, flavor);

    const move: Move = {
      id: normalizedId,
      name: formattedName,
      type,
      category,
      power,
      accuracy,
      pp,
      effect,
      description: flavor || `${formattedName} (${type})`,
    };

    cache[normalizedId] = move;
    saveCache(cache);
    return move;
  } catch (err) {
    console.warn(`Fallback for move ${moveName}:`, err);
    // Generic fallback move
    const fallback: Move = {
      id: normalizedId,
      name: normalizedId.replace(/-/g, " ").toUpperCase(),
      type: "normal",
      category: "physical",
      power: 50,
      accuracy: 100,
      pp: 20,
      description: "A standard attack move.",
    };
    cache[normalizedId] = fallback;
    saveCache(cache);
    return fallback;
  }
}

/**
 * Randomly picks 4 moves from the Pokemon's own specific move pool,
 * ensuring at least 1-2 damaging moves for thrilling combat.
 */
export async function generateRandomMoveset(
  movePoolNames: string[],
  pokemonTypes: PokemonType[]
): Promise<Move[]> {
  if (!movePoolNames || movePoolNames.length === 0) {
    // If pool empty, fallback to tackle
    return [
      await fetchMoveDetails("tackle"),
      await fetchMoveDetails("scratch"),
      await fetchMoveDetails("body-slam"),
      await fetchMoveDetails("hyper-beam"),
    ];
  }

  // Shuffle move pool using Fisher-Yates
  const shuffled = [...movePoolNames];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Resolve move details in batches until we have 4 moves with at least 2 attack moves
  const chosenMoves: Move[] = [];
  const chosenIds = new Set<string>();

  for (const moveName of shuffled) {
    if (chosenMoves.length >= 4) break;
    const move = await fetchMoveDetails(moveName);
    if (!chosenIds.has(move.id)) {
      chosenMoves.push(move);
      chosenIds.add(move.id);
    }
  }

  // Check if we have at least 1 damaging move. If not, look through pool for damaging moves
  const attackCount = chosenMoves.filter((m) => m.power > 0).length;
  if (attackCount === 0) {
    for (const moveName of shuffled) {
      if (chosenIds.has(moveName)) continue;
      const move = await fetchMoveDetails(moveName);
      if (move.power > 0) {
        // Replace the last move with this damaging move
        chosenMoves[chosenMoves.length - 1] = move;
        break;
      }
    }
  }

  return chosenMoves;
}

/**
 * Randomizes moveset for a single Pokemon from its specific move pool in SQLite
 */
export async function randomizePokemonMoves(pokemonId: number): Promise<Move[]> {
  const p = await prisma.pokemonRoster.findUnique({
    where: { id: pokemonId },
  });

  if (!p) throw new Error(`Pokemon #${pokemonId} not found`);

  const types = JSON.parse(p.types) as PokemonType[];
  const pool = p.movePool ? (JSON.parse(p.movePool) as string[]) : [];

  const newMoves = await generateRandomMoveset(pool, types);

  await prisma.pokemonRoster.update({
    where: { id: pokemonId },
    data: {
      moves: JSON.stringify(newMoves),
    },
  });

  return newMoves;
}

/**
 * Randomizes movesets for ALL 151 Pokemon from their individual move pools
 */
export async function randomizeAllPokemonMoves(): Promise<number> {
  const roster = await prisma.pokemonRoster.findMany({
    orderBy: { id: "asc" },
  });

  let count = 0;
  for (const p of roster) {
    const types = JSON.parse(p.types) as PokemonType[];
    const pool = p.movePool ? (JSON.parse(p.movePool) as string[]) : [];
    if (pool.length > 0) {
      const newMoves = await generateRandomMoveset(pool, types);
      await prisma.pokemonRoster.update({
        where: { id: p.id },
        data: {
          moves: JSON.stringify(newMoves),
        },
      });
      count++;
    }
  }

  return count;
}
