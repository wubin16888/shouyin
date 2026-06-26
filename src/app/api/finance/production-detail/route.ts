// GET /api/finance/production-detail — 出品明细单查询（按类/出品点/时间）
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dept = searchParams.get("dept");
    const category = searchParams.get("category");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = Math.min(Number(searchParams.get("limit") ?? 1000), 5000);

    const where: any = {};
    if (dept) where.outputDept = dept;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate + "T23:59:59");
    }

    const items = await db.ktvOrderItem.findMany({
      where,
      include: {
        order: { select: { roomNo: true, orderNo: true, openedAt: true, customerName: true, bookingManagerName: true } },
        product: { select: { name: true, category: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    let filtered = items;
    if (category) {
      filtered = items.filter((i) => i.product?.category?.name === category);
    }

    return ok({
      items: filtered.map((i) => ({
        id: i.id,
        productName: i.productName,
        categoryName: i.product?.category?.name ?? "未知",
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
        bookingManagerName: i.order?.bookingManagerName,
        createdAt: i.createdAt.toISOString(),
        deliveredAt: i.deliveredAt?.toISOString() ?? null,
      })),
      total: filtered.length,
      totalAmount: filtered
        .filter((i) => i.status !== "cancelled")
        .reduce((s, i) => s + i.price * i.qty, 0),
    });
  } catch (e) {
    return fail(parseError(e));
  }
}
