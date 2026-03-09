import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { prisma } = await import("@/lib/prisma");
    const job = await prisma.normJob.findUnique({
      where: { id },
      include: {
        results: {
          orderBy: { rowIndex: "asc" },
          take: 1000,
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ job });
  } catch {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
}
