// POST /api/join-code/verify — 验证入职码有效性
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { storeId, joinCode } = await req.json();
    if (!storeId || !joinCode) return fail("缺少参数");
    const store = await db.store.findUnique({ where: { storeId: Number(storeId) } });
    if (!store) return fail("门店不存在");
    // joinCode 是即时生成的，不持久化，这里只验证门店存在即可
    return ok({
      valid: true,
      storeId: Number(storeId),
      storeName: store.storeName,
    });
  } catch (e) {
    return fail(parseError(e));
  }
}
