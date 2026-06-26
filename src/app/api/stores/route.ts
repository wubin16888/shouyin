// GET /api/stores — 门店列表（含冲突数、限流）
import { db } from "@/lib/db";
import { ok } from "@/lib/api-helpers";
import type { StoreInfo } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stores = await db.store.findMany({
      orderBy: { storeId: "asc" },
    });
    const result: StoreInfo[] = await Promise.all(
      stores.map(async (s) => {
        const pc = await db.syncConflict.count({
          where: { storeId: s.storeId, resolveStatus: "pending" },
        });
        const lastSync = await db.syncLog.findFirst({
          where: { storeId: s.storeId },
          orderBy: { startedAt: "desc" },
        });
        const rl = await db.storeRateLimit.findUnique({
          where: { storeId: s.storeId },
        });
        return {
          id: s.id,
          storeId: s.storeId,
          storeName: s.storeName,
          storeToken: s.storeToken,
          region: s.region,
          status: s.status,
          wsStatus: s.wsStatus as "online" | "offline",
          lastConnectedAt: s.lastConnectedAt?.toISOString() ?? null,
          createdAt: s.createdAt.toISOString(),
          pendingConflicts: pc,
          lastSyncAt: lastSync?.startedAt.toISOString() ?? null,
          rateLimit: rl
            ? {
                storeId: rl.storeId,
                readPerSec: rl.readPerSec,
                writePerSec: rl.writePerSec,
                syncPerSec: rl.syncPerSec,
                authPerSec: rl.authPerSec,
                burstAllowance: rl.burstAllowance,
                enabled: rl.enabled,
              }
            : null,
        };
      }),
    );
    return ok(result);
  } catch (e) {
    return ok<StoreInfo[]>([]);
  }
}
