import { prisma } from "../prisma";
import { calculateNewRatings } from "../battle/elo";
import { simulateBattle } from "../battle/engine";
import { BattlePokemon, BattleState, Move, PokemonType } from "../battle/types";

export interface TournamentStandingsRow {
  pokemonId: number;
  name: string;
  spriteUrl: string;
  types: PokemonType[];
  eloRating: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number; // 0 to 100
}

/**
 * Creates a complete 151 Double Round-Robin Tournament (22,650 matches)
 */
export async function createTournament(userId?: string, name?: string) {
  const roster = await prisma.pokemonRoster.findMany({
    select: { id: true, name: true },
    orderBy: { id: "asc" },
  });

  if (roster.length < 151) {
    throw new Error(
      `Pokemon roster incomplete: found ${roster.length} Pokemon. Expected 151.`
    );
  }

  const tournamentName = name || `Kanto 151 Double Round-Robin #${Date.now().toString().slice(-4)}`;

  // 1. Create Tournament record
  const tournament = await prisma.tournament.create({
    data: {
      userId: userId || null,
      name: tournamentName,
      status: "in_progress",
      totalMatches: 151 * 150, // 22,650
      currentMatchIndex: 0,
    },
  });

  // 2. Generate all 22,650 pairings: every pair (A, B) where A != B
  const pairings: Array<{ pokemonAId: number; pokemonBId: number }> = [];
  for (let i = 0; i < roster.length; i++) {
    for (let j = 0; j < roster.length; j++) {
      if (i !== j) {
        pairings.push({
          pokemonAId: roster[i].id,
          pokemonBId: roster[j].id,
        });
      }
    }
  }

  // 3. Shuffle pairings with Fisher-Yates so match variety is optimal
  for (let i = pairings.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairings[i], pairings[j]] = [pairings[j], pairings[i]];
  }

  // 4. Batch insert in chunks of 1,000 for SQLite performance
  const chunkSize = 1000;
  for (let i = 0; i < pairings.length; i += chunkSize) {
    const chunk = pairings.slice(i, i + chunkSize).map((p, idx) => ({
      tournamentId: tournament.id,
      matchOrder: i + idx + 1,
      pokemonAId: p.pokemonAId,
      pokemonBId: p.pokemonBId,
      status: "pending",
    }));

    await prisma.match.createMany({
      data: chunk,
    });
  }

  return tournament;
}

/**
 * Gets the next pending match for a tournament
 */
export async function getNextPendingMatch(tournamentId: string) {
  return await prisma.match.findFirst({
    where: {
      tournamentId,
      status: "pending",
    },
    orderBy: {
      matchOrder: "asc",
    },
    include: {
      pokemonA: true,
      pokemonB: true,
    },
  });
}

function parseRosterPokemon(raw: any): BattlePokemon {
  return {
    id: raw.id,
    name: raw.name,
    spriteUrl: raw.spriteUrl,
    types: JSON.parse(raw.types) as PokemonType[],
    maxHp: 0,
    currentHp: 0,
    stats: JSON.parse(raw.baseStats),
    moves: JSON.parse(raw.moves) as Move[],
    status: "healthy",
    sleepTurnsRemaining: 0,
    hasLeechSeed: false,
    eloRating: raw.eloRating,
  };
}

/**
 * Executes a single match, calculates Elo, and records results in SQLite
 */
export async function executeMatch(matchId: string): Promise<{
  matchId: string;
  battleState: BattleState;
  winnerId: number;
  loserId: number;
  newEloA: number;
  newEloB: number;
  deltaA: number;
  deltaB: number;
}> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      pokemonA: true,
      pokemonB: true,
      tournament: true,
    },
  });

  if (!match) {
    throw new Error(`Match ${matchId} not found`);
  }

  const pA = parseRosterPokemon(match.pokemonA);
  const pB = parseRosterPokemon(match.pokemonB);

  // Run the battle simulation
  const battleState = simulateBattle(pA, pB);
  const winnerId = battleState.winnerId || pA.id;
  const loserId = battleState.loserId || (winnerId === pA.id ? pB.id : pA.id);

  // Calculate Elo updates
  const isAWinner = winnerId === pA.id;
  const winnerOldElo = isAWinner ? pA.eloRating : pB.eloRating;
  const loserOldElo = isAWinner ? pB.eloRating : pA.eloRating;

  const eloResult = calculateNewRatings(winnerOldElo, loserOldElo);

  const newEloA = isAWinner ? eloResult.newWinnerElo : eloResult.newLoserElo;
  const newEloB = isAWinner ? eloResult.newLoserElo : eloResult.newWinnerElo;
  const deltaA = isAWinner ? eloResult.winnerDelta : eloResult.loserDelta;
  const deltaB = isAWinner ? eloResult.loserDelta : eloResult.winnerDelta;

  // Persist to database in a single transaction
  await prisma.$transaction([
    prisma.match.update({
      where: { id: matchId },
      data: {
        status: "finished",
        winnerId,
        turnsCount: battleState.logs.length,
        battleLog: JSON.stringify(battleState.logs),
      },
    }),
    prisma.pokemonRoster.update({
      where: { id: pA.id },
      data: { eloRating: newEloA },
    }),
    prisma.pokemonRoster.update({
      where: { id: pB.id },
      data: { eloRating: newEloB },
    }),
    prisma.tournament.update({
      where: { id: match.tournamentId },
      data: {
        currentMatchIndex: { increment: 1 },
      },
    }),
  ]);

  // Check if tournament is finished
  const remaining = await prisma.match.count({
    where: {
      tournamentId: match.tournamentId,
      status: "pending",
    },
  });

  if (remaining === 0) {
    await prisma.tournament.update({
      where: { id: match.tournamentId },
      data: { status: "completed" },
    });
  }

  return {
    matchId,
    battleState,
    winnerId,
    loserId,
    newEloA,
    newEloB,
    deltaA,
    deltaB,
  };
}

/**
 * Fast-simulates a batch of matches
 */
export async function simulateBatch(tournamentId: string, count: number = 25) {
  const matches = await prisma.match.findMany({
    where: {
      tournamentId,
      status: "pending",
    },
    orderBy: {
      matchOrder: "asc",
    },
    take: count,
  });

  const results = [];
  for (const m of matches) {
    const res = await executeMatch(m.id);
    results.push(res);
  }

  return {
    simulatedCount: results.length,
    lastMatch: results[results.length - 1] ?? null,
  };
}

/**
 * Computes full tournament standings for all 151 Pokemon
 */
export async function getTournamentStandings(
  tournamentId: string
): Promise<TournamentStandingsRow[]> {
  const roster = await prisma.pokemonRoster.findMany({
    orderBy: { eloRating: "desc" },
  });

  // Fetch all finished matches for this tournament
  const finishedMatches = await prisma.match.findMany({
    where: {
      tournamentId,
      status: "finished",
    },
    select: {
      pokemonAId: true,
      pokemonBId: true,
      winnerId: true,
    },
  });

  const statsMap = new Map<
    number,
    { matchesPlayed: number; wins: number; losses: number }
  >();

  for (const p of roster) {
    statsMap.set(p.id, { matchesPlayed: 0, wins: 0, losses: 0 });
  }

  for (const m of finishedMatches) {
    const aStats = statsMap.get(m.pokemonAId);
    if (aStats) {
      aStats.matchesPlayed += 1;
      if (m.winnerId === m.pokemonAId) aStats.wins += 1;
      else aStats.losses += 1;
    }

    const bStats = statsMap.get(m.pokemonBId);
    if (bStats) {
      bStats.matchesPlayed += 1;
      if (m.winnerId === m.pokemonBId) bStats.wins += 1;
      else bStats.losses += 1;
    }
  }

  const standings: TournamentStandingsRow[] = roster.map((p) => {
    const s = statsMap.get(p.id) || { matchesPlayed: 0, wins: 0, losses: 0 };
    const winRate =
      s.matchesPlayed > 0 ? Math.round((s.wins / s.matchesPlayed) * 1000) / 10 : 0;

    return {
      pokemonId: p.id,
      name: p.name,
      spriteUrl: p.spriteUrl,
      types: JSON.parse(p.types) as PokemonType[],
      eloRating: Math.round(p.eloRating),
      matchesPlayed: s.matchesPlayed,
      wins: s.wins,
      losses: s.losses,
      winRate,
    };
  });

  // Sort by Wins DESC, then Win Rate DESC, then Elo DESC
  standings.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.winRate !== a.winRate) return b.winRate - a.winRate;
    return b.eloRating - a.eloRating;
  });

  return standings;
}

/**
 * Gets global Elo leaderboard
 */
export async function getGlobalLeaderboard(limit: number = 151) {
  const roster = await prisma.pokemonRoster.findMany({
    take: limit,
    orderBy: { eloRating: "desc" },
  });

  return roster.map((p, rank) => ({
    rank: rank + 1,
    id: p.id,
    name: p.name,
    spriteUrl: p.spriteUrl,
    types: JSON.parse(p.types) as PokemonType[],
    baseStats: JSON.parse(p.baseStats),
    moves: JSON.parse(p.moves) as Move[],
    eloRating: Math.round(p.eloRating),
  }));
}
