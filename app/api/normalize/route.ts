import { NextRequest, NextResponse } from "next/server";
import { normalizeDataset, NormRule, PLAN_LIMITS } from "@/lib/normalizer";
import { prisma } from "@/lib/prisma";
import { v4 as uuid } from "uuid";

export const maxDuration = 60;

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

    // Check plan limits if userId provided
    let user = null;
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        const limit = PLAN_LIMITS[user.plan] ?? PLAN_LIMITS.free;
        if (data.length > limit) {
          return NextResponse.json(
            { error: `Your plan allows up to ${limit} rows. Upgrade for more.` },
            { status: 402 }
          );
        }
      }
    }

    // Create demo user if none
    if (!user) {
      const demoEmail = `demo-${uuid()}@datanorm.app`;
      user = await prisma.user.create({
        data: { email: demoEmail, plan: "free" },
      });
    }

    // Run normalization
    const summary = normalizeDataset(data, rules);

    // Persist job
    const job = await prisma.normJob.create({
      data: {
        userId: user.id,
        name: jobName ?? `Job ${new Date().toLocaleString()}`,
        status: "done",
        inputFormat: "json",
        rowCount: summary.totalRows,
        dupCount: summary.dupRows,
        rules: JSON.stringify(rules),
      },
    });

    // Persist results (batch insert top 5000)
    const toInsert = summary.results.slice(0, 5000);
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

    return NextResponse.json({
      jobId: job.id,
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
