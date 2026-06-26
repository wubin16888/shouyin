// POST /api/ktv/orders/[id]/items/[itemId]/deliver — 标记商品已送达
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  try {
    const { id, itemId } = await params;
    const item = await db.ktvOrderItem.findUnique({ where: { id: itemId } });
    if (!item || item.orderId !== id) return fail("明细不存在");
    if (item.status !== "pending" && item.status !== "printed")
      return fail("该明细状态无法标记送达");

    const updated = await db.ktvOrderItem.update({
      where: { id: itemId },
      data: { status: "delivered", deliveredAt: new Date() },
    });

    return ok({
      id: updated.id,
      status: updated.status,
      deliveredAt: updated.deliveredAt?.toISOString(),
    });
  } catch (e) {
    return fail(parseError(e));
  }
}
