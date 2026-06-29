// GET/POST/PUT/DELETE /api/sys/billing-rules — 计时计费规则
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  try {
    const storeId = Number(new URL(req.url).searchParams.get("storeId") ?? req.headers.get("X-Store-Id") ?? 1001);
    const rules = await db.billingRule.findMany({ where: { storeId }, orderBy: { sortOrder: "asc" } });
    return ok(rules.map(r => ({ id: r.id, name: r.name, type: r.type, hourlyPrice: r.hourlyPrice, packageHours: r.packageHours, packagePrice: r.packagePrice, buyHours: r.buyHours, giftHours: r.giftHours, cumulative: r.cumulative, roomTypes: r.roomTypes, enabled: r.enabled })));
  } catch (e) { return fail(parseError(e)); }
}
export async function POST(req: Request) {
  try {
    const storeId = Number(req.headers.get("X-Store-Id") ?? 1001);
    const b = await req.json();
    const r = await db.billingRule.create({ data: { storeId, name: b.name, type: b.type ?? "hourly", hourlyPrice: Number(b.hourlyPrice ?? 0), packageHours: Number(b.packageHours ?? 0), packagePrice: Number(b.packagePrice ?? 0), buyHours: Number(b.buyHours ?? 0), giftHours: Number(b.giftHours ?? 0), cumulative: !!b.cumulative, roomTypes: b.roomTypes ?? null, enabled: b.enabled !== false, sortOrder: 0 } });
    return ok({ id: r.id });
  } catch (e) { return fail(parseError(e)); }
}
export async function PUT(req: Request) {
  try { const { id, ...data } = await req.json(); if (!id) return fail("缺少 id"); for (const k of ["hourlyPrice","packagePrice"]) if (data[k]!==undefined) data[k]=Number(data[k]); for (const k of ["packageHours","buyHours","giftHours"]) if (data[k]!==undefined) data[k]=Number(data[k]); if (data.cumulative!==undefined) data.cumulative=!!data.cumulative; await db.billingRule.update({ where: { id }, data }); return ok({ id }); }
  catch (e) { return fail(parseError(e)); }
}
export async function DELETE(req: Request) {
  try { const { id } = await req.json(); await db.billingRule.delete({ where: { id } }); return ok({ id }); }
  catch (e) { return fail(parseError(e)); }
}
