// GET /api/finance/category-sales — 分类销售查询（按大类/出品点统计销售额）
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = { status: "paid" };
    if (startDate || endDate) {
      where.closedAt = {};
      if (startDate) where.closedAt.gte = new Date(startDate);
      if (endDate) where.closedAt.lte = new Date(endDate + "T23:59:59");
    }

    const orders = await db.ktvOrder.findMany({
      where,
      include: {
        items: {
          include: { product: { select: { name: true, category: { select: { name: true } } } } },
        },
      },
    });

    // 按大类聚合
    const catMap = new Map<string, { qty: number; amount: number; orders: Set<string> }>();
    // 按出品点聚合
    const deptMap = new Map<string, { qty: number; amount: number }>();
    // 按商品聚合
    const productMap = new Map<string, { qty: number; amount: number; category: string }>();

    orders.forEach((o) => {
      o.items.forEach((it) => {
        if (it.status === "cancelled") return;
        const catName = it.product?.category?.name ?? "未知";
        const amount = it.price * it.qty;

        const cat = catMap.get(catName) ?? { qty: 0, amount: 0, orders: new Set() };
        cat.qty += it.qty;
        cat.amount += amount;
        cat.orders.add(o.id);
        catMap.set(catName, cat);

        const dept = deptMap.get(it.outputDept) ?? { qty: 0, amount: 0 };
        dept.qty += it.qty;
        dept.amount += amount;
        deptMap.set(it.outputDept, dept);

        const pkey = it.productName;
        const p = productMap.get(pkey) ?? { qty: 0, amount: 0, category: catName };
        p.qty += it.qty;
        p.amount += amount;
        productMap.set(pkey, p);
      });
    });

    return ok({
      categorySales: [...catMap.entries()]
        .map(([name, v]) => ({ name, qty: v.qty, amount: Math.round(v.amount * 100) / 100, orderCount: v.orders.size }))
        .sort((a, b) => b.amount - a.amount),
      deptSales: [...deptMap.entries()]
        .map(([name, v]) => ({ name, qty: v.qty, amount: Math.round(v.amount * 100) / 100 }))
        .sort((a, b) => b.amount - a.amount),
      productSales: [...productMap.entries()]
        .map(([name, v]) => ({ name, qty: v.qty, amount: Math.round(v.amount * 100) / 100, category: v.category }))
        .sort((a, b) => b.amount - a.amount),
      totalOrders: orders.length,
      totalAmount: orders.reduce((s, o) => s + o.totalAmount, 0),
    });
  } catch (e) {
    return fail(parseError(e));
  }
}
