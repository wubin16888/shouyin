// GET/POST /api/sys/flavors — 口味分类与选项
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";
import type { FlavorCategoryInfo } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const cats = await db.flavorCategory.findMany({
      where: { storeId: Number(new URL(req.url).searchParams.get("storeId") ?? req.headers.get("X-Store-Id") ?? 1001) },
      include: { flavors: { orderBy: { sortOrder: "asc" } } },
      orderBy: { sortOrder: "asc" },
    });
    return ok<FlavorCategoryInfo[]>(
      cats.map((c) => ({
        id: c.id, storeId: c.storeId, name: c.name, required: c.required,
        flavors: c.flavors.map((f) => ({ id: f.id, name: f.name, priceDelta: f.priceDelta })),
      })),
    );
  } catch (e) {
    return fail(parseError(e));
  }
}

export async function POST(req: Request) {
    const storeId = Number(req.headers.get("X-Store-Id") ?? 1001);
  try {
    const { name, required, flavors } = await req.json();
    if (!name) return fail("缺少 name");
    const cat = await db.flavorCategory.create({
      data: { storeId, name, required: !!required, sortOrder: 0 },
    });
    if (Array.isArray(flavors)) {
      for (let i = 0; i < flavors.length; i++) {
        await db.productFlavor.create({
          data: { flavorCategoryId: cat.id, name: flavors[i], priceDelta: 0, sortOrder: i },
        });
      }
    }
    return ok({ id: cat.id, name: cat.name });
  } catch (e) {
    return fail(parseError(e));
  }
}
