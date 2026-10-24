export type PokemonType =
  | "normal"
  | "fire"
  | "water"
  | "electric"
  | "grass"
  | "ice"
  | "fighting"
  | "poison"
  | "ground"
  | "flying"
  | "psychic"
  | "bug"
  | "rock"
  | "ghost"
  | "dragon"
  | "steel"
  | "dark"
  | "fairy";

export type MoveCategory = "physical" | "special" | "status";

export type StatusEffect = "healthy" | "sleep" | "poison" | "paralysis" | "burn";

export interface Move {
  id: string;
  name: string;
  type: PokemonType;
  category: MoveCategory;
  power: number; // 0 for status
  accuracy: number; // 0-100
  pp: number;
  effect?:
    | "heal_50"
    | "heal_100_sleep"
    | "status_sleep"
    | "status_poison"
    | "status_paralyze"
    | "status_burn"
    | "leech_seed"
    | "stat_buff"
    | "stat_debuff";
  description?: string;
}

export interface PokemonStats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

export interface BattlePokemon {
  id: number;
  name: string;
  spriteUrl: string;
  types: PokemonType[];
  maxHp: number;
  currentHp: number;
  stats: PokemonStats;
  moves: Move[];
  status: StatusEffect;
  sleepTurnsRemaining: number;
  hasLeechSeed: boolean;
  eloRating: number;
}

export interface TurnActionLog {
  turnNumber: number;
  attackerId: number;
  attackerName: string;
  defenderId: number;
  defenderName: string;
  actionType: "move" | "status_tick" | "faint" | "skip";
  moveName?: string;
  moveType?: PokemonType;
  damageDealt: number;
  healingDone?: number;
  isCritical?: boolean;
  typeEffectiveness?: number; // 0, 0.25, 0.5, 1, 2, 4
  statusApplied?: StatusEffect;
  attackerHpRemaining: number;
  defenderHpRemaining: number;
  message: string;
}

export interface BattleState {
  pokemonA: BattlePokemon;
  pokemonB: BattlePokemon;
  currentTurn: number;
  winnerId: number | null;
  loserId: number | null;
  isFinished: boolean;
  logs: TurnActionLog[];
}
