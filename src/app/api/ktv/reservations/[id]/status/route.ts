// POST /api/ktv/reservations/[id]/status — 更新预订状态
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";
import type { KtvReservationInfo } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { status } = await req.json();
    const valid = ["pending", "confirmed", "arrived", "cancelled", "noshow"];
    if (!valid.includes(status)) return fail("状态非法");

    const updated = await db.ktvReservation.update({
      where: { id },
      data: { status },
    });

    return ok<KtvReservationInfo>({
      id: updated.id,
      storeId: updated.storeId,
      roomId: updated.roomId,
      roomNo: updated.roomNo,
      customerName: updated.customerName,
      phone: updated.phone,
      partySize: updated.partySize,
      startAt: updated.startAt.toISOString(),
      endAt: updated.endAt.toISOString(),
      status: updated.status as KtvReservationInfo["status"],
      remark: updated.remark,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (e) {
    return fail(parseError(e));
  }
}
