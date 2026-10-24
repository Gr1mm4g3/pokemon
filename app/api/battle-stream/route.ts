import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { executeMatch, getNextPendingMatch } from "@/lib/tournament/orchestrator";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  let matchId = searchParams.get("matchId");
  const tournamentId = searchParams.get("tournamentId");
  const delayMs = Math.min(2000, Math.max(100, parseInt(searchParams.get("delay") || "400", 10)));

  // If matchId wasn't provided, get the next pending match for the tournament
  if (!matchId && tournamentId) {
    const nextMatch = await getNextPendingMatch(tournamentId);
    if (!nextMatch) {
      return new Response(JSON.stringify({ error: "No pending matches remaining" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    matchId = nextMatch.id;
  }

  if (!matchId) {
    return new Response(JSON.stringify({ error: "Missing matchId or tournamentId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Check if match already has battleLog or needs execution
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      pokemonA: true,
      pokemonB: true,
    },
  });

  if (!match) {
    return new Response(JSON.stringify({ error: "Match not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  let executionResult;
  if (match.status === "finished" && match.battleLog) {
    // Replay finished match
    const logs = JSON.parse(match.battleLog);
    executionResult = {
      matchId: match.id,
      battleState: {
        logs,
        winnerId: match.winnerId,
        loserId: match.winnerId === match.pokemonAId ? match.pokemonBId : match.pokemonAId,
      },
      winnerId: match.winnerId!,
      loserId: match.winnerId === match.pokemonAId ? match.pokemonBId : match.pokemonAId,
      newEloA: match.pokemonA.eloRating,
      newEloB: match.pokemonB.eloRating,
      deltaA: 0,
      deltaB: 0,
    };
  } else {
    // Execute live and persist
    executionResult = await executeMatch(match.id);
  }

  const { pokemonA, pokemonB } = match;
  const pAData = {
    id: pokemonA.id,
    name: pokemonA.name,
    spriteUrl: pokemonA.spriteUrl,
    types: JSON.parse(pokemonA.types),
    stats: JSON.parse(pokemonA.baseStats),
    moves: JSON.parse(pokemonA.moves),
    eloRating: pokemonA.eloRating,
  };
  const pBData = {
    id: pokemonB.id,
    name: pokemonB.name,
    spriteUrl: pokemonB.spriteUrl,
    types: JSON.parse(pokemonB.types),
    stats: JSON.parse(pokemonB.baseStats),
    moves: JSON.parse(pokemonB.moves),
    eloRating: pokemonB.eloRating,
  };

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: any) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      try {
        // 1. Initial event with match and fighter information
        sendEvent("init", {
          matchId: match.id,
          matchOrder: match.matchOrder,
          tournamentId: match.tournamentId,
          pokemonA: pAData,
          pokemonB: pBData,
        });

        // Small pause before opening move
        await new Promise((r) => setTimeout(r, delayMs));

        // 2. Stream turn-by-turn logs sequentially
        const logs = executionResult.battleState.logs;
        for (let i = 0; i < logs.length; i++) {
          const log = logs[i];
          sendEvent("turn", {
            index: i,
            totalTurns: logs.length,
            log,
          });

          if (i < logs.length - 1) {
            await new Promise((r) => setTimeout(r, delayMs));
          }
        }

        // 3. Match conclusion event with winner and Elo changes
        await new Promise((r) => setTimeout(r, delayMs));
        sendEvent("end", {
          matchId: match.id,
          winnerId: executionResult.winnerId,
          loserId: executionResult.loserId,
          newEloA: executionResult.newEloA,
          newEloB: executionResult.newEloB,
          deltaA: executionResult.deltaA,
          deltaB: executionResult.deltaB,
        });
      } catch (err) {
        console.error("SSE stream error:", err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
