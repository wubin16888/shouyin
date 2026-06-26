// GET/POST /api/pos/orders — 订单查询与下单
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";
import type { OrderInfo } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);

    const orders = await db.order.findMany({
      where: storeId ? { storeId: Number(storeId) } : undefined,
      include: { store: { select: { storeName: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const result: OrderInfo[] = orders.map((o) => ({
      id: o.id,
      orderId: o.orderId,
      storeId: o.storeId,
      orderNo: o.orderNo,
      totalAmount: o.totalAmount,
      status: o.status,
      payMethod: o.payMethod,
      itemCount: o.itemCount,
      syncVersion: o.syncVersion,
      items: o.items,
      createdAt: o.createdAt.toISOString(),
      store: o.store ? { storeName: o.store.storeName } : undefined,
    }));
    return ok(result);
  } catch (e) {
    return fail(parseError(e));
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const storeId = Number(body.storeId);
    const items = body.items as Array<{ name: string; qty: number; price: number }>;
    const payMethod = String(body.payMethod ?? "cash");
    if (!storeId || !Array.isArray(items) || items.length === 0)
      return fail("缺少 storeId 或 items");

    const totalAmount = Math.round(
      items.reduce((s, i) => s + i.price * i.qty, 0) * 100,
    ) / 100;
    const itemCount = items.reduce((s, i) => s + i.qty, 0);

    // 生成订单号
    const now = new Date();
    const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const seq = Math.floor(Math.random() * 10000);
    const orderNo = `ORD-${storeId}-${ymd}-${String(seq).padStart(4, "0")}`;
    const orderId = Math.floor(Math.random() * 9000000) + 1000000;

    const order = await db.order.create({
      data: {
        orderId,
        storeId,
        orderNo,
        totalAmount,
        status: 2, // 已支付
        payMethod,
        itemCount,
        syncVersion: 1,
        items: JSON.stringify(items),
      },
      include: { store: { select: { storeName: true } } },
    });

    await db.auditLog.create({
      data: {
        storeId,
        userName: "cashier",
        operationType: "order.create",
        resourceType: "order",
        resourceId: String(orderId),
        changes: JSON.stringify({ totalAmount, payMethod, itemCount }),
        status: "success",
      },
    });

    // 更新今日日报
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await db.chainReportDaily.upsert({
      where: { reportDate_storeId: { reportDate: today, storeId } },
      update: {
        totalOrders: { increment: 1 },
        totalRevenue: { increment: totalAmount },
      },
      create: {
        reportDate: today,
        storeId,
        totalOrders: 1,
        totalRevenue: totalAmount,
        avgOrderValue: totalAmount,
        memberCardPayments: payMethod === "member" ? 1 : 0,
        memberCardAmount: payMethod === "member" ? totalAmount : 0,
      },
    });

    return ok<OrderInfo>({
      id: order.id,
      orderId: order.orderId,
      storeId: order.storeId,
      orderNo: order.orderNo,
      totalAmount: order.totalAmount,
      status: order.status,
      payMethod: order.payMethod,
      itemCount: order.itemCount,
      syncVersion: order.syncVersion,
      items: order.items,
      createdAt: order.createdAt.toISOString(),
      store: order.store ? { storeName: order.store.storeName } : undefined,
    });
  } catch (e) {
    return fail(parseError(e));
  }
}
