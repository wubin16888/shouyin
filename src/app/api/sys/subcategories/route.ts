// POST /api/sys/subcategories — 添加小类
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    const storeId = Number(req.headers.get("X-Store-Id") ?? 1001);
  try {
    const { categoryId, name } = await req.json();
    if (!categoryId || !name) return fail("缺少 categoryId 或 name");
    const sub = await db.productSubcategory.create({
      data: { storeId, categoryId, name, sortOrder: 0 },
    });
    return ok({ id: sub.id, name: sub.name });
  } catch (e) {
    return fail(parseError(e));
  }
}
