// POST /api/ktv/orders/[id]/gift — 经理赠送商品（扣赠送额度）
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { productId, qty, managerId, remark } = await req.json();
    if (!productId || !qty) return fail("缺少 productId 或 qty");

    const order = await db.ktvOrder.findUnique({ where: { id } });
    if (!order) return fail("订单不存在");
    if (order.status !== "open") return fail("订单已结账");

    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) return fail("商品不存在");

    // 校验经理赠送额度
    let manager: any = null;
    if (managerId) {
      manager = await db.employee.findUnique({ where: { id: managerId } });
      if (!manager) return fail("经理不存在");
      const now = new Date();
      // 月份变了则重置
      if (manager.resetMonth !== now.getMonth() + 1) {
        await db.employee.update({
          where: { id: managerId },
          data: { usedGiftAmount: 0, resetMonth: now.getMonth() + 1 },
        });
        manager.usedGiftAmount = 0;
      }
      const giftValue = product.price * qty;
      if (manager.monthlyGiftLimit > 0 && manager.usedGiftAmount + giftValue > manager.monthlyGiftLimit) {
        return fail(`赠送额度不足（本月剩余 ${manager.monthlyGiftLimit - manager.usedGiftAmount}）`);
      }
    }

    // 创建赠送明细（价格为0，标记 isGift）
    const item = await db.ktvOrderItem.create({
      data: {
        orderId: id,
        productId: product.id,
        productName: product.name,
        price: 0, // 赠送价格为0
        qty,
        flavors: null,
        outputDept: product.outputDept,
        status: "delivered", // 赠送直接标记已送达
        isGift: true,
        giftRemark: remark ?? (manager ? `${manager.name}赠送` : "经理赠送"),
        deliveredAt: new Date(),
      },
    });

    // 扣经理赠送额度
    if (manager) {
      const giftValue = product.price * qty;
      await db.employee.update({
        where: { id: managerId },
        data: { usedGiftAmount: { increment: giftValue } },
      });
    }

    await db.auditLog.create({
      data: {
        storeId: order.storeId,
        userName: manager?.name ?? "admin",
        operationType: "member.recharge",
        resourceType: "gift",
        resourceId: id,
        changes: JSON.stringify({ product: product.name, qty, manager: manager?.name }),
        status: "success",
      },
    });

    return ok({
      id: item.id, orderId: id, productName: product.name, qty,
      isGift: true, manager: manager?.name ?? null,
    });
  } catch (e) {
    return fail(parseError(e));
  }
}
