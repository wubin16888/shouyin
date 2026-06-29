// GET/POST/PUT /api/ktv/shifts — 交接班
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  try {
    const storeId = Number(new URL(req.url).searchParams.get("storeId") ?? req.headers.get("X-Store-Id") ?? 1001);
    const shifts = await db.shift.findMany({ where: { storeId }, orderBy: { startAt: "desc" }, take: 50 });
    return ok(shifts.map(s => ({ id: s.id, employeeName: s.employeeName, startAt: s.startAt.toISOString(), endAt: s.endAt?.toISOString() ?? null, startCash: s.startCash, endCash: s.endCash, totalRevenue: s.totalRevenue, orderCount: s.orderCount, openCount: s.openCount, status: s.status, remark: s.remark })));
  } catch (e) { return fail(parseError(e)); }
}
export async function POST(req: Request) {
  try {
    const storeId = Number(req.headers.get("X-Store-Id") ?? 1001);
    const { employeeName, startCash } = await req.json();
    await db.shift.updateMany({ where: { storeId, status: "active" }, data: { status: "closed", endAt: new Date() } });
    const s = await db.shift.create({ data: { storeId, employeeName: employeeName || "收银员", startCash: Number(startCash) || 0, status: "active" } });
    return ok({ id: s.id, status: "active" });
  } catch (e) { return fail(parseError(e)); }
}
export async function PUT(req: Request) {
  try {
    const { shiftId, endCash, remark } = await req.json();
    if (!shiftId) return fail("缺少 shiftId");
    const shift = await db.shift.findUnique({ where: { id: shiftId } });
    if (!shift) return fail("班次不存在");
    if (shift.status !== "active") return fail("班次已关闭");
    const orders = await db.ktvOrder.findMany({ where: { storeId: shift.storeId, status: "paid", closedAt: { gte: shift.startAt } } });
    const rev: Record<string, number> = {}; let total = 0;
    orders.forEach(o => { const m = o.payMethod ?? "cash"; rev[m] = (rev[m] ?? 0) + o.totalAmount; total += o.totalAmount; });
    const openCount = await db.ktvOrder.count({ where: { storeId: shift.storeId, openedAt: { gte: shift.startAt } } });
    const updated = await db.shift.update({ where: { id: shiftId }, data: { status: "closed", endAt: new Date(), endCash: Number(endCash) || 0, revenueByMethod: JSON.stringify(rev), totalRevenue: Math.round(total * 100) / 100, orderCount: orders.length, openCount, remark: remark ?? shift.remark } });
    return ok({ id: updated.id, status: "closed", totalRevenue: updated.totalRevenue, orderCount: updated.orderCount, revenueByMethod: rev });
  } catch (e) { return fail(parseError(e)); }
}
