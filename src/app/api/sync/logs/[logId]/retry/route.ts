// POST /api/sync/logs/[logId]/retry — 重试失败的同步
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";
import type { SyncLogInfo } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ logId: string }> },
) {
  try {
    const { logId } = await params;
    const oldLog = await db.syncLog.findUnique({ where: { id: logId } });
    if (!oldLog) return fail("日志不存在");
    if (oldLog.status !== "failed") return fail("只能重试失败的同步");

    // 模拟重试：90% 成功
    const success = Math.random() < 0.9;
    const now = new Date();
    const duration = Math.floor(Math.random() * 2000) + 100;

    const newLog = await db.syncLog.create({
      data: {
        storeId: oldLog.storeId,
        syncType: oldLog.syncType,
        status: success ? "success" : "failed",
        recordCount: oldLog.recordCount,
        durationMs: success ? duration : 0,
        errorMessage: success ? null : "重试仍失败：连接超时",
        startedAt: now,
        completedAt: success ? new Date(now.getTime() + duration) : null,
      },
      include: { store: { select: { storeName: true } } },
    });

    return ok<SyncLogInfo>({
      id: newLog.id,
      storeId: newLog.storeId,
      syncType: newLog.syncType,
      status: newLog.status as "success" | "failed" | "pending",
      recordCount: newLog.recordCount,
      durationMs: newLog.durationMs,
      errorMessage: newLog.errorMessage,
      startedAt: newLog.startedAt.toISOString(),
      completedAt: newLog.completedAt?.toISOString() ?? null,
      store: newLog.store ? { storeName: newLog.store.storeName } : undefined,
    });
  } catch (e) {
    return fail(parseError(e));
  }
}
