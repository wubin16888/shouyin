// GET /api/ktv/products — 商品列表
import { db } from "@/lib/db";
import { ok, parseError } from "@/lib/api-helpers";
import type { KtvProductInfo } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = Number(searchParams.get("storeId") ?? 1001);

    const products = await db.ktvProduct.findMany({
      where: { storeId },
      orderBy: [{ category: "asc" }, { price: "asc" }],
    });

    return ok<KtvProductInfo[]>(
      products.map((p) => ({
        id: p.id,
        storeId: p.storeId,
        name: p.name,
        category: p.category,
        price: p.price,
        cost: p.cost,
        stock: p.stock,
        barcode: p.barcode,
        status: p.status,
      })),
    );
  } catch (e) {
    return fail(parseError(e));
  }
}
