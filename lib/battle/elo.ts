/**
 * Elo Rating Calculator for Pokemon Tournament Simulator
 * Formula: R_new = R_old + K * (Actual - Expected)
 * Expected = 1 / (1 + 10^((OpponentElo - CurrentElo) / 400))
 * K-Factor = 32
 */

export const K_FACTOR = 32;

export function calculateExpectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

export function calculateNewRatings(
  ratingWinner: number,
  ratingLoser: number,
  kFactor: number = K_FACTOR
): { newWinnerElo: number; newLoserElo: number; winnerDelta: number; loserDelta: number } {
  const expectedWinner = calculateExpectedScore(ratingWinner, ratingLoser);
  const expectedLoser = calculateExpectedScore(ratingLoser, ratingWinner);

  // Winner scored 1, Loser scored 0
  const winnerDelta = Math.round(kFactor * (1 - expectedWinner));
  const loserDelta = Math.round(kFactor * (0 - expectedLoser));

  const newWinnerElo = Math.max(100, Math.round(ratingWinner + winnerDelta));
  const newLoserElo = Math.max(100, Math.round(ratingLoser + loserDelta));

  return {
    newWinnerElo,
    newLoserElo,
    winnerDelta,
    loserDelta,
  };
}
