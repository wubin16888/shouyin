// POST /api/stores/[storeId]/ws — 模拟切换 WebSocket 连接状态
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const { storeId } = await params;
    const body = await req.json();
    const wsStatus = body.wsStatus as "online" | "offline";
    if (!["online", "offline"].includes(wsStatus)) return fail("wsStatus 非法");

    const updated = await db.store.update({
      where: { storeId: Number(storeId) },
      data: {
        wsStatus,
        lastConnectedAt: wsStatus === "online" ? new Date() : undefined,
      },
    });

    await db.websocketEvent.create({
      data: {
        storeId: Number(storeId),
        eventType: wsStatus === "online" ? "reconnect" : "disconnect",
        clientIp: "127.0.0.1",
        sessionDuration: 0,
        pendingMessages: 0,
        reason: wsStatus === "online" ? "手动重连" : "手动断开",
      },
    });

    return ok({ storeId: updated.storeId, wsStatus: updated.wsStatus });
  } catch (e) {
    return fail(parseError(e));
  }
}
