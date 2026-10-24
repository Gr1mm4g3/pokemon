import React from "react";
import { PokemonType } from "@/lib/battle/types";

interface TypeBadgeProps {
  type: PokemonType | string;
  size?: "sm" | "md" | "lg";
}

const TYPE_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
  normal: { bg: "bg-zinc-600/20", text: "text-zinc-300", border: "border-zinc-500/40" },
  fire: { bg: "bg-amber-600/20", text: "text-amber-400", border: "border-amber-500/40" },
  water: { bg: "bg-blue-600/20", text: "text-blue-400", border: "border-blue-500/40" },
  electric: { bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-400/40" },
  grass: { bg: "bg-emerald-600/20", text: "text-emerald-400", border: "border-emerald-500/40" },
  ice: { bg: "bg-cyan-500/20", text: "text-cyan-300", border: "border-cyan-400/40" },
  fighting: { bg: "bg-red-700/20", text: "text-red-400", border: "border-red-600/40" },
  poison: { bg: "bg-purple-600/20", text: "text-purple-400", border: "border-purple-500/40" },
  ground: { bg: "bg-amber-700/20", text: "text-amber-300", border: "border-amber-600/40" },
  flying: { bg: "bg-indigo-500/20", text: "text-indigo-300", border: "border-indigo-400/40" },
  psychic: { bg: "bg-pink-600/20", text: "text-pink-400", border: "border-pink-500/40" },
  bug: { bg: "bg-lime-600/20", text: "text-lime-400", border: "border-lime-500/40" },
  rock: { bg: "bg-stone-600/20", text: "text-stone-300", border: "border-stone-500/40" },
  ghost: { bg: "bg-violet-700/20", text: "text-violet-400", border: "border-violet-600/40" },
  dragon: { bg: "bg-indigo-700/20", text: "text-indigo-400", border: "border-indigo-600/40" },
  steel: { bg: "bg-slate-500/20", text: "text-slate-300", border: "border-slate-400/40" },
  fairy: { bg: "bg-pink-400/20", text: "text-pink-300", border: "border-pink-300/40" },
};

export function TypeBadge({ type, size = "md" }: TypeBadgeProps) {
  const normalized = type.toLowerCase();
  const config = TYPE_CONFIG[normalized] || {
    bg: "bg-zinc-800",
    text: "text-zinc-300",
    border: "border-zinc-700",
  };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] tracking-wide",
    md: "px-2.5 py-1 text-xs tracking-wider",
    lg: "px-3.5 py-1.5 text-sm tracking-wider font-semibold",
  };

  return (
    <span
      className={`inline-flex items-center uppercase font-bold rounded-md border ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]}`}
    >
      {type}
    </span>
  );
}
