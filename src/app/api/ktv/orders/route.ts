// GET /api/ktv/orders — 订单列表（含明细）
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";
import type { KtvOrderInfoV2 } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // open / paid / cancelled
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);

    const orders = await db.ktvOrder.findMany({
      where: status ? { status } : undefined,
      include: {
        items: { orderBy: { createdAt: "desc" } },
        member: { select: { name: true, cardNo: true, discount: true } },
      },
      orderBy: { openedAt: "desc" },
      take: limit,
    });

    return ok<KtvOrderInfoV2[]>(
      orders.map((o) => ({
        id: o.id,
        storeId: o.storeId,
        orderNo: o.orderNo,
        roomId: o.roomId,
        roomNo: o.roomNo,
        roomType: o.roomType,
        hourlyRate: o.hourlyRate,
        customerName: o.customerName,
        customerCount: o.customerCount,
        phone: o.phone,
        openedAt: o.openedAt.toISOString(),
        closedAt: o.closedAt?.toISOString() ?? null,
        durationMinutes: o.durationMinutes,
        roomFee: o.roomFee,
        productFee: o.productFee,
        discount: o.discount,
        totalAmount: o.totalAmount,
        payMethod: o.payMethod,
        status: o.status as KtvOrderInfoV2["status"],
        memberId: o.memberId,
        bookingManagerId: o.bookingManagerId,
        bookingManagerName: o.bookingManagerName,
        items: o.items.map((it) => ({
          id: it.id,
          orderId: it.orderId,
          productId: it.productId,
          productName: it.productName,
          price: it.price,
          qty: it.qty,
          status: it.status as KtvOrderItemStatus,
          deliveredAt: it.deliveredAt?.toISOString() ?? null,
          createdAt: it.createdAt.toISOString(),
          flavors: it.flavors,
          outputDept: it.outputDept,
          isGift: it.isGift,
          giftRemark: it.giftRemark,
          printedAt: it.printedAt?.toISOString() ?? null,
        })),
        member: o.member
          ? { name: o.member.name, cardNo: o.member.cardNo, discount: o.member.discount }
          : null,
      })),
    );
  } catch (e) {
    return fail(parseError(e));
  }
}

type KtvOrderItemStatus = "pending" | "printed" | "delivered" | "cancelled";
