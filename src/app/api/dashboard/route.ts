// GET /api/dashboard — 总览仪表盘聚合数据
import { db } from "@/lib/db";
import { ok } from "@/lib/api-helpers";
import type { DashboardSummary } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stores = await db.store.findMany();
    const totalStores = stores.length;
    const onlineStores = stores.filter((s) => s.wsStatus === "online").length;
    const offlineStores = totalStores - onlineStores;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayOrders = await db.order.findMany({
      where: { createdAt: { gte: todayStart }, status: 2 },
    });
    const todayRevenue = todayOrders.reduce((s, o) => s + o.totalAmount, 0);

    const pendingConflicts = await db.syncConflict.count({
      where: { resolveStatus: "pending" },
    });
    const failedSyncsLast24h = await db.syncLog.count({
      where: {
        status: "failed",
        startedAt: { gte: new Date(Date.now() - 86400000) },
      },
    });
    const totalConfigs = await db.storeConfig.count();

    const trend: Array<{ date: string; revenue: number; orders: number }> = [];
    for (let d = 6; d >= 0; d--) {
      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);
      dayStart.setDate(dayStart.getDate() - d);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const dayOrders = await db.order.findMany({
        where: { createdAt: { gte: dayStart, lt: dayEnd }, status: 2 },
      });
      trend.push({
        date: `${dayStart.getMonth() + 1}/${dayStart.getDate()}`,
        revenue: Math.round(dayOrders.reduce((s, o) => s + o.totalAmount, 0) * 100) / 100,
        orders: dayOrders.length,
      });
    }

    const storeStatusList = await Promise.all(
      stores.map(async (s) => {
        const tOrders = todayOrders.filter((o) => o.storeId === s.storeId);
        const pc = await db.syncConflict.count({
          where: { storeId: s.storeId, resolveStatus: "pending" },
        });
        const lastSync = await db.syncLog.findFirst({
          where: { storeId: s.storeId },
          orderBy: { startedAt: "desc" },
        });
        return {
          storeId: s.storeId,
          storeName: s.storeName,
          region: s.region,
          wsStatus: s.wsStatus,
          lastConnectedAt: s.lastConnectedAt?.toISOString() ?? null,
          todayRevenue: Math.round(tOrders.reduce((sum, o) => sum + o.totalAmount, 0) * 100) / 100,
          todayOrders: tOrders.length,
          pendingConflicts: pc,
          lastSyncAt: lastSync?.startedAt.toISOString() ?? null,
        };
      }),
    );

    const regionMap = new Map<string, number>();
    stores.forEach((s) => {
      regionMap.set(s.region, (regionMap.get(s.region) ?? 0) + 1);
    });

    return ok<DashboardSummary>({
      totalStores,
      onlineStores,
      offlineStores,
      todayRevenue: Math.round(todayRevenue * 100) / 100,
      todayOrders: todayOrders.length,
      pendingConflicts,
      failedSyncsLast24h,
      totalConfigs,
      revenueTrend: trend,
      storeStatusList,
      regionDistribution: [...regionMap.entries()].map(([region, count]) => ({ region, count })),
    });
  } catch (e) {
    return ok<DashboardSummary>({
      totalStores: 0, onlineStores: 0, offlineStores: 0, todayRevenue: 0,
      todayOrders: 0, pendingConflicts: 0, failedSyncsLast24h: 0, totalConfigs: 0,
      revenueTrend: [], storeStatusList: [], regionDistribution: [],
    });
  }
}
