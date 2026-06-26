// GET /api/sync/overview — 同步概览
import { db } from "@/lib/db";
import { ok } from "@/lib/api-helpers";
import type { SyncOverview } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [total, success, failed, pendingConf, resolvedConf] = await Promise.all([
      db.syncLog.count(),
      db.syncLog.count({ where: { status: "success" } }),
      db.syncLog.count({ where: { status: "failed" } }),
      db.syncConflict.count({ where: { resolveStatus: "pending" } }),
      db.syncConflict.count({ where: { resolveStatus: "resolved" } }),
    ]);

    const successRate = total > 0 ? Math.round((success / total) * 10000) / 100 : 0;

    const successLogs = await db.syncLog.findMany({
      where: { status: "success", durationMs: { gt: 0 } },
      select: { durationMs: true },
    });
    const avgDurationMs =
      successLogs.length > 0
        ? Math.round(successLogs.reduce((s, l) => s + l.durationMs, 0) / successLogs.length)
        : 0;

    const recentLogs = await db.syncLog.findMany({
      include: { store: { select: { storeName: true } } },
      orderBy: { startedAt: "desc" },
      take: 20,
    });

    const recentConflicts = await db.syncConflict.findMany({
      include: { store: { select: { storeName: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const allTypes = await db.syncLog.groupBy({
      by: ["syncType"],
      _count: true,
    });

    return ok<SyncOverview>({
      totalSyncs: total,
      successCount: success,
      failedCount: failed,
      successRate,
      avgDurationMs,
      pendingConflicts: pendingConf,
      resolvedConflicts: resolvedConf,
      recentLogs: recentLogs.map((l) => ({
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
      })),
      recentConflicts: recentConflicts.map((c) => ({
        id: c.id,
        storeId: c.storeId,
        orderId: c.orderId,
        localVersion: c.localVersion,
        cloudVersion: c.cloudVersion,
        localData: c.localData,
        cloudData: c.cloudData,
        conflictReason: c.conflictReason,
        resolveStatus: c.resolveStatus as "pending" | "resolved",
        resolveMethod: c.resolveMethod,
        retryCount: c.retryCount,
        createdAt: c.createdAt.toISOString(),
        resolvedAt: c.resolvedAt?.toISOString() ?? null,
        store: c.store ? { storeName: c.store.storeName } : undefined,
      })),
      typeDistribution: allTypes.map((t) => ({ syncType: t.syncType, count: t._count })),
    });
  } catch (e) {
    return ok<SyncOverview>({
      totalSyncs: 0, successCount: 0, failedCount: 0, successRate: 0,
      avgDurationMs: 0, pendingConflicts: 0, resolvedConflicts: 0,
      recentLogs: [], recentConflicts: [], typeDistribution: [],
    });
  }
}
