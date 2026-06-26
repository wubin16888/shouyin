// GET /api/reports?days=N — 连锁报表
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";
import type { ReportSummary } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const days = Math.min(Math.max(Number(searchParams.get("days") ?? 7), 1), 30);

    const from = new Date();
    from.setHours(0, 0, 0, 0);
    from.setDate(from.getDate() - (days - 1));
    const to = new Date();

    const reports = await db.chainReportDaily.findMany({
      where: { reportDate: { gte: from } },
      include: { store: { select: { storeName: true, region: true } } },
      orderBy: { reportDate: "asc" },
    });

    const totalRevenue = reports.reduce((s, r) => s + r.totalRevenue, 0);
    const totalOrders = reports.reduce((s, r) => s + r.totalOrders, 0);
    const avgOrderValue = totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0;

    // 门店排行
    const storeMap = new Map<number, { storeName: string; totalRevenue: number; totalOrders: number }>();
    reports.forEach((r) => {
      const prev = storeMap.get(r.storeId) ?? { storeName: r.store?.storeName ?? "未知", totalRevenue: 0, totalOrders: 0 };
      prev.totalRevenue += r.totalRevenue;
      prev.totalOrders += r.totalOrders;
      storeMap.set(r.storeId, prev);
    });
    const storeRanking = [...storeMap.entries()]
      .map(([storeId, v]) => ({
        storeId,
        storeName: v.storeName,
        totalRevenue: Math.round(v.totalRevenue * 100) / 100,
        totalOrders: v.totalOrders,
        avgOrderValue: v.totalOrders > 0 ? Math.round((v.totalRevenue / v.totalOrders) * 100) / 100 : 0,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    // 每日趋势
    const dailyMap = new Map<string, { revenue: number; orders: number }>();
    reports.forEach((r) => {
      const key = `${r.reportDate.getMonth() + 1}/${r.reportDate.getDate()}`;
      const prev = dailyMap.get(key) ?? { revenue: 0, orders: 0 };
      prev.revenue += r.totalRevenue;
      prev.orders += r.totalOrders;
      dailyMap.set(key, prev);
    });
    const dailyTrend = [...dailyMap.entries()].map(([date, v]) => ({
      date,
      revenue: Math.round(v.revenue * 100) / 100,
      orders: v.orders,
    }));

    // 区域汇总
    const regionMap = new Map<string, { totalRevenue: number; totalOrders: number }>();
    reports.forEach((r) => {
      const region = r.store?.region ?? "未知";
      const prev = regionMap.get(region) ?? { totalRevenue: 0, totalOrders: 0 };
      prev.totalRevenue += r.totalRevenue;
      prev.totalOrders += r.totalOrders;
      regionMap.set(region, prev);
    });
    const regionSummary = [...regionMap.entries()].map(([region, v]) => ({
      region,
      totalRevenue: Math.round(v.totalRevenue * 100) / 100,
      totalOrders: v.totalOrders,
    }));

    return ok<ReportSummary>({
      dateRange: { from: from.toISOString(), to: to.toISOString() },
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders,
      avgOrderValue,
      storeRanking,
      dailyTrend,
      regionSummary,
    });
  } catch (e) {
    return fail(parseError(e));
  }
}
