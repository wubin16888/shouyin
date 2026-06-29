// GET/POST /api/sys/categories — 菜品大类
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";
import type { ProductCategoryInfo } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const cats = await db.productCategory.findMany({
      where: { storeId: Number(new URL(req.url).searchParams.get("storeId") ?? req.headers.get("X-Store-Id") ?? 1001) },
      include: {
        subcategories: { orderBy: { sortOrder: "asc" } },
        _count: { select: { products: true } },
      },
      orderBy: { sortOrder: "asc" },
    });
    return ok<ProductCategoryInfo[]>(
      cats.map((c) => ({
        id: c.id, storeId: c.storeId, name: c.name, sortOrder: c.sortOrder,
        subcategories: c.subcategories.map((s) => ({ id: s.id, name: s.name })),
        productCount: c._count.products,
      })),
    );
  } catch (e) {
    return fail(parseError(e));
  }
}

export async function POST(req: Request) {
    const storeId = Number(req.headers.get("X-Store-Id") ?? 1001);
  try {
    const { name } = await req.json();
    if (!name) return fail("缺少 name");
    const cat = await db.productCategory.create({
      data: { storeId, name, sortOrder: 0 },
    });
    return ok({ id: cat.id, name: cat.name });
  } catch (e) {
    return fail(parseError(e));
  }
}
