// GET/POST/DELETE /api/sys/units — 物品单位
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  try {
    const storeId = Number(new URL(req.url).searchParams.get("storeId") ?? req.headers.get("X-Store-Id") ?? 1001);
    const units = await db.productUnit.findMany({ where: { storeId }, orderBy: { sortOrder: "asc" } });
    return ok(units.map(u => ({ id: u.id, name: u.name })));
  } catch (e) { return fail(parseError(e)); }
}
export async function POST(req: Request) {
  try {
    const storeId = Number(req.headers.get("X-Store-Id") ?? 1001);
    const { name } = await req.json();
    if (!name) return fail("缺少 name");
    const u = await db.productUnit.create({ data: { storeId, name, sortOrder: 0 } });
    return ok({ id: u.id, name: u.name });
  } catch (e) { return fail(parseError(e)); }
}
export async function DELETE(req: Request) {
  try { const { id } = await req.json(); await db.productUnit.delete({ where: { id } }); return ok({ id }); }
  catch (e) { return fail(parseError(e)); }
}
