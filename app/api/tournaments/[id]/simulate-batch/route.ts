import { NextRequest, NextResponse } from "next/server";
import { simulateBatch } from "@/lib/tournament/orchestrator";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const count = Math.min(200, Math.max(1, parseInt(body.count || "25", 10)));

    const result = await simulateBatch(id, count);

    return NextResponse.json({
      success: true,
      simulatedCount: result.simulatedCount,
      lastMatch: result.lastMatch,
    });
  } catch (error: any) {
    console.error("Error in batch simulation:", error);
    return NextResponse.json(
      { error: error.message || "Failed to batch simulate matches" },
      { status: 500 }
    );
  }
}
