// POST /api/ktv/rooms/[id]/reserve — 订房（将空闲房台标记为 reserved）
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const room = await db.ktvRoom.findUnique({ where: { id } });
    if (!room) return fail("包厢不存在");
    if (room.status !== "idle") {
      return fail(`包厢当前状态(${room.status})无法订房，仅空闲房台可预订`);
    }

    await db.ktvRoom.update({
      where: { id },
      data: { status: "reserved" },
    });

    // 同时记录一条预订信息（可选）— 写入 KtvReservation
    const now = new Date();
    try {
      await db.ktvReservation.create({
        data: {
          customerName: body?.customerName ?? "预留",
          phone: body?.phone ?? null,
          partySize: body?.partySize ? Number(body.partySize) : 0,
          startAt: now,
          endAt: new Date(now.getTime() + 2 * 60 * 60 * 1000),
          roomNo: room.roomNo,
          remark: body?.remark ?? "前台订房",
          status: "confirmed",
        },
      });
    } catch {
      // 预订表写入失败不阻断主流程
    }

    return ok({ id, status: "reserved" });
  } catch (e) {
    return fail(parseError(e));
  }
}
