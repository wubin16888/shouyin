// GET /api/ktv/shifts/current — 当前班次+统计
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  try {
    const storeId = Number(new URL(req.url).searchParams.get("storeId") ?? req.headers.get("X-Store-Id") ?? 1001);
    const current = await db.shift.findFirst({ where: { storeId, status: "active" }, orderBy: { startAt: "desc" } });
    if (!current) return ok({ shift: null, stats: null });
    const orders = await db.ktvOrder.findMany({ where: { storeId, status: "paid", closedAt: { gte: current.startAt } } });
    const rev: Record<string, number> = {}; let total = 0;
    orders.forEach(o => { const m = o.payMethod ?? "cash"; rev[m] = (rev[m] ?? 0) + o.totalAmount; total += o.totalAmount; });
    const openCount = await db.ktvOrder.count({ where: { storeId, openedAt: { gte: current.startAt } } });
    return ok({ shift: { id: current.id, employeeName: current.employeeName, startAt: current.startAt.toISOString(), startCash: current.startCash }, stats: { totalRevenue: Math.round(total * 100) / 100, orderCount: orders.length, openCount, revenueByMethod: rev } });
  } catch (e) { return fail(parseError(e)); }
}
