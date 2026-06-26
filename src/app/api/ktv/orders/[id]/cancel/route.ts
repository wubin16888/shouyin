// POST /api/ktv/orders/[id]/cancel — 取消订单
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const order = await db.ktvOrder.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) return fail("订单不存在");
    if (order.status !== "open") return fail("订单状态无法取消");

    await db.ktvOrder.update({
      where: { id },
      data: { status: "cancelled", closedAt: new Date() },
    });

    // 恢复库存（未取消的明细）
    const activeItems = order.items.filter((i) => i.status !== "cancelled");
    for (const it of activeItems) {
      await db.product.update({
        where: { id: it.productId },
        data: { stock: { increment: it.qty } },
      });
      await db.ktvOrderItem.update({
        where: { id: it.id },
        data: { status: "cancelled" },
      });
    }

    // 释放包厢
    await db.ktvRoom.update({
      where: { id: order.roomId },
      data: { status: "idle", openedAt: null, currentOrderId: null },
    });

    return ok({ id, status: "cancelled" });
  } catch (e) {
    return fail(parseError(e));
  }
}
