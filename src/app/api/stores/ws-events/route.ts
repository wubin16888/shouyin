// GET /api/stores/ws-events — WebSocket 连接事件
import { db } from "@/lib/db";
import { ok } from "@/lib/api-helpers";
import type { WebsocketEventInfo } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");
    const limit = Number(searchParams.get("limit") ?? 50);

    const events = await db.websocketEvent.findMany({
      where: storeId ? { storeId: Number(storeId) } : undefined,
      include: { store: { select: { storeName: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const result: WebsocketEventInfo[] = events.map((e) => ({
      id: e.id,
      storeId: e.storeId,
      eventType: e.eventType as "connect" | "disconnect" | "reconnect",
      clientIp: e.clientIp,
      sessionDuration: e.sessionDuration,
      pendingMessages: e.pendingMessages,
      reason: e.reason,
      createdAt: e.createdAt.toISOString(),
      store: e.store ? { storeName: e.store.storeName } : undefined,
    }));

    return ok(result);
  } catch (e) {
    return ok<WebsocketEventInfo[]>([]);
  }
}
