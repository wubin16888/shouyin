// POST /api/ktv/rooms/[id]/open — 开台
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
    const room = await db.ktvRoom.findUnique({ where: { id } });
    if (!room) return fail("包厢不存在");
    if (room.status !== "idle" && room.status !== "reserved")
      return fail(`包厢当前状态(${room.status})无法开台`);

    const now = new Date();
    const orderNo = `KTV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.floor(Math.random() * 9000) + 1000}`;

    const order = await db.ktvOrder.create({
      data: {
        storeId: room.storeId,
        orderNo,
        roomId: room.id,
        roomNo: room.roomNo,
        roomType: room.roomType,
        hourlyRate: room.hourlyRate,
        customerName: body.customerName ?? null,
        customerCount: Number(body.customerCount ?? 1),
        phone: body.phone ?? null,
        memberId: body.memberId ?? null,
        bookingManagerId: body.bookingManagerId ?? null,
        bookingManagerName: body.bookingManagerName ?? null,
        openedAt: now,
        status: "open",
      },
    });

    await db.ktvRoom.update({
      where: { id },
      data: { status: "in_use", openedAt: now, currentOrderId: order.id },
    });

    return ok<KtvOrderInfo>({
      id: order.id,
      storeId: order.storeId,
      orderNo: order.orderNo,
      roomId: order.roomId,
      roomNo: order.roomNo,
      roomType: order.roomType,
      hourlyRate: order.hourlyRate,
      customerName: order.customerName,
      customerCount: order.customerCount,
      phone: order.phone,
      openedAt: order.openedAt.toISOString(),
      closedAt: null,
      durationMinutes: 0,
      roomFee: 0,
      productFee: 0,
      discount: 0,
      totalAmount: 0,
      payMethod: null,
      status: "open",
      memberId: order.memberId,
      items: [],
    });
  } catch (e) {
    return fail(parseError(e));
  }
}
