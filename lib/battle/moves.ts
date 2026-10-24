import { Move, PokemonType } from "./types";

export const TYPE_CHART: Record<PokemonType, Partial<Record<PokemonType, number>>> = {
  normal: { rock: 0.5, ghost: 0 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, bug: 2, rock: 0.5, ghost: 0.5 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 2, flying: 0.5, psychic: 2, ghost: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2 },
  ghost: { normal: 0, psychic: 0, ghost: 2 },
  dragon: { dragon: 2 },
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
  // Classic Gen 1 split:
  // Physical: Normal, Fighting, Flying, Poison, Ground, Rock, Bug, Ghost
  // Special: Fire, Water, Grass, Electric, Ice, Psychic, Dragon
  const physicalTypes: PokemonType[] = ["normal", "fighting", "flying", "poison", "ground", "rock", "bug", "ghost"];
  return physicalTypes.includes(moveType);
}

export const MOVES_CATALOG: Record<string, Move> = {
  // Normal
  tackle: { id: "tackle", name: "Tackle", type: "normal", category: "physical", power: 40, accuracy: 100, pp: 35 },
  scratch: { id: "scratch", name: "Scratch", type: "normal", category: "physical", power: 40, accuracy: 100, pp: 35 },
  quick_attack: { id: "quick_attack", name: "Quick Attack", type: "normal", category: "physical", power: 40, accuracy: 100, pp: 30 },
  body_slam: { id: "body_slam", name: "Body Slam", type: "normal", category: "physical", power: 85, accuracy: 100, pp: 15 },
  slash: { id: "slash", name: "Slash", type: "normal", category: "physical", power: 70, accuracy: 100, pp: 20 },
  hyper_beam: { id: "hyper_beam", name: "Hyper Beam", type: "normal", category: "physical", power: 150, accuracy: 90, pp: 5 },
  double_edge: { id: "double_edge", name: "Double-Edge", type: "normal", category: "physical", power: 100, accuracy: 100, pp: 15 },
  tri_attack: { id: "tri_attack", name: "Tri Attack", type: "normal", category: "special", power: 80, accuracy: 100, pp: 10 },

  // Fire
  ember: { id: "ember", name: "Ember", type: "fire", category: "special", power: 40, accuracy: 100, pp: 25 },
  flamethrower: { id: "flamethrower", name: "Flamethrower", type: "fire", category: "special", power: 90, accuracy: 100, pp: 15 },
  fire_blast: { id: "fire_blast", name: "Fire Blast", type: "fire", category: "special", power: 120, accuracy: 85, pp: 5 },
  fire_punch: { id: "fire_punch", name: "Fire Punch", type: "fire", category: "special", power: 75, accuracy: 100, pp: 15 },

  // Water
  water_gun: { id: "water_gun", name: "Water Gun", type: "water", category: "special", power: 40, accuracy: 100, pp: 25 },
  surf: { id: "surf", name: "Surf", type: "water", category: "special", power: 90, accuracy: 100, pp: 15 },
  hydro_pump: { id: "hydro_pump", name: "Hydro Pump", type: "water", category: "special", power: 120, accuracy: 80, pp: 5 },
  bubble_beam: { id: "bubble_beam", name: "Bubble Beam", type: "water", category: "special", power: 65, accuracy: 100, pp: 20 },

  // Grass
  vine_whip: { id: "vine_whip", name: "Vine Whip", type: "grass", category: "special", power: 45, accuracy: 100, pp: 25 },
  razor_leaf: { id: "razor_leaf", name: "Razor Leaf", type: "grass", category: "special", power: 55, accuracy: 95, pp: 25 },
  solar_beam: { id: "solar_beam", name: "Solar Beam", type: "grass", category: "special", power: 120, accuracy: 100, pp: 10 },
  mega_drain: { id: "mega_drain", name: "Mega Drain", type: "grass", category: "special", power: 40, accuracy: 100, pp: 15 },

  // Electric
  thundershock: { id: "thundershock", name: "Thunder Shock", type: "electric", category: "special", power: 40, accuracy: 100, pp: 30 },
  thunderbolt: { id: "thunderbolt", name: "Thunderbolt", type: "electric", category: "special", power: 90, accuracy: 100, pp: 15 },
  thunder: { id: "thunder", name: "Thunder", type: "electric", category: "special", power: 120, accuracy: 70, pp: 10 },
  thunder_punch: { id: "thunder_punch", name: "Thunder Punch", type: "electric", category: "special", power: 75, accuracy: 100, pp: 15 },

  // Ice
  ice_beam: { id: "ice_beam", name: "Ice Beam", type: "ice", category: "special", power: 90, accuracy: 100, pp: 10 },
  blizzard: { id: "blizzard", name: "Blizzard", type: "ice", category: "special", power: 120, accuracy: 90, pp: 5 },
  ice_punch: { id: "ice_punch", name: "Ice Punch", type: "ice", category: "special", power: 75, accuracy: 100, pp: 15 },

  // Fighting
  karate_chop: { id: "karate_chop", name: "Karate Chop", type: "fighting", category: "physical", power: 50, accuracy: 100, pp: 25 },
  submission: { id: "submission", name: "Submission", type: "fighting", category: "physical", power: 80, accuracy: 80, pp: 20 },
  high_jump_kick: { id: "high_jump_kick", name: "High Jump Kick", type: "fighting", category: "physical", power: 100, accuracy: 90, pp: 10 },

  // Poison
  sludge: { id: "sludge", name: "Sludge", type: "poison", category: "physical", power: 65, accuracy: 100, pp: 20 },
  acid: { id: "acid", name: "Acid", type: "poison", category: "physical", power: 40, accuracy: 100, pp: 30 },

  // Ground
  earthquake: { id: "earthquake", name: "Earthquake", type: "ground", category: "physical", power: 100, accuracy: 100, pp: 10 },
  dig: { id: "dig", name: "Dig", type: "ground", category: "physical", power: 80, accuracy: 100, pp: 10 },
  bone_club: { id: "bone_club", name: "Bone Club", type: "ground", category: "physical", power: 65, accuracy: 85, pp: 20 },

  // Flying
  drill_peck: { id: "drill_peck", name: "Drill Peck", type: "flying", category: "physical", power: 80, accuracy: 100, pp: 20 },
  wing_attack: { id: "wing_attack", name: "Wing Attack", type: "flying", category: "physical", power: 60, accuracy: 100, pp: 35 },
  fly: { id: "fly", name: "Fly", type: "flying", category: "physical", power: 90, accuracy: 95, pp: 15 },

  // Psychic
  confusion: { id: "confusion", name: "Confusion", type: "psychic", category: "special", power: 50, accuracy: 100, pp: 25 },
  psychic: { id: "psychic", name: "Psychic", type: "psychic", category: "special", power: 90, accuracy: 100, pp: 10 },
  psybeam: { id: "psybeam", name: "Psybeam", type: "psychic", category: "special", power: 65, accuracy: 100, pp: 20 },

  // Bug
  pin_missile: { id: "pin_missile", name: "Pin Missile", type: "bug", category: "physical", power: 50, accuracy: 95, pp: 20 },
  twineedle: { id: "twineedle", name: "Twineedle", type: "bug", category: "physical", power: 50, accuracy: 100, pp: 20 },
  leech_life: { id: "leech_life", name: "Leech Life", type: "bug", category: "physical", power: 40, accuracy: 100, pp: 15 },

  // Rock
  rock_slide: { id: "rock_slide", name: "Rock Slide", type: "rock", category: "physical", power: 75, accuracy: 90, pp: 10 },
  rock_throw: { id: "rock_throw", name: "Rock Throw", type: "rock", category: "physical", power: 50, accuracy: 90, pp: 15 },

  // Ghost
  lick: { id: "lick", name: "Lick", type: "ghost", category: "physical", power: 30, accuracy: 100, pp: 30 },
  night_shade: { id: "night_shade", name: "Night Shade", type: "ghost", category: "special", power: 50, accuracy: 100, pp: 15 },

  // Dragon
  dragon_rage: { id: "dragon_rage", name: "Dragon Rage", type: "dragon", category: "special", power: 60, accuracy: 100, pp: 10 },

  // Recovery Moves
  recover: { id: "recover", name: "Recover", type: "normal", category: "status", power: 0, accuracy: 100, pp: 10, effect: "heal_50", description: "Restores up to 50% max HP" },
  soft_boiled: { id: "soft_boiled", name: "Soft-Boiled", type: "normal", category: "status", power: 0, accuracy: 100, pp: 10, effect: "heal_50", description: "Restores up to 50% max HP" },
  rest: { id: "rest", name: "Rest", type: "psychic", category: "status", power: 0, accuracy: 100, pp: 10, effect: "heal_100_sleep", description: "Fully heals user and puts them to sleep for 2 turns" },

  // Status Moves
  spore: { id: "spore", name: "Spore", type: "grass", category: "status", power: 0, accuracy: 100, pp: 15, effect: "status_sleep", description: "Puts the opponent to sleep" },
  sleep_powder: { id: "sleep_powder", name: "Sleep Powder", type: "grass", category: "status", power: 0, accuracy: 75, pp: 15, effect: "status_sleep", description: "Puts the opponent to sleep" },
  hypnosis: { id: "hypnosis", name: "Hypnosis", type: "psychic", category: "status", power: 0, accuracy: 60, pp: 20, effect: "status_sleep", description: "Puts the opponent to sleep" },
  toxic: { id: "toxic", name: "Toxic", type: "poison", category: "status", power: 0, accuracy: 90, pp: 10, effect: "status_poison", description: "Badly poisons the opponent" },
  poison_powder: { id: "poison_powder", name: "Poison Powder", type: "poison", category: "status", power: 0, accuracy: 75, pp: 35, effect: "status_poison", description: "Poisons the opponent" },
  thunder_wave: { id: "thunder_wave", name: "Thunder Wave", type: "electric", category: "status", power: 0, accuracy: 100, pp: 20, effect: "status_paralyze", description: "Paralyzes the opponent" },
  stun_spore: { id: "stun_spore", name: "Stun Spore", type: "grass", category: "status", power: 0, accuracy: 75, pp: 30, effect: "status_paralyze", description: "Paralyzes the opponent" },
  leech_seed: { id: "leech_seed", name: "Leech Seed", type: "grass", category: "status", power: 0, accuracy: 90, pp: 10, effect: "leech_seed", description: "Plants a seed that saps HP each turn" },
};
