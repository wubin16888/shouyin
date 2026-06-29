// POST /api/ktv/orders/[id]/transfer — 转房（把订单转到另一个包厢）
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { toRoomId } = await req.json();
    if (!toRoomId) return fail("缺少 toRoomId");

    const order = await db.ktvOrder.findUnique({ where: { id } });
    if (!order) return fail("订单不存在");
    if (order.status !== "open") return fail("订单已结账，无法转房");

    const toRoom = await db.ktvRoom.findUnique({ where: { id: toRoomId } });
    if (!toRoom) return fail("目标包厢不存在");
    if (toRoom.status !== "idle") return fail("目标包厢非空闲，无法转入");

    const fromRoomId = order.roomId;
    const fromRoomNo = order.roomNo;

    // 读取转房规则配置：new(按新房价) / old(按原房价) / both(两房价分别)
    const cfg = await db.sysConfig.findUnique({
      where: { storeId_configKey: { storeId: order.storeId, configKey: "transfer_rule" } },
    });
    let mode = "new";
    if (cfg?.configValue) {
      try { mode = JSON.parse(cfg.configValue).mode ?? "new"; } catch {}
    }
    // new/both: 按新房价；old: 保持原房费率
    const updateData: Record<string, unknown> = {
      roomId: toRoomId,
      roomNo: toRoom.roomNo,
      roomType: toRoom.roomType,
    };
    if (mode !== "old") {
      updateData.hourlyRate = toRoom.hourlyRate;
    }

    // 更新订单的包厢信息
    const updated = await db.ktvOrder.update({
      where: { id },
      data: updateData,
    });

    // 原包厢释放 -> 清扫中
    await db.ktvRoom.update({
      where: { id: fromRoomId },
      data: { status: "cleaning", openedAt: null, currentOrderId: null },
    });
    // 新包厢 -> 使用中
    await db.ktvRoom.update({
      where: { id: toRoomId },
      data: { status: "in_use", openedAt: order.openedAt, currentOrderId: id },
    });

    await db.auditLog.create({
      data: {
        storeId: order.storeId,
        userName: "admin",
        operationType: "order.refund",
        resourceType: "transfer",
        resourceId: id,
        changes: JSON.stringify({ from: fromRoomNo, to: toRoom.roomNo }),
        status: "success",
      },
    });

    return ok({
      orderId: id,
      fromRoomNo,
      toRoomNo: toRoom.roomNo,
      newRoomId: toRoomId,
    });
  } catch (e) {
    return fail(parseError(e));
  }
}
