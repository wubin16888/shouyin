// POST /api/ktv/rooms/[id]/maintain — 设置/解除维修状态
// body: { action: "set" | "unset" }
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
    const action = body?.action === "unset" ? "unset" : "set";

    const room = await db.ktvRoom.findUnique({ where: { id } });
    if (!room) return fail("包厢不存在");

    if (action === "set") {
      // 使用中的房台不允许直接置维修（需要先结账/退房）
      if (room.status === "in_use" || room.status === "checkout") {
        return fail(`包厢当前状态(${room.status})无法置维修，请先结账`);
      }
      await db.ktvRoom.update({
        where: { id },
        data: { status: "maintenance", openedAt: null, currentOrderId: null },
      });
      return ok({ id, status: "maintenance" });
    } else {
      // unset：恢复空闲
      if (room.status !== "maintenance") {
        return fail(`包厢当前状态(${room.status})不在维修，无需解除`);
      }
      await db.ktvRoom.update({
        where: { id },
        data: { status: "idle" },
      });
      return ok({ id, status: "idle" });
    }
  } catch (e) {
    return fail(parseError(e));
  }
}
