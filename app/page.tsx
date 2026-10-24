"use client";

import React, { useState, useEffect } from "react";
import { BattleArena } from "@/components/arena/BattleArena";
import { StandingsTable } from "@/components/tournament/StandingsTable";
import { GlobalLeaderboard } from "@/components/leaderboard/GlobalLeaderboard";
import { QuickBattleModal } from "@/components/arena/QuickBattleModal";
import {
  Swords,
  Trophy,
  Flame,
  PlusCircle,
  Sparkles,
  Zap,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  Shuffle,
} from "lucide-react";
import Image from "next/image";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"arena" | "standings" | "leaderboard">("arena");
  const [tournament, setTournament] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [creatingTournament, setCreatingTournament] = useState<boolean>(false);
  const [selectedExhibitionMatchId, setSelectedExhibitionMatchId] = useState<string | null>(null);
  const [isQuickBattleOpen, setIsQuickBattleOpen] = useState<boolean>(false);

  const fetchActiveTournament = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tournaments");
      const data = await res.json();

      if (data.tournaments && data.tournaments.length > 0) {
        const active = data.tournaments[0];
        setTournament(active);
        await fetchTournamentDetails(active.id);
      } else {
        // Automatically create the initial 151 tournament if none exists
        await handleCreateTournament();
      }
    } catch (err) {
      console.error("Failed to fetch active tournament:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTournamentDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/tournaments/${id}`);
      const data = await res.json();
      if (data.tournament) {
        setTournament(data.tournament);
        setStats(data.stats);
        setRecentMatches(data.recentMatches || []);
      }
    } catch (err) {
      console.error("Failed to fetch tournament details:", err);
    }
  };

  useEffect(() => {
    fetchActiveTournament();
  }, []);

  const handleCreateTournament = async () => {
    setCreatingTournament(true);
    try {
      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Kanto 151 Championship Season ${Math.floor(Math.random() * 900) + 100}`,
        }),
      });
      const data = await res.json();
      if (data.tournament) {
        setTournament(data.tournament);
        setSelectedExhibitionMatchId(null);
        await fetchTournamentDetails(data.tournament.id);
      }
    } catch (err) {
      console.error("Failed to create tournament:", err);
    } finally {
      setCreatingTournament(false);
    }
  };

  const handleBatchSimulate = async (count: number = 25) => {
    if (!tournament) return;
    try {
      await fetch(`/api/tournaments/${tournament.id}/simulate-batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count }),
      });
      await fetchTournamentDetails(tournament.id);
    } catch (err) {
      console.error("Failed to batch simulate:", err);
    }
  };

  const [randomizingMoves, setRandomizingMoves] = useState<boolean>(false);

  const handleRandomizeMoves = async () => {
    setRandomizingMoves(true);
    try {
      await fetch("/api/pokemon/randomize-moves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ randomizeAll: true }),
      });
      if (tournament) {
        await fetchTournamentDetails(tournament.id);
      }
    } catch (err) {
      console.error("Failed to randomize moves:", err);
    } finally {
      setRandomizingMoves(false);
    }
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* Tournament Overview & Control Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900/90 via-zinc-950 to-zinc-900/70 border border-zinc-800 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-bold tracking-wide uppercase">
                <Flame className="w-3.5 h-3.5 fill-current" />
                Active Tournament
              </span>
              <span className="text-xs font-mono text-zinc-400 bg-zinc-800/80 px-2.5 py-1 rounded-md border border-zinc-700/60">
                151 Double Round-Robin
              </span>
              {tournament?.status === "completed" && (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Completed
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {tournament?.name || "Kanto 151 Grand Championship"}
            </h1>

            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Every single one of the original 151 Pokémon faces every other Pokémon exactly twice.
              Autonomous AI decides each move using base stats, STAB, type effectiveness, and dynamic Elo ratings.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRandomizeMoves}
              disabled={randomizingMoves}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700/70 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold shadow-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              title="Pick 4 fresh random moves for all 151 Pokémon from their individual move pools"
            >
              <Shuffle className={`w-3.5 h-3.5 text-emerald-400 ${randomizingMoves ? "animate-spin" : ""}`} />
              {randomizingMoves ? "Randomizing..." : "Re-roll Moves"}
            </button>

            <button
              onClick={() => setIsQuickBattleOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700/70 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              <Swords className="w-4 h-4 text-red-400" />
              Custom Match
            </button>

            <button
              onClick={() => handleBatchSimulate(50)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-semibold transition-all hover:scale-105 active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              Simulate 50
            </button>

            <button
              onClick={handleCreateTournament}
              disabled={creatingTournament}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <PlusCircle className="w-4 h-4" />
              {creatingTournament ? "Generating 22,650..." : "New 151 Tournament"}
            </button>
          </div>
        </div>

        {/* Progress Bar & Counters */}
        {stats && (
          <div className="relative z-10 mt-6 pt-6 border-t border-zinc-800/80 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <div className="md:col-span-2 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-400 font-medium">Tournament Progress</span>
                <span className="text-zinc-200 font-bold">
                  {stats.finishedCount.toLocaleString()} / {stats.totalMatches.toLocaleString()} Matches ({stats.progressPercent}%)
                </span>
              </div>
              <div className="h-2.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/80 p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${Math.max(1, stats.progressPercent)}%` }}
                />
              </div>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-3 text-center">
              <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">
                Matches Finished
              </div>
              <div className="text-lg font-black font-mono text-emerald-400 mt-0.5">
                {stats.finishedCount.toLocaleString()}
              </div>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-3 text-center">
              <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">
                Matches Remaining
              </div>
              <div className="text-lg font-black font-mono text-zinc-300 mt-0.5">
                {stats.pendingCount.toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-center sm:justify-start gap-2 border-b border-zinc-800/80 pb-2">
        <button
          onClick={() => setActiveTab("arena")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            activeTab === "arena"
              ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
              : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
          }`}
        >
          <Swords className="w-4 h-4" />
          Live Battle Arena
        </button>

        <button
          onClick={() => setActiveTab("standings")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            activeTab === "standings"
              ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
              : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
          }`}
        >
          <Trophy className="w-4 h-4" />
          Tournament Standings (151)
        </button>

        <button
          onClick={() => setActiveTab("leaderboard")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            activeTab === "leaderboard"
              ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
              : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
          }`}
        >
          <Zap className="w-4 h-4 text-amber-400" />
          Global Elo Leaderboard
        </button>
      </div>

      {/* Tab 1: Live Battle Arena */}
      {activeTab === "arena" && (
        <div className="space-y-6">
          {tournament ? (
            <BattleArena
              tournamentId={tournament.id}
              initialMatchId={selectedExhibitionMatchId || undefined}
              onMatchComplete={() => fetchTournamentDetails(tournament.id)}
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-zinc-500">
              Loading Arena...
            </div>
          )}

          {/* Recent Concluded Matches Feed */}
          {recentMatches.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold tracking-wider text-zinc-400 uppercase">
                  Recent Concluded Matches
                </span>
                <span className="text-[11px] text-zinc-500">Live feed</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {recentMatches.map((m) => {
                  const winner = m.winner || m.pokemonA;
                  return (
                    <div
                      key={m.id}
                      className="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 flex items-center gap-3 backdrop-blur-md"
                    >
                      <div className="relative w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                        <Image
                          src={winner.spriteUrl}
                          alt={winner.name}
                          width={34}
                          height={34}
                          className="object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0 text-xs">
                        <div className="font-bold text-zinc-200 truncate">
                          {winner.name} won
                        </div>
                        <div className="text-[11px] text-zinc-500 truncate">
                          vs {m.winnerId === m.pokemonA.id ? m.pokemonB.name : m.pokemonA.name}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                        Elo +16
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Tournament Standings */}
      {activeTab === "standings" && (
        <div>
          {tournament ? (
            <StandingsTable tournamentId={tournament.id} />
          ) : (
            <div className="h-64 flex items-center justify-center text-zinc-500">
              Loading Standings...
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Global Elo Leaderboard */}
      {activeTab === "leaderboard" && (
        <div>
          <GlobalLeaderboard />
        </div>
      )}

      {/* Quick Exhibition Battle Modal */}
      <QuickBattleModal
        isOpen={isQuickBattleOpen}
        onClose={() => setIsQuickBattleOpen(false)}
        onBattleSelected={(matchId) => {
          setSelectedExhibitionMatchId(matchId);
          setActiveTab("arena");
        }}
      />
    </div>
  );
}
