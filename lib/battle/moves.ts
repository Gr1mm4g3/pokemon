import { Move, PokemonType } from "./types";

export const TYPE_CHART: Record<PokemonType, Partial<Record<PokemonType, number>>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

export function getTypeEffectiveness(moveType: PokemonType, defenderTypes: PokemonType[]): number {
  let multiplier = 1;
  const attackChart = TYPE_CHART[moveType] || {};
  for (const defType of defenderTypes) {
    if (defType in attackChart) {
      multiplier *= attackChart[defType]!;
    }
  }
  return multiplier;
}

export function isPhysicalMove(moveType: PokemonType): boolean {
  // Classic split with modern types:
  const physicalTypes: PokemonType[] = [
    "normal",
    "fighting",
    "flying",
    "poison",
    "ground",
    "rock",
    "bug",
    "ghost",
    "steel",
  ];
  return physicalTypes.includes(moveType);
}

// Fallback base moves in case network is down
export const MOVES_CATALOG: Record<string, Move> = {
  tackle: { id: "tackle", name: "Tackle", type: "normal", category: "physical", power: 40, accuracy: 100, pp: 35 },
  scratch: { id: "scratch", name: "Scratch", type: "normal", category: "physical", power: 40, accuracy: 100, pp: 35 },
  body_slam: { id: "body_slam", name: "Body Slam", type: "normal", category: "physical", power: 85, accuracy: 100, pp: 15 },
  hyper_beam: { id: "hyper_beam", name: "Hyper Beam", type: "normal", category: "physical", power: 150, accuracy: 90, pp: 5 },
  flamethrower: { id: "flamethrower", name: "Flamethrower", type: "fire", category: "special", power: 90, accuracy: 100, pp: 15 },
  surf: { id: "surf", name: "Surf", type: "water", category: "special", power: 90, accuracy: 100, pp: 15 },
  thunderbolt: { id: "thunderbolt", name: "Thunderbolt", type: "electric", category: "special", power: 90, accuracy: 100, pp: 15 },
  psychic: { id: "psychic", name: "Psychic", type: "psychic", category: "special", power: 90, accuracy: 100, pp: 10 },
  earthquake: { id: "earthquake", name: "Earthquake", type: "ground", category: "physical", power: 100, accuracy: 100, pp: 10 },
  ice_beam: { id: "ice_beam", name: "Ice Beam", type: "ice", category: "special", power: 90, accuracy: 100, pp: 10 },
  recover: { id: "recover", name: "Recover", type: "normal", category: "status", power: 0, accuracy: 100, pp: 10, effect: "heal_50" },
  rest: { id: "rest", name: "Rest", type: "psychic", category: "status", power: 0, accuracy: 100, pp: 10, effect: "heal_100_sleep" },
  toxic: { id: "toxic", name: "Toxic", type: "poison", category: "status", power: 0, accuracy: 90, pp: 10, effect: "status_poison" },
  thunder_wave: { id: "thunder_wave", name: "Thunder Wave", type: "electric", category: "status", power: 0, accuracy: 100, pp: 20, effect: "status_paralyze" },
  spore: { id: "spore", name: "Spore", type: "grass", category: "status", power: 0, accuracy: 100, pp: 15, effect: "status_sleep" },
};
