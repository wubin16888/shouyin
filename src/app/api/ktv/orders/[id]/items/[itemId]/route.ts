// DELETE /api/ktv/orders/[id]/items/[itemId] — 退单（取消某个商品明细）
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  try {
    const { id, itemId } = await params;
    const item = await db.ktvOrderItem.findUnique({ where: { id: itemId } });
    if (!item || item.orderId !== id) return fail("明细不存在");
    if (item.status === "cancelled") return fail("已退单");
    if (item.status === "delivered") return fail("已送达，无法退单");

    await db.ktvOrderItem.update({
      where: { id: itemId },
      data: { status: "cancelled" },
    });

    // 恢复库存 + 减少订单商品费
    await db.product.update({
      where: { id: item.productId },
      data: { stock: { increment: item.qty } },
    });
    await db.ktvOrder.update({
      where: { id },
      data: { productFee: { decrement: Math.round(item.price * item.qty * 100) / 100 } },
    });

    return ok({ id: itemId, status: "cancelled" });
  } catch (e) {
    return fail(parseError(e));
  }
}
