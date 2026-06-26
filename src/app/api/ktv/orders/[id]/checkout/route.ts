// POST /api/ktv/orders/[id]/checkout — 结账
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";
import type { KtvOrderInfo } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const payMethod = String(body.payMethod ?? "cash");
    const customDiscount = Number(body.discount ?? 0);
    const memberId = body.memberId as string | undefined;

    const order = await db.ktvOrder.findUnique({
      where: { id },
      include: { room: true, member: memberId ? undefined : false },
    });
    if (!order) return fail("订单不存在");
    if (order.status !== "open") return fail("订单状态无法结账");

    const now = new Date();
    const durationMinutes = Math.max(
      1,
      Math.ceil((now.getTime() - order.openedAt.getTime()) / 60000),
    );
    // 按计费模式算包厢费
    let roomFee = 0;
    switch (order.room.billingMode) {
      case "hourly":
        roomFee = Math.round(order.hourlyRate * (durationMinutes / 60) * 100) / 100;
        break;
      case "minspend":
        roomFee = order.room.minSpend;
        break;
      case "package":
        if (order.room.packageId) {
          const pkg = await db.product.findUnique({ where: { id: order.room.packageId } });
          roomFee = pkg?.packagePrice ?? 0;
        }
        break;
      case "free":
        roomFee = 0;
        break;
      default:
        roomFee = Math.round(order.hourlyRate * (durationMinutes / 60) * 100) / 100;
    }
    const productFee = order.productFee;

    // 会员折扣
    let discount = customDiscount;
    let usedMemberId = memberId ?? order.memberId;
    if (usedMemberId && discount === 0) {
      const member = await db.member.findUnique({ where: { id: usedMemberId } });
      if (member && member.status === 1) {
        discount = Math.round(productFee * (1 - member.discount) * 100) / 100;
      }
    }
    const totalAmount = Math.round((roomFee + productFee - discount) * 100) / 100;

    const updated = await db.ktvOrder.update({
      where: { id },
      data: {
        closedAt: now,
        durationMinutes,
        roomFee,
        discount,
        totalAmount,
        payMethod,
        memberId: usedMemberId,
        status: "paid",
      },
      include: {
        items: true,
        member: { select: { name: true, cardNo: true, discount: true } },
      },
    });

    // 释放包厢 -> 清扫中
    await db.ktvRoom.update({
      where: { id: order.roomId },
      data: { status: "cleaning", currentOrderId: null },
    });

    // 会员消费记录 + 扣余额/加积分
    if (usedMemberId && payMethod === "member") {
      const member = await db.member.findUnique({ where: { id: usedMemberId } });
      if (member) {
        if (member.balance < totalAmount) {
          // 余额不足，回滚
          await db.ktvOrder.update({
            where: { id },
            data: { status: "open", closedAt: null },
          });
          await db.ktvRoom.update({
            where: { id: order.roomId },
            data: { status: "in_use", currentOrderId: id },
          });
          return fail(`会员余额不足（${member.balance} < ${totalAmount}）`);
        }
        const newBalance = member.balance - totalAmount;
        const newPoints = member.points + Math.floor(totalAmount);
        await db.member.update({
          where: { id: usedMemberId },
          data: {
            balance: newBalance,
            points: newPoints,
            totalSpent: { increment: totalAmount },
          },
        });
        await db.memberTransaction.create({
          data: {
            memberId: usedMemberId,
            type: "consume",
            amount: -totalAmount,
            pointsDelta: Math.floor(totalAmount),
            balanceAfter: newBalance,
            remark: `KTV消费 ${order.orderNo}`,
            relatedOrderNo: order.orderNo,
          },
        });
      }
    } else if (usedMemberId) {
      // 非会员卡支付，只加积分
      const member = await db.member.findUnique({ where: { id: usedMemberId } });
      if (member) {
        await db.member.update({
          where: { id: usedMemberId },
          data: {
            points: { increment: Math.floor(totalAmount) },
            totalSpent: { increment: totalAmount },
          },
        });
      }
    }

    return ok<KtvOrderInfo>({
      id: updated.id,
      storeId: updated.storeId,
      orderNo: updated.orderNo,
      roomId: updated.roomId,
      roomNo: updated.roomNo,
      roomType: updated.roomType,
      hourlyRate: updated.hourlyRate,
      customerName: updated.customerName,
      customerCount: updated.customerCount,
      phone: updated.phone,
      openedAt: updated.openedAt.toISOString(),
      closedAt: updated.closedAt!.toISOString(),
      durationMinutes: updated.durationMinutes,
      roomFee: updated.roomFee,
      productFee: updated.productFee,
      discount: updated.discount,
      totalAmount: updated.totalAmount,
      payMethod: updated.payMethod,
      status: "paid",
      memberId: updated.memberId,
      items: updated.items.map((it) => ({
        id: it.id,
        orderId: it.orderId,
        productId: it.productId,
        productName: it.productName,
        price: it.price,
        qty: it.qty,
        status: it.status as "pending" | "delivered" | "cancelled",
        deliveredAt: it.deliveredAt?.toISOString() ?? null,
        createdAt: it.createdAt.toISOString(),
      })),
      member: updated.member
        ? { name: updated.member.name, cardNo: updated.member.cardNo, discount: updated.member.discount }
        : null,
    });
  } catch (e) {
    return fail(parseError(e));
  }
}
