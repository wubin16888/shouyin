// GET /api/ktv/rooms — 包厢列表（含进行中订单信息）
import { db } from "@/lib/db";
import { ok } from "@/lib/api-helpers";
import type { KtvRoomInfo, KtvRoomInfoV2 } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const storeId = Number(new URL(req.url).searchParams.get("storeId") ?? req.headers.get("X-Store-Id") ?? 1001);
    const rooms = await db.ktvRoom.findMany({
      where: { storeId },
      orderBy: [{ roomType: "asc" }, { roomNo: "asc" }],
    });

    const result: KtvRoomInfoV2[] = await Promise.all(
      rooms.map(async (r) => {
        let currentOrder: KtvRoomInfo["currentOrder"] = null;
        let bookingManagerName: string | null = null;
        if (r.currentOrderId) {
          const order = await db.ktvOrder.findUnique({
            where: { id: r.currentOrderId },
            include: { _count: { select: { items: true } } },
          });
          if (order) {
            currentOrder = {
              id: order.id,
              orderNo: order.orderNo,
              customerName: order.customerName,
              customerCount: order.customerCount,
              productFee: order.productFee,
              itemsCount: order._count.items,
            };
            bookingManagerName = order.bookingManagerName;
          }
        }
        return {
          id: r.id,
          storeId: r.storeId,
          roomNo: r.roomNo,
          roomName: r.roomName,
          roomType: r.roomType,
          area: r.area,
          capacity: r.capacity,
          hourlyRate: r.hourlyRate,
          minSpend: r.minSpend,
          status: r.status as KtvRoomInfo["status"],
          openedAt: r.openedAt?.toISOString() ?? null,
          currentOrderId: r.currentOrderId,
          currentOrder,
          bookingManagerName,
        };
      }),
    );
    return ok(result);
  } catch (e) {
    return ok<KtvRoomInfoV2[]>([]);
  }
}
