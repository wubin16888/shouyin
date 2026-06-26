// GET /api/audit — 审计日志（带聚合）
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";
import type { AuditSummary } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");
    const operationType = searchParams.get("operationType");
    const status = searchParams.get("status");
    const limit = Math.min(Number(searchParams.get("limit") ?? 100), 500);

    const where = {
      ...(storeId ? { storeId: Number(storeId) } : {}),
      ...(operationType ? { operationType } : {}),
      ...(status ? { status } : {}),
    };

    const [logs, total, successCount, failedCount, opDist] = await Promise.all([
      db.auditLog.findMany({
        where,
        include: { store: { select: { storeName: true } } },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      db.auditLog.count({ where }),
      db.auditLog.count({ where: { ...where, status: "success" } }),
      db.auditLog.count({ where: { ...where, status: "failed" } }),
      db.auditLog.groupBy({
        by: ["operationType"],
        where,
        _count: true,
      }),
    ]);

    return ok<AuditSummary>({
      total,
      successCount,
      failedCount,
      operationDistribution: opDist.map((o) => ({ operationType: o.operationType, count: o._count })),
      logs: logs.map((l) => ({
        id: l.id,
        storeId: l.storeId,
        userName: l.userName,
        operationType: l.operationType,
        resourceType: l.resourceType,
        resourceId: l.resourceId,
        changes: l.changes,
        status: l.status,
        ipAddress: l.ipAddress,
        createdAt: l.createdAt.toISOString(),
        store: l.store ? { storeName: l.store.storeName } : undefined,
      })),
    });
  } catch (e) {
    return fail(parseError(e));
  }
}
