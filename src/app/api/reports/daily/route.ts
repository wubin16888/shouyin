// GET /api/reports/daily — 日报列表
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";
import type { ChainReportDailyInfo } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");

    const reports = await db.chainReportDaily.findMany({
      where: storeId ? { storeId: Number(storeId) } : undefined,
      include: { store: { select: { storeName: true } } },
      orderBy: { reportDate: "desc" },
      take: 200,
    });

    const result: ChainReportDailyInfo[] = reports.map((r) => ({
      reportDate: r.reportDate.toISOString(),
      storeId: r.storeId,
      totalOrders: r.totalOrders,
      totalRevenue: r.totalRevenue,
      avgOrderValue: r.avgOrderValue,
      totalRefunds: r.totalRefunds,
      totalDiscountAmount: r.totalDiscountAmount,
      memberCardPayments: r.memberCardPayments,
      memberCardAmount: r.memberCardAmount,
      store: r.store ? { storeName: r.store.storeName } : undefined,
    }));
    return ok(result);
  } catch (e) {
    return fail(parseError(e));
  }
}
