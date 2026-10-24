"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { TypeBadge } from "../ui/TypeBadge";
import {
  Trophy,
  Medal,
  Crown,
  Search,
  Sparkles,
  Swords,
  Shield,
  Zap,
  Heart,
  ChevronRight,
} from "lucide-react";

interface LeaderboardPokemon {
  rank: number;
  id: number;
  name: string;
  spriteUrl: string;
  types: string[];
  baseStats: {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  };
  moves: Array<{
    id: string;
    name: string;
    type: string;
    category: string;
    power: number;
  }>;
  eloRating: number;
}

export function GlobalLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardPokemon[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [selectedPokemon, setSelectedPokemon] = useState<LeaderboardPokemon | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/leaderboard");
      const data = await res.json();
      if (data.leaderboard) {
        setLeaderboard(data.leaderboard);
        if (data.leaderboard.length > 0) {
          setSelectedPokemon(data.leaderboard[0]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch global leaderboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = leaderboard.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];

  return (
    <div className="w-full space-y-8">
      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-8">
          {/* 2nd Place (Silver) */}
          <div
            onClick={() => setSelectedPokemon(top2)}
            className="cursor-pointer order-2 md:order-1 relative p-6 rounded-3xl bg-gradient-to-b from-zinc-800/80 to-zinc-950 border border-zinc-700/60 shadow-xl backdrop-blur-xl flex flex-col items-center text-center transition-all hover:scale-[1.02]"
          >
            <div className="absolute -top-5 flex items-center justify-center w-10 h-10 rounded-full bg-zinc-700 border-2 border-zinc-400 text-zinc-100 font-black text-sm shadow-md">
              2
            </div>
            <div className="relative w-28 h-28 my-3">
              <Image
                src={top2.spriteUrl}
                alt={top2.name}
                fill
                className="object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]"
              />
            </div>
            <h3 className="text-lg font-bold text-zinc-100">{top2.name}</h3>
            <div className="flex gap-1 my-2">
              {top2.types.map((t) => (
                <TypeBadge key={t} type={t} size="sm" />
              ))}
            </div>
            <div className="mt-2 text-sm font-mono font-bold text-zinc-300">
              Elo {top2.eloRating}
            </div>
          </div>

          {/* 1st Place (Gold Champion) */}
          <div
            onClick={() => setSelectedPokemon(top1)}
            className="cursor-pointer order-1 md:order-2 relative p-8 rounded-3xl bg-gradient-to-b from-amber-950/40 via-zinc-900/90 to-zinc-950 border-2 border-amber-500/50 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center transition-all hover:scale-[1.03] md:-translate-y-4"
          >
            <div className="absolute -top-7 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-2 border-amber-200 text-zinc-950 font-black text-lg shadow-[0_0_20px_rgba(245,158,11,0.5)]">
              <Crown className="w-7 h-7 text-zinc-950 fill-current" />
            </div>
            <div className="relative w-36 h-36 my-4">
              <Image
                src={top1.spriteUrl}
                alt={top1.name}
                fill
                className="object-contain drop-shadow-[0_12px_24px_rgba(245,158,11,0.3)] animate-float"
              />
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30 mb-1">
              Grand Champion
            </span>
            <h3 className="text-2xl font-black text-zinc-100">{top1.name}</h3>
            <div className="flex gap-1.5 my-2">
              {top1.types.map((t) => (
                <TypeBadge key={t} type={t} size="sm" />
              ))}
            </div>
            <div className="mt-2 text-base font-mono font-black text-amber-300 bg-zinc-900/90 px-4 py-1 rounded-full border border-zinc-800">
              Elo {top1.eloRating}
            </div>
          </div>

          {/* 3rd Place (Bronze) */}
          <div
            onClick={() => setSelectedPokemon(top3)}
            className="cursor-pointer order-3 relative p-6 rounded-3xl bg-gradient-to-b from-amber-950/20 to-zinc-950 border border-amber-800/40 shadow-xl backdrop-blur-xl flex flex-col items-center text-center transition-all hover:scale-[1.02]"
          >
            <div className="absolute -top-5 flex items-center justify-center w-10 h-10 rounded-full bg-amber-800 border-2 border-amber-600 text-amber-100 font-black text-sm shadow-md">
              3
            </div>
            <div className="relative w-28 h-28 my-3">
              <Image
                src={top3.spriteUrl}
                alt={top3.name}
                fill
                className="object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]"
              />
            </div>
            <h3 className="text-lg font-bold text-zinc-100">{top3.name}</h3>
            <div className="flex gap-1 my-2">
              {top3.types.map((t) => (
                <TypeBadge key={t} type={t} size="sm" />
              ))}
            </div>
            <div className="mt-2 text-sm font-mono font-bold text-amber-400">
              Elo {top3.eloRating}
            </div>
          </div>
        </div>
      )}

      {/* Main Leaderboard & Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Leaderboard Table */}
        <div className="lg:col-span-2 bg-zinc-950/80 border border-zinc-800 rounded-3xl p-6 backdrop-blur-xl shadow-2xl space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-zinc-100">
                All-Time Global Elo Ratings
              </h2>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search Pokémon..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50"
              />
            </div>
          </div>

          <div className="max-h-[520px] overflow-y-auto rounded-2xl border border-zinc-800/80">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-zinc-900 border-b border-zinc-800 text-zinc-400 uppercase font-mono tracking-wider z-10">
                <tr>
                  <th className="py-3 px-4 w-16">Rank</th>
                  <th className="py-3 px-4">Pokémon</th>
                  <th className="py-3 px-4">Types</th>
                  <th className="py-3 px-4 text-right font-mono">Elo Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-sans">
                {filtered.map((p) => {
                  const isSelected = selectedPokemon?.id === p.id;
                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedPokemon(p)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-red-600/10 border-l-4 border-l-red-500 text-zinc-100"
                          : "hover:bg-zinc-800/40 text-zinc-300"
                      }`}
                    >
                      <td className="py-2.5 px-4 font-mono font-bold">
                        #{p.rank}
                      </td>
                      <td className="py-2.5 px-4 font-semibold flex items-center gap-2.5">
                        <div className="relative w-7 h-7 rounded-md bg-zinc-800/70 p-0.5 border border-zinc-700/50 flex items-center justify-center">
                          <Image
                            src={p.spriteUrl}
                            alt={p.name}
                            width={28}
                            height={28}
                            className="object-contain"
                          />
                        </div>
                        {p.name}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex gap-1">
                          {p.types.map((t) => (
                            <TypeBadge key={t} type={t} size="sm" />
                          ))}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-amber-300">
                        {p.eloRating}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Selected Pokemon Inspection Card */}
        {selectedPokemon && (
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-3xl p-6 backdrop-blur-xl shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-zinc-400">
                  National Dex #{selectedPokemon.id}
                </span>
                <span className="text-xs font-mono font-black text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full">
                  Elo {selectedPokemon.eloRating}
                </span>
              </div>

              <div className="relative w-40 h-40 mx-auto my-4 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 to-blue-600/10 rounded-full blur-xl" />
                <Image
                  src={selectedPokemon.spriteUrl}
                  alt={selectedPokemon.name}
                  width={150}
                  height={150}
                  className="object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]"
                />
              </div>

              <h3 className="text-2xl font-bold text-center text-zinc-100">
                {selectedPokemon.name}
              </h3>
              <div className="flex justify-center gap-1.5 mt-2">
                {selectedPokemon.types.map((t) => (
                  <TypeBadge key={t} type={t} size="md" />
                ))}
              </div>

              {/* Base Stats Breakdown */}
              <div className="mt-6 space-y-2 text-xs">
                <div className="text-[11px] font-mono uppercase text-zinc-400 font-bold tracking-wider mb-2">
                  Base Stats (Lv. 50 Scaled)
                </div>

                {[
                  { label: "HP", val: selectedPokemon.baseStats.hp, icon: Heart, color: "bg-rose-500" },
                  { label: "Attack", val: selectedPokemon.baseStats.attack, icon: Swords, color: "bg-amber-500" },
                  { label: "Defense", val: selectedPokemon.baseStats.defense, icon: Shield, color: "bg-blue-500" },
                  { label: "Sp. Atk", val: selectedPokemon.baseStats.specialAttack, icon: Sparkles, color: "bg-purple-500" },
                  { label: "Sp. Def", val: selectedPokemon.baseStats.specialDefense, icon: Shield, color: "bg-emerald-500" },
                  { label: "Speed", val: selectedPokemon.baseStats.speed, icon: Zap, color: "bg-yellow-500" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-3">
                    <span className="w-16 text-zinc-400 flex items-center gap-1 font-medium">
                      <s.icon className="w-3 h-3 text-zinc-500" />
                      {s.label}
                    </span>
                    <span className="w-8 font-mono text-right text-zinc-200 font-bold">
                      {s.val}
                    </span>
                    <div className="flex-1 h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                      <div
                        className={`h-full rounded-full ${s.color}`}
                        style={{ width: `${Math.min(100, (s.val / 160) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Tournament Moveset */}
              <div className="mt-6">
                <div className="text-[11px] font-mono uppercase text-zinc-400 font-bold tracking-wider mb-2">
                  Active Tournament Moveset
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {selectedPokemon.moves.map((m) => (
                    <div
                      key={m.id}
                      className="p-2 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs"
                    >
                      <div className="font-semibold text-zinc-200">
                        {m.name}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-1">
                        <span className="uppercase text-zinc-500 font-mono">
                          {m.type}
                        </span>
                        {m.power > 0 ? (
                          <span className="font-mono text-zinc-300">
                            Pwr: {m.power}
                          </span>
                        ) : (
                          <span className="font-mono text-indigo-400">Status</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
