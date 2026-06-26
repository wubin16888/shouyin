// GET /api/sync/logs — 同步日志列表
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";
import type { SyncLogInfo } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");
    const status = searchParams.get("status");
    const limit = Number(searchParams.get("limit") ?? 100);

    const logs = await db.syncLog.findMany({
      where: {
        ...(storeId ? { storeId: Number(storeId) } : {}),
        ...(status ? { status } : {}),
      },
      include: { store: { select: { storeName: true } } },
      orderBy: { startedAt: "desc" },
      take: limit,
    });

    const result: SyncLogInfo[] = logs.map((l) => ({
      id: l.id,
      storeId: l.storeId,
      syncType: l.syncType,
      status: l.status as "success" | "failed" | "pending",
      recordCount: l.recordCount,
      durationMs: l.durationMs,
      errorMessage: l.errorMessage,
      startedAt: l.startedAt.toISOString(),
      completedAt: l.completedAt?.toISOString() ?? null,
      store: l.store ? { storeName: l.store.storeName } : undefined,
    }));
    return ok(result);
  } catch (e) {
    return fail(parseError(e));
  }
}
