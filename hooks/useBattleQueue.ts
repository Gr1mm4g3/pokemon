"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { PokemonType, StatusEffect, TurnActionLog } from "@/lib/battle/types";
import confetti from "canvas-confetti";

export interface FighterInfo {
  id: number;
  name: string;
  spriteUrl: string;
  types: PokemonType[];
  stats: {
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
    type: PokemonType;
    category: string;
    power: number;
  }>;
  eloRating: number;
  maxHp: number;
}

export interface BattleStateData {
  matchId: string | null;
  matchOrder: number | null;
  tournamentId: string | null;
  fighterA: FighterInfo | null;
  fighterB: FighterInfo | null;
  hpA: number;
  hpB: number;
  statusA: StatusEffect;
  statusB: StatusEffect;
  activeAttacker: "A" | "B" | null;
  activeDefender: "A" | "B" | null;
  hitEffect: "damage" | "heal" | "poison" | null;
  logs: TurnActionLog[];
  currentMessage: string;
  isStreaming: boolean;
  isFinished: boolean;
  winnerId: number | null;
  deltaA: number | null;
  deltaB: number | null;
  newEloA: number | null;
  newEloB: number | null;
}

export function useBattleQueue(
  endpointUrl: string | null,
  speed: number = 1 // 1x, 2x, 4x, 10x
) {
  const [state, setState] = useState<BattleStateData>({
    matchId: null,
    matchOrder: null,
    tournamentId: null,
    fighterA: null,
    fighterB: null,
    hpA: 100,
    hpB: 100,
    statusA: "healthy",
    statusB: "healthy",
    activeAttacker: null,
    activeDefender: null,
    hitEffect: null,
    logs: [],
    currentMessage: "Awaiting next match in the arena...",
    isStreaming: false,
    isFinished: false,
    winnerId: null,
    deltaA: null,
    deltaB: null,
    newEloA: null,
    newEloB: null,
  });

  const queueRef = useRef<any[]>([]);
  const isProcessingRef = useRef<boolean>(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const fighterARef = useRef<FighterInfo | null>(null);
  const fighterBRef = useRef<FighterInfo | null>(null);

  // Calculates level 50 HP if maxHp is not already computed
  const calculateHp = (baseHp: number) => Math.floor(((baseHp * 2 + 31) * 50) / 100) + 60;

  const processNextQueueItem = useCallback(async () => {
    if (queueRef.current.length === 0) {
      isProcessingRef.current = false;
      return;
    }

    isProcessingRef.current = true;
    const item = queueRef.current.shift();

    if (item.type === "turn") {
      const log: TurnActionLog = item.data.log;
      const isAttackerA = log.attackerId === fighterARef.current?.id;

      // 1. Attack lunge animation
      if (log.actionType === "move") {
        setState((prev) => ({
          ...prev,
          activeAttacker: isAttackerA ? "A" : "B",
          currentMessage: log.message,
        }));

        const attackDelay = Math.max(40, 250 / speed);
        await new Promise((r) => setTimeout(r, attackDelay));
      }

      // 2. Damage / Heal / Status impact animation
      const isDefenderA = log.defenderId === fighterARef.current?.id;
      let hitEffect: "damage" | "heal" | "poison" | null = null;
      if (log.damageDealt > 0) hitEffect = "damage";
      else if ((log.healingDone || 0) > 0) hitEffect = "heal";
      else if (log.statusApplied === "poison") hitEffect = "poison";

      setState((prev) => {
        let newStatusA = prev.statusA;
        let newStatusB = prev.statusB;

        if (log.statusApplied) {
          if (isDefenderA) newStatusA = log.statusApplied;
          else newStatusB = log.statusApplied;
        }

        return {
          ...prev,
          activeAttacker: null,
          activeDefender: isDefenderA ? "A" : "B",
          hitEffect,
          hpA: isAttackerA ? log.attackerHpRemaining : log.defenderHpRemaining,
          hpB: isAttackerA ? log.defenderHpRemaining : log.attackerHpRemaining,
          statusA: newStatusA,
          statusB: newStatusB,
          currentMessage: log.message,
          logs: [...prev.logs, log],
        };
      });

      const impactDelay = Math.max(50, 450 / speed);
      await new Promise((r) => setTimeout(r, impactDelay));

      // Reset hit effect
      setState((prev) => ({
        ...prev,
        activeDefender: null,
        hitEffect: null,
      }));
    } else if (item.type === "end") {
      const { winnerId, deltaA, deltaB, newEloA, newEloB } = item.data;
      const winnerName =
        winnerId === fighterARef.current?.id
          ? fighterARef.current?.name
          : fighterBRef.current?.name;

      setState((prev) => ({
        ...prev,
        isFinished: true,
        isStreaming: false,
        winnerId,
        deltaA,
        deltaB,
        newEloA,
        newEloB,
        currentMessage: `🏆 ${winnerName} won the match!`,
      }));

      // Fire celebratory confetti for the victor
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // no-op if confetti fails
      }
    }

    // Process next item
    const pauseDelay = Math.max(30, 150 / speed);
    await new Promise((r) => setTimeout(r, pauseDelay));
    processNextQueueItem();
  }, [speed]);

  const enqueue = useCallback(
    (item: any) => {
      queueRef.current.push(item);
      if (!isProcessingRef.current) {
        processNextQueueItem();
      }
    },
    [processNextQueueItem]
  );

  // Skip queue to end immediately
  const skipToEnd = useCallback(() => {
    while (queueRef.current.length > 0) {
      const item = queueRef.current.shift();
      if (item.type === "turn") {
        const log: TurnActionLog = item.data.log;
        const isAttackerA = log.attackerId === fighterARef.current?.id;
        setState((prev) => ({
          ...prev,
          hpA: isAttackerA ? log.attackerHpRemaining : log.defenderHpRemaining,
          hpB: isAttackerA ? log.defenderHpRemaining : log.attackerHpRemaining,
          logs: [...prev.logs, log],
          currentMessage: log.message,
        }));
      } else if (item.type === "end") {
        const { winnerId, deltaA, deltaB, newEloA, newEloB } = item.data;
        setState((prev) => ({
          ...prev,
          isFinished: true,
          isStreaming: false,
          winnerId,
          deltaA,
          deltaB,
          newEloA,
          newEloB,
        }));
      }
    }
    isProcessingRef.current = false;
  }, []);

  useEffect(() => {
    if (!endpointUrl) return;

    // Reset battle state
    queueRef.current = [];
    isProcessingRef.current = false;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setState((prev) => ({
      ...prev,
      isStreaming: true,
      isFinished: false,
      winnerId: null,
      deltaA: null,
      deltaB: null,
      logs: [],
      currentMessage: "Connecting to battle stream...",
    }));

    const es = new EventSource(endpointUrl);
    eventSourceRef.current = es;

    es.addEventListener("init", (e) => {
      try {
        const data = JSON.parse(e.data);
        const maxHpA = calculateHp(data.pokemonA.stats.hp);
        const maxHpB = calculateHp(data.pokemonB.stats.hp);

        const fA: FighterInfo = {
          ...data.pokemonA,
          maxHp: maxHpA,
        };
        const fB: FighterInfo = {
          ...data.pokemonB,
          maxHp: maxHpB,
        };

        fighterARef.current = fA;
        fighterBRef.current = fB;

        setState((prev) => ({
          ...prev,
          matchId: data.matchId,
          matchOrder: data.matchOrder,
          tournamentId: data.tournamentId,
          fighterA: fA,
          fighterB: fB,
          hpA: maxHpA,
          hpB: maxHpB,
          statusA: "healthy",
          statusB: "healthy",
          currentMessage: `⚔️ Battle commencing: ${fA.name} vs ${fB.name}!`,
        }));
      } catch (err) {
        console.error("Failed to parse init event:", err);
      }
    });

    es.addEventListener("turn", (e) => {
      try {
        const data = JSON.parse(e.data);
        enqueue({ type: "turn", data });
      } catch (err) {
        console.error("Failed to parse turn event:", err);
      }
    });

    es.addEventListener("end", (e) => {
      try {
        const data = JSON.parse(e.data);
        enqueue({ type: "end", data });
        es.close();
      } catch (err) {
        console.error("Failed to parse end event:", err);
      }
    });

    es.onerror = (err) => {
      console.warn("EventSource stream closed or encountered error", err);
      es.close();
      setState((prev) => ({
        ...prev,
        isStreaming: false,
      }));
    };

    return () => {
      es.close();
    };
  }, [endpointUrl, enqueue]);

  return {
    ...state,
    skipToEnd,
  };
}
