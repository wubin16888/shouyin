// GET/POST/PUT /api/sys/products — 商品管理
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";
import type { ProductInfo } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dept = searchParams.get("dept");
    const products = await db.product.findMany({
      where: { storeId: Number(new URL(req.url).searchParams.get("storeId") ?? req.headers.get("X-Store-Id") ?? 1001), ...(dept ? { outputDept: dept } : {}) },
      include: {
        category: { select: { name: true } },
        subcategory: { select: { name: true } },
        flavors: { include: { flavorCategory: { select: { name: true } } } },
      },
      orderBy: [{ category: { sortOrder: "asc" } }, { price: "asc" }],
    });
    return ok<ProductInfo[]>(
      products.map((p) => ({
        id: p.id, storeId: p.storeId, name: p.name,
        categoryId: p.categoryId, categoryName: p.category.name,
        subcategoryId: p.subcategoryId, subcategoryName: p.subcategory?.name ?? null,
        price: p.price, roomPrice: p.roomPrice, hallPrice: p.hallPrice, memberPrice: p.memberPrice, costPrice: p.costPrice, unit: p.unit, sortOrder: p.sortOrder, cost: p.cost, stock: p.stock, barcode: p.barcode,
        imageUrl: p.imageUrl, outputDept: p.outputDept, isPackage: p.isPackage,
        countToMinSpend: p.countToMinSpend, packagePrice: p.packagePrice,
        packageItems: p.packageItems,
        status: p.status, pinyin: p.pinyin,
        flavors: p.flavors.map((f) => ({ id: f.id, name: f.name, categoryName: f.flavorCategory.name })),
      })),
    );
  } catch (e) {
    return fail(parseError(e));
  }
}

export async function POST(req: Request) {
    const storeId = Number(req.headers.get("X-Store-Id") ?? 1001);
  try {
    const body = await req.json();
    const p = await db.product.create({
      data: {
        storeId,
        name: body.name,
        categoryId: body.categoryId,
        subcategoryId: body.subcategoryId ?? null,
        price: Number(body.price), roomPrice: Number(body.roomPrice ?? body.price), hallPrice: Number(body.hallPrice ?? body.price), memberPrice: Number(body.memberPrice ?? body.price), costPrice: Number(body.costPrice ?? 0), unit: body.unit ?? "份", sortOrder: Number(body.sortOrder ?? 0),
        cost: Number(body.cost ?? 0),
        stock: Number(body.stock ?? 0),
        barcode: body.barcode ?? null,
        outputDept: body.outputDept ?? "bar",
        isPackage: !!body.isPackage,
        status: 1,
      },
    });
    // 绑定口味
    if (Array.isArray(body.flavorCategoryIds)) {
      const flavors = await db.productFlavor.findMany({
        where: { flavorCategoryId: { in: body.flavorCategoryIds } },
      });
      await db.product.update({
        where: { id: p.id },
        data: { flavors: { connect: flavors.map((f) => ({ id: f.id })) } },
      });
    }
    return ok({ id: p.id, name: p.name });
  } catch (e) {
    return fail(parseError(e));
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, flavorCategoryIds, ...data } = body;
    if (!id) return fail("缺少 id");
    const update: any = {};
    for (const k of ["name", "categoryId", "subcategoryId", "barcode", "imageUrl", "outputDept", "pinyin", "unit"]) {
      if (data[k] !== undefined) update[k] = data[k];
    }
    for (const k of ["price", "cost", "stock", "roomPrice", "hallPrice", "memberPrice", "costPrice", "sortOrder"]) {
      if (data[k] !== undefined) update[k] = Number(data[k]);
    }
    if (data.isPackage !== undefined) update.isPackage = !!data.isPackage;
    if (data.countToMinSpend !== undefined) update.countToMinSpend = !!data.countToMinSpend;
    if (data.packagePrice !== undefined) update.packagePrice = Number(data.packagePrice);
    if (data.packageItems !== undefined) update.packageItems = data.packageItems;
    if (data.status !== undefined) update.status = Number(data.status);

    const updated = await db.product.update({ where: { id }, data: update });

    // 重新绑定口味
    if (Array.isArray(flavorCategoryIds)) {
      const flavors = await db.productFlavor.findMany({
        where: { flavorCategoryId: { in: flavorCategoryIds } },
      });
      await db.product.update({
        where: { id },
        data: { flavors: { set: flavors.map((f) => ({ id: f.id })) } },
      });
    }
    return ok({ id: updated.id });
  } catch (e) {
    return fail(parseError(e));
  }
}
