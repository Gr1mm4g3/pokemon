import { getTypeEffectiveness, isPhysicalMove } from "./moves";
import { BattlePokemon, BattleState, Move, PokemonType, TurnActionLog } from "./types";

/**
 * Calculates standard Level 50 HP from base HP
 */
export function calculateLevel50Hp(baseHp: number): number {
  return Math.floor(((baseHp * 2 + 31) * 50) / 100) + 60;
}

/**
 * Calculates standard Level 50 stat from base stat
 */
export function calculateLevel50Stat(baseStat: number): number {
  return Math.floor(((baseStat * 2 + 31) * 50) / 100) + 5;
}

/**
 * Calculates damage for an attacking move against a defending Pokemon
 */
export function calculateDamage(
  attacker: BattlePokemon,
  defender: BattlePokemon,
  move: Move,
  forceMaxRoll: boolean = false
): {
  damage: number;
  isCritical: boolean;
  typeEffectiveness: number;
  isStab: boolean;
} {
  if (move.category === "status" || move.power === 0) {
    return { damage: 0, isCritical: false, typeEffectiveness: 1, isStab: false };
  }

  const typeEffectiveness = getTypeEffectiveness(move.type, defender.types);
  if (typeEffectiveness === 0) {
    return { damage: 0, isCritical: false, typeEffectiveness: 0, isStab: false };
  }

  // Physical vs Special attack/defense calculation
  const isPhysical = isPhysicalMove(move.type);
  let attackStat = isPhysical
    ? calculateLevel50Stat(attacker.stats.attack)
    : calculateLevel50Stat(attacker.stats.specialAttack);

  // Burn reduces physical attack by 50%
  if (attacker.status === "burn" && isPhysical) {
    attackStat = Math.floor(attackStat * 0.5);
  }

  const defenseStat = isPhysical
    ? calculateLevel50Stat(defender.stats.defense)
    : calculateLevel50Stat(defender.stats.specialDefense);

  // Critical hit check (Speed-based, ~6-12% chance)
  const critChance = Math.min(0.2, (attacker.stats.speed / 512) * 1.5);
  const isCritical = !forceMaxRoll && Math.random() < critChance;

  const level = 50;
  const levelFactor = (2 * level) / 5 + 2;
  const baseDamage = ((levelFactor * move.power * (attackStat / Math.max(1, defenseStat))) / 50) + 2;

  // STAB (Same Type Attack Bonus)
  const isStab = attacker.types.includes(move.type);
  const stabMultiplier = isStab ? 1.5 : 1.0;

  // Critical multiplier
  const critMultiplier = isCritical ? 1.5 : 1.0;

  // Random variance between 0.85 and 1.00
  const randomFactor = forceMaxRoll ? 1.0 : 0.85 + Math.random() * 0.15;

  let totalDamage = Math.floor(
    baseDamage * stabMultiplier * typeEffectiveness * critMultiplier * randomFactor
  );

  return {
    damage: Math.max(1, totalDamage),
    isCritical,
    typeEffectiveness,
    isStab,
  };
}

/**
 * AI Decision Tree based on SDD Section 4.1:
 * - Priority 1 (Survival): IF HP < 30% AND has a healing move -> 80% chance to use Heal.
 * - Priority 2 (Status): IF Opponent has no status AND has a status move -> 70% chance to use Status move.
 * - Priority 3 (Type Advantage): Calculate damage for all attack moves with STAB and type effectiveness. Pick highest damage move.
 */
export function selectBestMove(attacker: BattlePokemon, defender: BattlePokemon): Move {
  const moves = attacker.moves.length > 0 ? attacker.moves : [];
  if (moves.length === 0) {
    // Default fallback move
    return {
      id: "struggle",
      name: "Struggle",
      type: "normal",
      category: "physical",
      power: 50,
      accuracy: 100,
      pp: 10,
    };
  }

  const hpRatio = attacker.currentHp / attacker.maxHp;

  // Priority 1: Survival
  if (hpRatio < 0.3) {
    const healingMove = moves.find(
      (m) => m.effect === "heal_50" || m.effect === "heal_100_sleep"
    );
    if (healingMove && Math.random() < 0.8) {
      return healingMove;
    }
  }

  // Priority 2: Status effect
  if (defender.status === "healthy") {
    const statusMove = moves.find(
      (m) =>
        m.effect === "status_sleep" ||
        m.effect === "status_poison" ||
        m.effect === "status_paralyze" ||
        (m.effect === "leech_seed" && !defender.hasLeechSeed)
    );
    if (statusMove && Math.random() < 0.7) {
      return statusMove;
    }
  }

  // Priority 3: Type Advantage / Highest Damage
  let bestMove = moves[0];
  let highestDamage = -1;

  for (const move of moves) {
    if (move.category === "status") continue;
    const { damage } = calculateDamage(attacker, defender, move, true);
    if (damage > highestDamage) {
      highestDamage = damage;
      bestMove = move;
    }
  }

  return bestMove;
}

/**
 * Simulates a single action/move by an active Pokemon
 */
export function executeMove(
  attacker: BattlePokemon,
  defender: BattlePokemon,
  move: Move,
  turnNumber: number
): TurnActionLog[] {
  const logs: TurnActionLog[] = [];

  // 1. Check status conditions preventing movement
  if (attacker.status === "sleep") {
    if (attacker.sleepTurnsRemaining > 0) {
      attacker.sleepTurnsRemaining -= 1;
      logs.push({
        turnNumber,
        attackerId: attacker.id,
        attackerName: attacker.name,
        defenderId: defender.id,
        defenderName: defender.name,
        actionType: "skip",
        damageDealt: 0,
        attackerHpRemaining: attacker.currentHp,
        defenderHpRemaining: defender.currentHp,
        message: `${attacker.name} is fast asleep!`,
      });
      return logs;
    } else {
      attacker.status = "healthy";
      logs.push({
        turnNumber,
        attackerId: attacker.id,
        attackerName: attacker.name,
        defenderId: defender.id,
        defenderName: defender.name,
        actionType: "skip",
        damageDealt: 0,
        attackerHpRemaining: attacker.currentHp,
        defenderHpRemaining: defender.currentHp,
        message: `${attacker.name} woke up!`,
      });
    }
  }

  if (attacker.status === "paralysis" && Math.random() < 0.25) {
    logs.push({
      turnNumber,
      attackerId: attacker.id,
      attackerName: attacker.name,
      defenderId: defender.id,
      defenderName: defender.name,
      actionType: "skip",
      damageDealt: 0,
      attackerHpRemaining: attacker.currentHp,
      defenderHpRemaining: defender.currentHp,
      message: `${attacker.name} is fully paralyzed! It can't move!`,
    });
    return logs;
  }

  // 2. Accuracy check
  const hitSuccess = Math.random() * 100 <= move.accuracy;
  if (!hitSuccess) {
    logs.push({
      turnNumber,
      attackerId: attacker.id,
      attackerName: attacker.name,
      defenderId: defender.id,
      defenderName: defender.name,
      actionType: "move",
      moveName: move.name,
      moveType: move.type,
      damageDealt: 0,
      attackerHpRemaining: attacker.currentHp,
      defenderHpRemaining: defender.currentHp,
      message: `${attacker.name} used ${move.name}, but it missed!`,
    });
    return logs;
  }

  // 3. Handle Special Effects (Heal / Status)
  if (move.effect === "heal_50") {
    const healAmount = Math.min(
      Math.floor(attacker.maxHp * 0.5),
      attacker.maxHp - attacker.currentHp
    );
    attacker.currentHp += healAmount;
    logs.push({
      turnNumber,
      attackerId: attacker.id,
      attackerName: attacker.name,
      defenderId: defender.id,
      defenderName: defender.name,
      actionType: "move",
      moveName: move.name,
      moveType: move.type,
      damageDealt: 0,
      healingDone: healAmount,
      attackerHpRemaining: attacker.currentHp,
      defenderHpRemaining: defender.currentHp,
      message: `${attacker.name} used ${move.name} and recovered ${healAmount} HP!`,
    });
    return logs;
  }

  if (move.effect === "heal_100_sleep") {
    const healAmount = attacker.maxHp - attacker.currentHp;
    attacker.currentHp = attacker.maxHp;
    attacker.status = "sleep";
    attacker.sleepTurnsRemaining = 2;
    logs.push({
      turnNumber,
      attackerId: attacker.id,
      attackerName: attacker.name,
      defenderId: defender.id,
      defenderName: defender.name,
      actionType: "move",
      moveName: move.name,
      moveType: move.type,
      damageDealt: 0,
      healingDone: healAmount,
      statusApplied: "sleep",
      attackerHpRemaining: attacker.currentHp,
      defenderHpRemaining: defender.currentHp,
      message: `${attacker.name} used Rest, fully recovered HP, and fell asleep!`,
    });
    return logs;
  }

  if (move.effect === "status_sleep") {
    if (defender.status === "healthy") {
      defender.status = "sleep";
      defender.sleepTurnsRemaining = Math.floor(Math.random() * 3) + 1;
      logs.push({
        turnNumber,
        attackerId: attacker.id,
        attackerName: attacker.name,
        defenderId: defender.id,
        defenderName: defender.name,
        actionType: "move",
        moveName: move.name,
        moveType: move.type,
        damageDealt: 0,
        statusApplied: "sleep",
        attackerHpRemaining: attacker.currentHp,
        defenderHpRemaining: defender.currentHp,
        message: `${attacker.name} used ${move.name}! ${defender.name} fell asleep!`,
      });
    } else {
      logs.push({
        turnNumber,
        attackerId: attacker.id,
        attackerName: attacker.name,
        defenderId: defender.id,
        defenderName: defender.name,
        actionType: "move",
        moveName: move.name,
        moveType: move.type,
        damageDealt: 0,
        attackerHpRemaining: attacker.currentHp,
        defenderHpRemaining: defender.currentHp,
        message: `${attacker.name} used ${move.name}, but it failed!`,
      });
    }
    return logs;
  }

  if (move.effect === "status_poison") {
    if (defender.status === "healthy" && !defender.types.includes("poison")) {
      defender.status = "poison";
      logs.push({
        turnNumber,
        attackerId: attacker.id,
        attackerName: attacker.name,
        defenderId: defender.id,
        defenderName: defender.name,
        actionType: "move",
        moveName: move.name,
        moveType: move.type,
        damageDealt: 0,
        statusApplied: "poison",
        attackerHpRemaining: attacker.currentHp,
        defenderHpRemaining: defender.currentHp,
        message: `${attacker.name} used ${move.name}! ${defender.name} was poisoned!`,
      });
    } else {
      logs.push({
        turnNumber,
        attackerId: attacker.id,
        attackerName: attacker.name,
        defenderId: defender.id,
        defenderName: defender.name,
        actionType: "move",
        moveName: move.name,
        moveType: move.type,
        damageDealt: 0,
        attackerHpRemaining: attacker.currentHp,
        defenderHpRemaining: defender.currentHp,
        message: `${attacker.name} used ${move.name}, but it had no effect!`,
      });
    }
    return logs;
  }

  if (move.effect === "status_paralyze") {
    if (defender.status === "healthy" && !defender.types.includes("electric")) {
      defender.status = "paralysis";
      logs.push({
        turnNumber,
        attackerId: attacker.id,
        attackerName: attacker.name,
        defenderId: defender.id,
        defenderName: defender.name,
        actionType: "move",
        moveName: move.name,
        moveType: move.type,
        damageDealt: 0,
        statusApplied: "paralysis",
        attackerHpRemaining: attacker.currentHp,
        defenderHpRemaining: defender.currentHp,
        message: `${attacker.name} used ${move.name}! ${defender.name} is paralyzed!`,
      });
    } else {
      logs.push({
        turnNumber,
        attackerId: attacker.id,
        attackerName: attacker.name,
        defenderId: defender.id,
        defenderName: defender.name,
        actionType: "move",
        moveName: move.name,
        moveType: move.type,
        damageDealt: 0,
        attackerHpRemaining: attacker.currentHp,
        defenderHpRemaining: defender.currentHp,
        message: `${attacker.name} used ${move.name}, but it had no effect!`,
      });
    }
    return logs;
  }

  if (move.effect === "leech_seed") {
    if (!defender.hasLeechSeed && !defender.types.includes("grass")) {
      defender.hasLeechSeed = true;
      logs.push({
        turnNumber,
        attackerId: attacker.id,
        attackerName: attacker.name,
        defenderId: defender.id,
        defenderName: defender.name,
        actionType: "move",
        moveName: move.name,
        moveType: move.type,
        damageDealt: 0,
        attackerHpRemaining: attacker.currentHp,
        defenderHpRemaining: defender.currentHp,
        message: `${attacker.name} used ${move.name}! ${defender.name} was seeded!`,
      });
    } else {
      logs.push({
        turnNumber,
        attackerId: attacker.id,
        attackerName: attacker.name,
        defenderId: defender.id,
        defenderName: defender.name,
        actionType: "move",
        moveName: move.name,
        moveType: move.type,
        damageDealt: 0,
        attackerHpRemaining: attacker.currentHp,
        defenderHpRemaining: defender.currentHp,
        message: `${attacker.name} used ${move.name}, but it failed!`,
      });
    }
    return logs;
  }

  // 4. Standard Damage Dealing Move
  const { damage, isCritical, typeEffectiveness } = calculateDamage(
    attacker,
    defender,
    move
  );

  defender.currentHp = Math.max(0, defender.currentHp - damage);

  let message = `${attacker.name} used ${move.name}!`;
  if (typeEffectiveness === 0) {
    message += ` It doesn't affect ${defender.name}...`;
  } else if (typeEffectiveness > 1) {
    message += " It's super effective!";
  } else if (typeEffectiveness < 1) {
    message += " It's not very effective...";
  }

  if (isCritical) {
    message += " A critical hit!";
  }

  logs.push({
    turnNumber,
    attackerId: attacker.id,
    attackerName: attacker.name,
    defenderId: defender.id,
    defenderName: defender.name,
    actionType: "move",
    moveName: move.name,
    moveType: move.type,
    damageDealt: damage,
    isCritical,
    typeEffectiveness,
    attackerHpRemaining: attacker.currentHp,
    defenderHpRemaining: defender.currentHp,
    message,
  });

  return logs;
}

/**
 * Handles end-of-turn status ticks (Poison, Leech Seed)
 */
export function handleStatusTicks(
  pokemon: BattlePokemon,
  opponent: BattlePokemon,
  turnNumber: number
): TurnActionLog[] {
  const logs: TurnActionLog[] = [];

  if (pokemon.currentHp <= 0) return logs;

  if (pokemon.status === "poison") {
    const poisonDamage = Math.max(1, Math.floor(pokemon.maxHp / 8));
    pokemon.currentHp = Math.max(0, pokemon.currentHp - poisonDamage);
    logs.push({
      turnNumber,
      attackerId: pokemon.id,
      attackerName: pokemon.name,
      defenderId: pokemon.id,
      defenderName: pokemon.name,
      actionType: "status_tick",
      damageDealt: poisonDamage,
      attackerHpRemaining: pokemon.currentHp,
      defenderHpRemaining: opponent.currentHp,
      message: `${pokemon.name} was hurt by poison! (-${poisonDamage} HP)`,
    });
  }

  if (pokemon.hasLeechSeed && pokemon.currentHp > 0) {
    const seedDamage = Math.max(1, Math.floor(pokemon.maxHp / 8));
    pokemon.currentHp = Math.max(0, pokemon.currentHp - seedDamage);
    const healAmount = Math.min(
      seedDamage,
      opponent.maxHp - opponent.currentHp
    );
    opponent.currentHp += healAmount;
    logs.push({
      turnNumber,
      attackerId: opponent.id,
      attackerName: opponent.name,
      defenderId: pokemon.id,
      defenderName: pokemon.name,
      actionType: "status_tick",
      damageDealt: seedDamage,
      healingDone: healAmount,
      attackerHpRemaining: opponent.currentHp,
      defenderHpRemaining: pokemon.currentHp,
      message: `Leech Seed saps ${pokemon.name}'s health! ${opponent.name} restored ${healAmount} HP!`,
    });
  }

  return logs;
}

/**
 * Simulates a full Pokemon match to the death
 */
export function simulateBattle(
  pokeA: BattlePokemon,
  pokeB: BattlePokemon,
  maxTurns: number = 80
): BattleState {
  const allLogs: TurnActionLog[] = [];
  let currentTurn = 1;

  // Clone initial states to avoid mutation of input objects
  const pA: BattlePokemon = {
    ...pokeA,
    maxHp: pokeA.maxHp || calculateLevel50Hp(pokeA.stats.hp),
    currentHp: pokeA.maxHp || calculateLevel50Hp(pokeA.stats.hp),
    status: "healthy",
    sleepTurnsRemaining: 0,
    hasLeechSeed: false,
  };

  const pB: BattlePokemon = {
    ...pokeB,
    maxHp: pokeB.maxHp || calculateLevel50Hp(pokeB.stats.hp),
    currentHp: pokeB.maxHp || calculateLevel50Hp(pokeB.stats.hp),
    status: "healthy",
    sleepTurnsRemaining: 0,
    hasLeechSeed: false,
  };

  while (pA.currentHp > 0 && pB.currentHp > 0 && currentTurn <= maxTurns) {
    // Determine turn order based on effective Speed
    const effectiveSpeedA =
      pA.status === "paralysis" ? pA.stats.speed * 0.5 : pA.stats.speed;
    const effectiveSpeedB =
      pB.status === "paralysis" ? pB.stats.speed * 0.5 : pB.stats.speed;

    let first = pA;
    let second = pB;

    if (effectiveSpeedB > effectiveSpeedA) {
      first = pB;
      second = pA;
    } else if (effectiveSpeedB === effectiveSpeedA && Math.random() < 0.5) {
      first = pB;
      second = pA;
    }

    // First attacker acts
    const move1 = selectBestMove(first, second);
    const logs1 = executeMove(first, second, move1, currentTurn);
    allLogs.push(...logs1);

    // Check if second fainted
    if (second.currentHp <= 0) {
      allLogs.push({
        turnNumber: currentTurn,
        attackerId: first.id,
        attackerName: first.name,
        defenderId: second.id,
        defenderName: second.name,
        actionType: "faint",
        damageDealt: 0,
        attackerHpRemaining: first.currentHp,
        defenderHpRemaining: 0,
        message: `${second.name} fainted!`,
      });
      break;
    }

    // Second attacker acts
    const move2 = selectBestMove(second, first);
    const logs2 = executeMove(second, first, move2, currentTurn);
    allLogs.push(...logs2);

    // Check if first fainted
    if (first.currentHp <= 0) {
      allLogs.push({
        turnNumber: currentTurn,
        attackerId: second.id,
        attackerName: second.name,
        defenderId: first.id,
        defenderName: first.name,
        actionType: "faint",
        damageDealt: 0,
        attackerHpRemaining: second.currentHp,
        defenderHpRemaining: 0,
        message: `${first.name} fainted!`,
      });
      break;
    }

    // End-of-turn status ticks for both
    const ticks1 = handleStatusTicks(first, second, currentTurn);
    allLogs.push(...ticks1);
    if (first.currentHp <= 0) {
      allLogs.push({
        turnNumber: currentTurn,
        attackerId: second.id,
        attackerName: second.name,
        defenderId: first.id,
        defenderName: first.name,
        actionType: "faint",
        damageDealt: 0,
        attackerHpRemaining: second.currentHp,
        defenderHpRemaining: 0,
        message: `${first.name} fainted!`,
      });
      break;
    }

    const ticks2 = handleStatusTicks(second, first, currentTurn);
    allLogs.push(...ticks2);
    if (second.currentHp <= 0) {
      allLogs.push({
        turnNumber: currentTurn,
        attackerId: first.id,
        attackerName: first.name,
        defenderId: second.id,
        defenderName: second.name,
        actionType: "faint",
        damageDealt: 0,
        attackerHpRemaining: first.currentHp,
        defenderHpRemaining: 0,
        message: `${second.name} fainted!`,
      });
      break;
    }

    currentTurn++;
  }

  // Determine winner
  let winnerId: number | null = null;
  let loserId: number | null = null;

  if (pA.currentHp > 0 && pB.currentHp <= 0) {
    winnerId = pA.id;
    loserId = pB.id;
  } else if (pB.currentHp > 0 && pA.currentHp <= 0) {
    winnerId = pB.id;
    loserId = pA.id;
  } else {
    // If tie by timeout, winner is highest HP ratio
    const ratioA = pA.currentHp / pA.maxHp;
    const ratioB = pB.currentHp / pB.maxHp;
    if (ratioA >= ratioB) {
      winnerId = pA.id;
      loserId = pB.id;
    } else {
      winnerId = pB.id;
      loserId = pA.id;
    }
  }

  return {
    pokemonA: pA,
    pokemonB: pB,
    currentTurn,
    winnerId,
    loserId,
    isFinished: true,
    logs: allLogs,
  };
}
