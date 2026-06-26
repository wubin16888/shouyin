// POST /api/sync/conflicts/[id]/resolve — 解决冲突
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";
import type { SyncConflictInfo } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { method } = await req.json();
    if (!["local_wins", "cloud_wins", "merge"].includes(method))
      return fail("method 非法");

    const conflict = await db.syncConflict.findUnique({ where: { id } });
    if (!conflict) return fail("冲突不存在");
    if (conflict.resolveStatus === "resolved") return fail("已解决");

    const updated = await db.syncConflict.update({
      where: { id },
      data: {
        resolveStatus: "resolved",
        resolveMethod: method,
        resolvedAt: new Date(),
      },
      include: { store: { select: { storeName: true } } },
    });

    await db.auditLog.create({
      data: {
        storeId: conflict.storeId,
        userName: "admin",
        operationType: "sync.resolve",
        resourceType: "conflict",
        resourceId: id,
        changes: JSON.stringify({ method, orderId: conflict.orderId }),
        status: "success",
      },
    });

    return ok<SyncConflictInfo>({
      id: updated.id,
      storeId: updated.storeId,
      orderId: updated.orderId,
      localVersion: updated.localVersion,
      cloudVersion: updated.cloudVersion,
      localData: updated.localData,
      cloudData: updated.cloudData,
      conflictReason: updated.conflictReason,
      resolveStatus: updated.resolveStatus as "pending" | "resolved",
      resolveMethod: updated.resolveMethod,
      retryCount: updated.retryCount,
      createdAt: updated.createdAt.toISOString(),
      resolvedAt: updated.resolvedAt?.toISOString() ?? null,
      store: updated.store ? { storeName: updated.store.storeName } : undefined,
    });
  } catch (e) {
    return fail(parseError(e));
  }
}
