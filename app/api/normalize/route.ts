import { NextRequest, NextResponse } from "next/server";
import { normalizeDataset, NormRule, PLAN_LIMITS } from "@/lib/normalizer";
import { v4 as uuid } from "uuid";

export const maxDuration = 60;

// Try to import prisma — may fail if DATABASE_URL not set
async function tryPersist(jobData: {
  userId: string;
  name: string;
  rowCount: number;
  dupCount: number;
  rules: string;
  results: Array<{
    rowIndex: number;
    original: Record<string, unknown>;
    normalized: Record<string, unknown>;
    changes: Array<{ field: string; from: string | null; to: string | null; rule: string }>;
    isDuplicate: boolean;
  }>;
}) {
  try {
    const { prisma } = await import("@/lib/prisma");
    const job = await prisma.normJob.create({
      data: {
        userId: jobData.userId,
        name: jobData.name,
        status: "done",
        inputFormat: "json",
        rowCount: jobData.rowCount,
        dupCount: jobData.dupCount,
        rules: jobData.rules,
      },
    });

    const toInsert = jobData.results.slice(0, 5000);
    if (toInsert.length > 0) {
      await prisma.normResult.createMany({
        data: toInsert.map((r) => ({
          jobId: job.id,
          rowIndex: r.rowIndex,
          original: JSON.stringify(r.original),
          normalized: JSON.stringify(r.normalized),
          changes: JSON.stringify(r.changes),
          isDuplicate: r.isDuplicate,
        })),
      });
    }

    return job.id;
  } catch {
    // DB not available (e.g., Vercel without Turso) — return ephemeral ID
    return uuid();
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, rules, userId, jobName } = body as {
      data: Record<string, unknown>[];
      rules: NormRule[];
      userId?: string;
      jobName?: string;
    };

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: "No data provided" }, { status: 400 });
    }

    // Check plan limits
    if (userId) {
      try {
        const { prisma } = await import("@/lib/prisma");
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user) {
          const limit = PLAN_LIMITS[user.plan] ?? PLAN_LIMITS.free;
          if (data.length > limit) {
            return NextResponse.json(
              { error: `Your plan allows up to ${limit} rows. Upgrade for more.` },
              { status: 402 }
            );
          }
        }
      } catch {
        // DB not available, skip plan check for demo
      }
    }

    // Run normalization (core engine — always works)
    const summary = normalizeDataset(data, rules);

    // Try to persist to DB
    const ephemeralUserId = userId ?? `demo-${uuid()}`;
    const jobId = await tryPersist({
      userId: ephemeralUserId,
      name: jobName ?? `Job ${new Date().toLocaleString()}`,
      rowCount: summary.totalRows,
      dupCount: summary.dupRows,
      rules: JSON.stringify(rules),
      results: summary.results,
    });

    return NextResponse.json({
      jobId,
      totalRows: summary.totalRows,
      dupRows: summary.dupRows,
      changesCount: summary.changesCount,
      fieldStats: summary.fieldStats,
      results: summary.results.map((r) => ({
        rowIndex: r.rowIndex,
        original: r.original,
        normalized: r.normalized,
        changes: r.changes,
        isDuplicate: r.isDuplicate,
      })),
    });
  } catch (err) {
    console.error("Normalize error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
