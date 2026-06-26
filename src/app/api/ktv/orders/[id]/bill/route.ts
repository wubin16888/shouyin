// GET /api/ktv/orders/[id]/bill — 获取完整账单明细（含计费模式计算）
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const order = await db.ktvOrder.findUnique({
      where: { id },
      include: {
        items: { orderBy: { createdAt: "asc" } },
        room: true,
        member: { select: { name: true, cardNo: true, discount: true, balance: true } },
      },
    });
    if (!order) return fail("订单不存在");

    const now = new Date();
    const elapsedMin = Math.max(1, Math.ceil((now.getTime() - order.openedAt.getTime()) / 60000));

    // 按计费模式算包厢费
    let roomFee = 0;
    let billingMode = order.room.billingMode;
    let minSpend = order.room.minSpend;
    if (order.status === "paid") {
      roomFee = order.roomFee;
    } else {
      switch (order.room.billingMode) {
        case "hourly":
          roomFee = Math.round(order.hourlyRate * (elapsedMin / 60) * 100) / 100;
          break;
        case "minspend":
          roomFee = order.room.minSpend;
          break;
        case "package":
          // 套餐模式：包厢费=套餐价
          if (order.room.packageId) {
            const pkg = await db.product.findUnique({ where: { id: order.room.packageId } });
            roomFee = pkg?.packagePrice ?? 0;
          }
          break;
        case "free":
          roomFee = 0;
          break;
        default:
          roomFee = Math.round(order.hourlyRate * (elapsedMin / 60) * 100) / 100;
      }
    }

    // 商品明细分组（套餐内子商品单价0，单独显示套餐价）
    const items = order.items.map((it) => ({
      id: it.id,
      productName: it.productName,
      price: it.price,
      qty: it.qty,
      amount: it.price * it.qty,
      flavors: it.flavors ? JSON.parse(it.flavors) : null,
      outputDept: it.outputDept,
      status: it.status,
      isGift: it.isGift,
      giftRemark: it.giftRemark,
      createdAt: it.createdAt.toISOString(),
    }));

    // 商品费 = 非赠送商品的金额（赠送价格为0所以不影响）
    const productFee = items
      .filter((i) => i.status !== "cancelled")
      .reduce((s, i) => s + i.amount, 0);

    // 会员折扣
    let discount = 0;
    if (order.member) {
      discount = Math.round(productFee * (1 - order.member.discount) * 100) / 100;
    }

    const total = Math.round((roomFee + productFee - discount) * 100) / 100;

    return ok({
      orderId: order.id,
      orderNo: order.orderNo,
      roomNo: order.roomNo,
      roomName: order.room.roomName,
      roomType: order.roomType,
      billingMode,
      hourlyRate: order.hourlyRate,
      minSpend,
      openedAt: order.openedAt.toISOString(),
      closedAt: order.closedAt?.toISOString() ?? null,
      elapsedMinutes: order.status === "paid" ? order.durationMinutes : elapsedMin,
      customerName: order.customerName,
      customerCount: order.customerCount,
      bookingManagerName: order.bookingManagerName,
      items,
      roomFee,
      productFee,
      discount,
      totalAmount: order.status === "paid" ? order.totalAmount : total,
      payMethod: order.payMethod,
      status: order.status,
      member: order.member
        ? { name: order.member.name, cardNo: order.member.cardNo, discount: order.member.discount, balance: order.member.balance }
        : null,
    });
  } catch (e) {
    return fail(parseError(e));
  }
}
