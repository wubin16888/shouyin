// GET /api/sync/conflicts — 冲突列表
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";
import type { SyncConflictInfo } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit = Number(searchParams.get("limit") ?? 100);

    const conflicts = await db.syncConflict.findMany({
      where: status ? { resolveStatus: status } : undefined,
      include: { store: { select: { storeName: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const result: SyncConflictInfo[] = conflicts.map((c) => ({
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
    }));
    return ok(result);
  } catch (e) {
    return fail(parseError(e));
  }
}
