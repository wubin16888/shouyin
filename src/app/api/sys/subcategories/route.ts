// POST /api/sys/subcategories — 添加小类
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { categoryId, name } = await req.json();
    if (!categoryId || !name) return fail("缺少 categoryId 或 name");
    const sub = await db.productSubcategory.create({
      data: { storeId: 1001, categoryId, name, sortOrder: 0 },
    });
    return ok({ id: sub.id, name: sub.name });
  } catch (e) {
    return fail(parseError(e));
  }
}
