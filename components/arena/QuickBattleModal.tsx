"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Swords, X, Sparkles, Shuffle } from "lucide-react";
import { TypeBadge } from "../ui/TypeBadge";

interface QuickBattleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBattleSelected: (matchId: string) => void;
}

export function QuickBattleModal({
  isOpen,
  onClose,
  onBattleSelected,
}: QuickBattleModalProps) {
  const [pokemonList, setPokemonList] = useState<any[]>([]);
  const [pAId, setPAId] = useState<number>(25); // Pikachu default
  const [pBId, setPBId] = useState<number>(6); // Charizard default
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && pokemonList.length === 0) {
      fetch("/api/pokemon")
        .then((res) => res.json())
        .then((data) => {
          if (data.pokemon) setPokemonList(data.pokemon);
        })
        .catch(console.error);
    }
  }, [isOpen, pokemonList.length]);

  if (!isOpen) return null;

  const handleRandomize = () => {
    const id1 = Math.floor(Math.random() * 151) + 1;
    let id2 = Math.floor(Math.random() * 151) + 1;
    while (id2 === id1) id2 = Math.floor(Math.random() * 151) + 1;
    setPAId(id1);
    setPBId(id2);
  };

  const handleStartBattle = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/quick-battle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pokemonAId: pAId, pokemonBId: pBId }),
      });
      const data = await res.json();
      if (data.matchId) {
        onBattleSelected(data.matchId);
        onClose();
      }
    } catch (err) {
      console.error("Failed to start quick battle:", err);
    } finally {
      setLoading(false);
    }
  };

  const pA = pokemonList.find((p) => p.id === pAId);
  const pB = pokemonList.find((p) => p.id === pBId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-bold text-zinc-100">
              Custom Exhibition Match
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Pair Preview */}
        <div className="grid grid-cols-2 gap-4 items-center">
          {/* Pokemon A */}
          <div className="flex flex-col items-center p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
            {pA ? (
              <>
                <div className="relative w-24 h-24 mb-2">
                  <Image
                    src={pA.spriteUrl}
                    alt={pA.name}
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="font-bold text-zinc-100">{pA.name}</div>
                <div className="flex gap-1 my-1">
                  {pA.types.map((t: string) => (
                    <TypeBadge key={t} type={t} size="sm" />
                  ))}
                </div>
                <div className="text-xs font-mono text-zinc-400">
                  Elo {pA.eloRating}
                </div>
              </>
            ) : (
              <div className="h-28 flex items-center text-xs text-zinc-500">
                Loading...
              </div>
            )}
            <select
              value={pAId}
              onChange={(e) => setPAId(parseInt(e.target.value, 10))}
              className="mt-3 w-full bg-zinc-800 text-xs text-zinc-200 border border-zinc-700 rounded-lg p-2 focus:outline-none"
            >
              {pokemonList.map((p) => (
                <option key={p.id} value={p.id}>
                  #{p.id} {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Pokemon B */}
          <div className="flex flex-col items-center p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
            {pB ? (
              <>
                <div className="relative w-24 h-24 mb-2">
                  <Image
                    src={pB.spriteUrl}
                    alt={pB.name}
                    fill
                    className="object-contain -scale-x-100"
                  />
                </div>
                <div className="font-bold text-zinc-100">{pB.name}</div>
                <div className="flex gap-1 my-1">
                  {pB.types.map((t: string) => (
                    <TypeBadge key={t} type={t} size="sm" />
                  ))}
                </div>
                <div className="text-xs font-mono text-zinc-400">
                  Elo {pB.eloRating}
                </div>
              </>
            ) : (
              <div className="h-28 flex items-center text-xs text-zinc-500">
                Loading...
              </div>
            )}
            <select
              value={pBId}
              onChange={(e) => setPBId(parseInt(e.target.value, 10))}
              className="mt-3 w-full bg-zinc-800 text-xs text-zinc-200 border border-zinc-700 rounded-lg p-2 focus:outline-none"
            >
              {pokemonList.map((p) => (
                <option key={p.id} value={p.id}>
                  #{p.id} {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleRandomize}
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <Shuffle className="w-3.5 h-3.5" />
            Randomize Pair
          </button>

          <button
            onClick={handleStartBattle}
            disabled={loading || pAId === pBId}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            <Swords className="w-4 h-4" />
            {loading ? "Initializing..." : "Launch Exhibition Match"}
          </button>
        </div>
      </div>
    </div>
  );
}
