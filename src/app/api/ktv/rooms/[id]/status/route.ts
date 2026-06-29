// POST /api/ktv/rooms/[id]/status — 通用状态更新（用于"打单中" checkout 等自定义状态）
// body: { status: string }
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

// 允许通过此接口设置的状态白名单
const ALLOWED = ["idle", "reserved", "seated", "in_use", "cleaning", "maintenance", "checkout"];

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const status = String(body?.status ?? "");
    if (!ALLOWED.includes(status)) {
      return fail(`不支持的状态: ${status || "(空)"}，允许: ${ALLOWED.join("/")}`);
    }

    const room = await db.ktvRoom.findUnique({ where: { id } });
    if (!room) return fail("包厢不存在");

    await db.ktvRoom.update({
      where: { id },
      data: { status },
    });

    return ok({ id, status });
  } catch (e) {
    return fail(parseError(e));
  }
}
