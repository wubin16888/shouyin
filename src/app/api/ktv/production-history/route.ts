// GET /api/ktv/production-history — 出品历史明细查询（按时间/出品点/类）
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dept = searchParams.get("dept"); // bar/kitchen/fruit/outside
    const category = searchParams.get("category"); // 大类名
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = Math.min(Number(searchParams.get("limit") ?? 500), 2000);

    const where: any = {};
    if (dept) where.outputDept = dept;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate + "T23:59:59");
    }
    if (category) {
      where.product = { category: { name: category } };
    }

    const items = await db.ktvOrderItem.findMany({
      where,
      include: {
        order: { select: { roomNo: true, orderNo: true, openedAt: true, customerName: true } },
        product: { select: { name: true, category: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // 汇总统计
    const stats = {
      total: items.length,
      delivered: items.filter((i) => i.status === "delivered").length,
      cancelled: items.filter((i) => i.status === "cancelled").length,
      totalAmount: items
        .filter((i) => i.status !== "cancelled")
        .reduce((s, i) => s + i.price * i.qty, 0),
      byDept: groupBy(items, "outputDept"),
      byCategory: groupBy(
        items.map((i) => ({ ...i, catName: i.product?.category?.name ?? "未知" })),
        "catName",
      ),
    };

    return ok({
      items: items.map((i) => ({
        id: i.id,
        productName: i.productName,
        qty: i.qty,
        price: i.price,
        amount: i.price * i.qty,
        flavors: i.flavors,
        outputDept: i.outputDept,
        status: i.status,
        isGift: i.isGift,
        roomNo: i.order?.roomNo,
        orderNo: i.order?.orderNo,
        customerName: i.order?.customerName,
        categoryName: i.product?.category?.name,
        createdAt: i.createdAt.toISOString(),
        deliveredAt: i.deliveredAt?.toISOString() ?? null,
      })),
      stats,
    });
  } catch (e) {
    return fail(parseError(e));
  }
}

function groupBy(arr: any[], key: string) {
  const m = new Map<string, number>();
  arr.forEach((i) => {
    const k = i[key] ?? "未知";
    m.set(k, (m.get(k) ?? 0) + 1);
  });
  return [...m.entries()].map(([k, v]) => ({ name: k, count: v }));
}
