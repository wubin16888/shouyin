// POST /api/join-code/generate — 门店管理员生成入职二维码code
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { storeId } = await req.json();
    if (!storeId) return fail("缺少 storeId");
    const store = await db.store.findUnique({ where: { storeId: Number(storeId) } });
    if (!store) return fail("门店不存在");

    // 生成6位随机码
    const joinCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    return ok({
      joinCode,
      storeId: Number(storeId),
      storeName: store.storeName,
      // 入职链接（前端路由）
      joinUrl: `/?join=1&store=${storeId}&code=${joinCode}`,
    });
  } catch (e) {
    return fail(parseError(e));
  }
}
