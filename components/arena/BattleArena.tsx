"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useBattleQueue } from "@/hooks/useBattleQueue";
import { HealthBar } from "./HealthBar";
import { TypeBadge } from "../ui/TypeBadge";
import {
  Play,
  FastForward,
  SkipForward,
  Trophy,
  Swords,
  Sparkles,
  Zap,
  RotateCcw,
  Volume2,
} from "lucide-react";

interface BattleArenaProps {
  tournamentId: string;
  initialMatchId?: string;
  onMatchComplete?: () => void;
}

export function BattleArena({
  tournamentId,
  initialMatchId,
  onMatchComplete,
}: BattleArenaProps) {
  const [matchId, setMatchId] = useState<string | null>(initialMatchId || null);
  const [speed, setSpeed] = useState<number>(1);
  const [autoPlay, setAutoPlay] = useState<boolean>(false);
  const [isSimulatingBatch, setIsSimulatingBatch] = useState<boolean>(false);

  // SSE Stream URL
  const streamUrl = matchId
    ? `/api/battle-stream?matchId=${matchId}&delay=${Math.max(100, Math.floor(400 / speed))}`
    : `/api/battle-stream?tournamentId=${tournamentId}&delay=${Math.max(100, Math.floor(400 / speed))}`;

  const {
    matchOrder,
    fighterA,
    fighterB,
    hpA,
    hpB,
    statusA,
    statusB,
    activeAttacker,
    activeDefender,
    hitEffect,
    logs,
    currentMessage,
    isStreaming,
    isFinished,
    winnerId,
    deltaA,
    deltaB,
    newEloA,
    newEloB,
    skipToEnd,
  } = useBattleQueue(streamUrl, speed);

  // When match finishes and auto-play is on, queue next match after 2 seconds
  useEffect(() => {
    if (isFinished && autoPlay) {
      const timer = setTimeout(() => {
        handleLoadNextMatch();
      }, 2000);
      return () => clearTimeout(timer);
    }
    if (isFinished && onMatchComplete) {
      onMatchComplete();
    }
  }, [isFinished, autoPlay, onMatchComplete]);

  const handleLoadNextMatch = async () => {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}`);
      const data = await res.json();
      if (data.nextMatch) {
        setMatchId(data.nextMatch.id);
      } else {
        setMatchId(null);
      }
      if (onMatchComplete) onMatchComplete();
    } catch (err) {
      console.error("Failed to load next match:", err);
    }
  };

  const handleSimulateBatch = async (count: number) => {
    setIsSimulatingBatch(true);
    try {
      await fetch(`/api/tournaments/${tournamentId}/simulate-batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count }),
      });
      if (onMatchComplete) onMatchComplete();
      handleLoadNextMatch();
    } catch (err) {
      console.error("Failed to batch simulate:", err);
    } finally {
      setIsSimulatingBatch(false);
    }
  };

  // Animation classes for fighters
  let classFighterA = "transition-all duration-300";
  let classFighterB = "transition-all duration-300";

  if (activeAttacker === "A") classFighterA += " animate-lunge-left z-20";
  if (activeAttacker === "B") classFighterB += " animate-lunge-right z-20";

  if (activeDefender === "A") {
    classFighterA += " animate-shake";
    if (hitEffect === "damage") classFighterA += " animate-damage-flash";
    if (hitEffect === "heal") classFighterA += " animate-heal-flash";
    if (hitEffect === "poison") classFighterA += " animate-poison-glow";
  }

  if (activeDefender === "B") {
    classFighterB += " animate-shake";
    if (hitEffect === "damage") classFighterB += " animate-damage-flash";
    if (hitEffect === "heal") classFighterB += " animate-heal-flash";
    if (hitEffect === "poison") classFighterB += " animate-poison-glow";
  }

  if (isFinished) {
    if (winnerId === fighterA?.id) {
      classFighterB += " animate-faint";
    } else if (winnerId === fighterB?.id) {
      classFighterA += " animate-faint";
    }
  } else {
    classFighterA += " animate-float";
    classFighterB += " animate-float";
  }

  const isWinnerA = isFinished && winnerId === fighterA?.id;
  const isWinnerB = isFinished && winnerId === fighterB?.id;

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-950/80 backdrop-blur-xl shadow-2xl">
      {/* Top Arena Header & Stream Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-600/10 border border-red-500/30 text-red-400 font-semibold text-xs tracking-wider">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            LIVE ARENA
          </div>
          {matchOrder && (
            <span className="text-xs font-mono text-zinc-400 bg-zinc-800/70 px-2.5 py-1 rounded-md border border-zinc-700/50">
              Match #{matchOrder.toLocaleString()} of 22,650
            </span>
          )}
        </div>

        {/* Speed & Playback controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-xs">
            <span className="text-zinc-500 px-2 font-medium">Speed:</span>
            {[1, 2, 4].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  speed === s
                    ? "bg-red-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          <button
            onClick={skipToEnd}
            disabled={isFinished || !isStreaming}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 disabled:opacity-40 disabled:pointer-events-none transition-colors border border-zinc-700/60"
            title="Fast forward current match to result"
          >
            <FastForward className="w-3.5 h-3.5" />
            Skip
          </button>

          <button
            onClick={() => setAutoPlay(!autoPlay)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              autoPlay
                ? "bg-emerald-600/20 border-emerald-500/40 text-emerald-400"
                : "bg-zinc-800/80 border-zinc-700/60 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Play className={`w-3.5 h-3.5 ${autoPlay ? "fill-current" : ""}`} />
            Auto-Play Next
          </button>
        </div>
      </div>

      {/* Main Battle Arena Stage */}
      <div className="relative min-h-[380px] p-6 sm:p-10 flex flex-col justify-between bg-radial from-zinc-900/60 via-zinc-950 to-zinc-950 overflow-hidden">
        {/* Stadium battlefield background grid & lights */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Center Clash Badge */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-10">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-zinc-900/90 border border-zinc-700 shadow-xl backdrop-blur-md">
            <Swords className="w-6 h-6 text-red-500 animate-pulse" />
          </div>
          <span className="text-[10px] font-black tracking-widest text-zinc-500 mt-1 uppercase">
            Double Round-Robin
          </span>
        </div>

        {/* Fighters Stage */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Fighter A (Left) */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            {fighterA ? (
              <div className="w-full max-w-sm space-y-3">
                <HealthBar
                  currentHp={hpA}
                  maxHp={fighterA.maxHp}
                  status={statusA}
                  pokemonName={fighterA.name}
                />

                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  {fighterA.types.map((t) => (
                    <TypeBadge key={t} type={t} size="sm" />
                  ))}
                  <span className="text-xs font-mono font-semibold text-zinc-400 bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-800">
                    Elo: {Math.round(fighterA.eloRating)}
                    {isFinished && deltaA !== null && (
                      <span
                        className={`ml-1 font-bold ${
                          deltaA >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {deltaA >= 0 ? `+${deltaA}` : deltaA}
                      </span>
                    )}
                  </span>
                </div>

                {/* Platform & Sprite */}
                <div className="relative flex items-center justify-center h-48 sm:h-56">
                  {/* Glowing Stadium Pedestal */}
                  <div className="absolute bottom-4 w-44 h-12 rounded-full bg-gradient-to-r from-red-600/20 via-orange-500/20 to-red-600/20 blur-md border border-red-500/30 shadow-[0_0_24px_rgba(239,68,68,0.2)]" />

                  {/* Pokemon Artwork */}
                  <div className={`relative ${classFighterA}`}>
                    <Image
                      src={fighterA.spriteUrl}
                      alt={fighterA.name}
                      width={180}
                      height={180}
                      priority
                      className="drop-shadow-[0_12px_16px_rgba(0,0,0,0.8)] filter object-contain"
                    />
                    {isWinnerA && (
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-amber-500/20 border border-amber-400/50 text-amber-300 font-extrabold text-xs px-3 py-1 rounded-full backdrop-blur-md shadow-lg animate-bounce">
                        <Trophy className="w-3.5 h-3.5 text-amber-400" />
                        VICTOR
                      </div>
                    )}
                  </div>
                </div>

                {/* Move repertoire */}
                <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                  {fighterA.moves.map((m) => (
                    <span
                      key={m.id}
                      className="text-[10px] font-medium bg-zinc-900/90 text-zinc-300 px-2 py-0.5 rounded border border-zinc-800"
                    >
                      {m.name}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-56 flex items-center justify-center text-zinc-500 text-sm">
                Loading Pokémon A...
              </div>
            )}
          </div>

          {/* Fighter B (Right) */}
          <div className="flex flex-col items-center sm:items-end text-center sm:text-right">
            {fighterB ? (
              <div className="w-full max-w-sm space-y-3">
                <HealthBar
                  currentHp={hpB}
                  maxHp={fighterB.maxHp}
                  status={statusB}
                  pokemonName={fighterB.name}
                />

                <div className="flex items-center gap-2 justify-center sm:justify-end">
                  <span className="text-xs font-mono font-semibold text-zinc-400 bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-800">
                    Elo: {Math.round(fighterB.eloRating)}
                    {isFinished && deltaB !== null && (
                      <span
                        className={`ml-1 font-bold ${
                          deltaB >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {deltaB >= 0 ? `+${deltaB}` : deltaB}
                      </span>
                    )}
                  </span>
                  {fighterB.types.map((t) => (
                    <TypeBadge key={t} type={t} size="sm" />
                  ))}
                </div>

                {/* Platform & Sprite */}
                <div className="relative flex items-center justify-center h-48 sm:h-56">
                  {/* Glowing Stadium Pedestal */}
                  <div className="absolute bottom-4 w-44 h-12 rounded-full bg-gradient-to-r from-blue-600/20 via-cyan-500/20 to-blue-600/20 blur-md border border-blue-500/30 shadow-[0_0_24px_rgba(59,130,246,0.2)]" />

                  {/* Pokemon Artwork (flipped horizontally for standard face-off) */}
                  <div className={`relative ${classFighterB}`}>
                    <Image
                      src={fighterB.spriteUrl}
                      alt={fighterB.name}
                      width={180}
                      height={180}
                      priority
                      className="drop-shadow-[0_12px_16px_rgba(0,0,0,0.8)] filter object-contain -scale-x-100"
                    />
                    {isWinnerB && (
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-amber-500/20 border border-amber-400/50 text-amber-300 font-extrabold text-xs px-3 py-1 rounded-full backdrop-blur-md shadow-lg animate-bounce">
                        <Trophy className="w-3.5 h-3.5 text-amber-400" />
                        VICTOR
                      </div>
                    )}
                  </div>
                </div>

                {/* Move repertoire */}
                <div className="flex flex-wrap gap-1.5 justify-center sm:justify-end">
                  {fighterB.moves.map((m) => (
                    <span
                      key={m.id}
                      className="text-[10px] font-medium bg-zinc-900/90 text-zinc-300 px-2 py-0.5 rounded border border-zinc-800"
                    >
                      {m.name}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-56 flex items-center justify-center text-zinc-500 text-sm">
                Loading Pokémon B...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Broadcast Text Box (Section 5.2 in SDD) */}
      <div className="relative p-5 bg-gradient-to-b from-zinc-900/90 to-zinc-950 border-t border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-zinc-800/80 border border-zinc-700/60 text-zinc-300">
            <Volume2 className="w-4 h-4 text-red-400" />
          </div>
          <div className="flex-1">
            <p className="font-mono text-sm sm:text-base font-semibold text-zinc-100 tracking-wide">
              {currentMessage}
            </p>
          </div>

          {/* Next Match / Simulate Buttons */}
          <div className="flex items-center gap-2">
            {isFinished ? (
              <button
                onClick={handleLoadNextMatch}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 transition-all hover:scale-105 active:scale-95"
              >
                <SkipForward className="w-4 h-4" />
                Next Match
              </button>
            ) : (
              <button
                onClick={skipToEnd}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
              >
                Fast Finish
              </button>
            )}
          </div>
        </div>

        {/* Quick Batch Simulation Drawer */}
        <div className="mt-4 pt-3 border-t border-zinc-800/60 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Fast-forward tournament:</span>
            <button
              onClick={() => handleSimulateBatch(10)}
              disabled={isSimulatingBatch}
              className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors border border-zinc-700/60 disabled:opacity-50"
            >
              +10 Matches
            </button>
            <button
              onClick={() => handleSimulateBatch(50)}
              disabled={isSimulatingBatch}
              className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors border border-zinc-700/60 disabled:opacity-50"
            >
              +50 Matches
            </button>
            <button
              onClick={() => handleSimulateBatch(100)}
              disabled={isSimulatingBatch}
              className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors border border-zinc-700/60 disabled:opacity-50"
            >
              +100 Matches
            </button>
          </div>

          <span className="font-mono text-[11px] text-zinc-500">
            {logs.length} turns recorded
          </span>
        </div>
      </div>
    </div>
  );
}
