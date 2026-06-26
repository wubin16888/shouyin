// GET /api/pos/dishes — 菜品列表
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";
import type { DishInfo } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = Number(searchParams.get("storeId") ?? 1001);

    const dishes = await db.dish.findMany({
      where: { storeId },
      orderBy: [{ category: "asc" }, { price: "asc" }],
    });

    const result: DishInfo[] = dishes.map((d) => ({
      id: d.id,
      storeId: d.storeId,
      name: d.name,
      category: d.category,
      price: d.price,
      status: d.status,
      imageUrl: d.imageUrl,
    }));
    return ok(result);
  } catch (e) {
    return fail(parseError(e));
  }
}
