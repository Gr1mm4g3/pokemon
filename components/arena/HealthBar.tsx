import React from "react";
import { StatusEffect } from "@/lib/battle/types";

interface HealthBarProps {
  currentHp: number;
  maxHp: number;
  status?: StatusEffect;
  pokemonName: string;
}

export function HealthBar({
  currentHp,
  maxHp,
  status = "healthy",
  pokemonName,
}: HealthBarProps) {
  const safeMax = Math.max(1, maxHp);
  const ratio = Math.max(0, Math.min(1, currentHp / safeMax));
  const percentage = Math.round(ratio * 100);

  // Dynamic bar colors based on HP
  let barColor = "bg-gradient-to-r from-emerald-500 to-green-400";
  let glowColor = "shadow-emerald-500/30";
  if (ratio < 0.2) {
    barColor = "bg-gradient-to-r from-rose-600 to-red-500";
    glowColor = "shadow-rose-500/40";
  } else if (ratio < 0.5) {
    barColor = "bg-gradient-to-r from-amber-500 to-yellow-400";
    glowColor = "shadow-amber-500/30";
  }

  const statusBadges: Record<string, { label: string; bg: string; text: string }> = {
    sleep: { label: "SLP", bg: "bg-indigo-900/80 border-indigo-500/50", text: "text-indigo-200" },
    poison: { label: "PSN", bg: "bg-purple-900/80 border-purple-500/50", text: "text-purple-200" },
    paralysis: { label: "PAR", bg: "bg-yellow-900/80 border-yellow-500/50", text: "text-yellow-200" },
    burn: { label: "BRN", bg: "bg-red-900/80 border-red-500/50", text: "text-red-200" },
  };

  const statusInfo = statusBadges[status];

  return (
    <div className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm tracking-wide text-zinc-100">
            {pokemonName}
          </span>
          {statusInfo && (
            <span
              className={`text-[10px] font-black tracking-widest px-1.5 py-0.5 rounded border animate-pulse ${statusInfo.bg} ${statusInfo.text}`}
            >
              {statusInfo.label}
            </span>
          )}
        </div>
        <div className="text-xs font-mono text-zinc-400 font-semibold">
          <span
            className={
              ratio < 0.2
                ? "text-rose-400 font-bold"
                : ratio < 0.5
                ? "text-amber-400 font-bold"
                : "text-zinc-200"
            }
          >
            {Math.max(0, currentHp)}
          </span>
          <span className="text-zinc-500"> / {maxHp} HP</span>
        </div>
      </div>

      {/* Outer track */}
      <div className="relative h-3 w-full bg-zinc-950 rounded-full overflow-hidden p-0.5 border border-zinc-800/80">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out shadow-sm ${barColor} ${glowColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
