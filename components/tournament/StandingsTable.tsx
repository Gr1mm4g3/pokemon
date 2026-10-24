"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { TournamentStandingsRow } from "@/lib/tournament/orchestrator";
import { TypeBadge } from "../ui/TypeBadge";
import {
  Search,
  ArrowUpDown,
  Trophy,
  RefreshCw,
  Flame,
  Award,
} from "lucide-react";

interface StandingsTableProps {
  tournamentId: string;
}

type SortField = "wins" | "winRate" | "eloRating" | "matchesPlayed" | "name";

export function StandingsTable({ tournamentId }: StandingsTableProps) {
  const [standings, setStandings] = useState<TournamentStandingsRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("wins");
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const fetchStandings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/tournaments/${tournamentId}/standings`);
      const data = await res.json();
      if (data.standings) {
        setStandings(data.standings);
      }
    } catch (err) {
      console.error("Failed to fetch tournament standings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStandings();
  }, [tournamentId]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const filteredAndSorted = useMemo(() => {
    return standings
      .filter((p) => {
        const matchesName = p.name.toLowerCase().includes(search.toLowerCase());
        const matchesType =
          selectedType === "all" ||
          p.types.some((t) => t.toLowerCase() === selectedType.toLowerCase());
        return matchesName && matchesType;
      })
      .sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];

        if (typeof valA === "string") {
          return sortAsc
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }

        return sortAsc ? valA - valB : valB - valA;
      });
  }, [standings, search, selectedType, sortField, sortAsc]);

  const uniqueTypes = [
    "all",
    "fire",
    "water",
    "grass",
    "electric",
    "psychic",
    "fighting",
    "poison",
    "ground",
    "flying",
    "dragon",
  ];

  return (
    <div className="w-full bg-zinc-950/80 border border-zinc-800 rounded-3xl p-6 backdrop-blur-xl shadow-2xl space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold tracking-tight text-zinc-100">
              Tournament Standings
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Tracking Win/Loss records across all 22,650 double round-robin matches
          </p>
        </div>

        <button
          onClick={fetchStandings}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-red-400" : ""}`} />
          Refresh Standings
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Filter Pokémon by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 transition-colors"
          />
        </div>

        {/* Type pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {uniqueTypes.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-3 py-1 rounded-lg capitalize font-medium transition-all ${
                selectedType === t
                  ? "bg-red-600 text-white shadow-sm"
                  : "bg-zinc-900/90 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-800/80 bg-zinc-900/40">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400 uppercase font-mono tracking-wider">
              <th className="py-3.5 px-4 w-16">Rank</th>
              <th
                onClick={() => handleSort("name")}
                className="py-3.5 px-4 cursor-pointer hover:text-zinc-200"
              >
                <div className="flex items-center gap-1.5">
                  Pokémon
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3.5 px-4">Types</th>
              <th
                onClick={() => handleSort("matchesPlayed")}
                className="py-3.5 px-4 cursor-pointer hover:text-zinc-200 text-center"
              >
                <div className="flex items-center justify-center gap-1.5">
                  Played
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort("wins")}
                className="py-3.5 px-4 cursor-pointer hover:text-zinc-200 text-center text-emerald-400 font-bold"
              >
                <div className="flex items-center justify-center gap-1.5">
                  Won (W)
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3.5 px-4 text-center text-rose-400">Lost (L)</th>
              <th
                onClick={() => handleSort("winRate")}
                className="py-3.5 px-4 cursor-pointer hover:text-zinc-200 text-center"
              >
                <div className="flex items-center justify-center gap-1.5">
                  Win %
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort("eloRating")}
                className="py-3.5 px-4 cursor-pointer hover:text-zinc-200 text-right font-mono"
              >
                <div className="flex items-center justify-end gap-1.5">
                  Global Elo
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 font-sans">
            {filteredAndSorted.length > 0 ? (
              filteredAndSorted.map((p, index) => {
                const rank = index + 1;
                return (
                  <tr
                    key={p.pokemonId}
                    className="hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-zinc-400">
                      {rank === 1 ? (
                        <span className="flex items-center gap-1 text-amber-400 font-black">
                          <Award className="w-4 h-4" /> 1
                        </span>
                      ) : rank === 2 ? (
                        <span className="text-zinc-300 font-bold">2</span>
                      ) : rank === 3 ? (
                        <span className="text-amber-600 font-bold">3</span>
                      ) : (
                        `#${rank}`
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-8 h-8 rounded-lg bg-zinc-800/80 p-0.5 border border-zinc-700/60 flex items-center justify-center overflow-hidden">
                          <Image
                            src={p.spriteUrl}
                            alt={p.name}
                            width={32}
                            height={32}
                            className="object-contain"
                          />
                        </div>
                        <span className="font-semibold text-zinc-100">
                          {p.name}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        {p.types.map((t) => (
                          <TypeBadge key={t} type={t} size="sm" />
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center font-mono text-zinc-400">
                      {p.matchesPlayed}
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400">
                      {p.wins}
                    </td>

                    <td className="py-3 px-4 text-center font-mono text-rose-400">
                      {p.losses}
                    </td>

                    <td className="py-3 px-4 text-center font-mono">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${p.winRate}%` }}
                          />
                        </div>
                        <span className="text-zinc-200 font-semibold">
                          {p.winRate}%
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-300">
                      {p.eloRating}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="py-8 text-center text-zinc-500">
                  {loading ? "Loading standings..." : "No Pokémon matched your search."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
