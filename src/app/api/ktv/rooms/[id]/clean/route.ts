// POST /api/ktv/rooms/[id]/clean — 标记清扫完成（变回空闲）
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const room = await db.ktvRoom.findUnique({ where: { id } });
    if (!room) return fail("包厢不存在");
    if (room.status !== "cleaning") return fail("包厢不在清扫状态");

    await db.ktvRoom.update({
      where: { id },
      data: { status: "idle", openedAt: null, currentOrderId: null },
    });

    return ok({ id, status: "idle" });
  } catch (e) {
    return fail(parseError(e));
  }
}
