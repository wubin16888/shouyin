// GET /api/ktv/dashboard — KTV 门店看板
import { db } from "@/lib/db";
import { ok } from "@/lib/api-helpers";
import type { KtvDashboardSummary } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rooms = await db.ktvRoom.findMany();
    const totalRooms = rooms.length;
    const idleRooms = rooms.filter((r) => r.status === "idle").length;
    const inUseRooms = rooms.filter((r) => r.status === "in_use").length;
    const cleaningRooms = rooms.filter((r) => r.status === "cleaning").length;
    const reservedRooms = rooms.filter((r) => r.status === "reserved").length;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayOrders = await db.ktvOrder.findMany({
      where: { openedAt: { gte: todayStart } },
    });
    const todayCheckouts = todayOrders.filter((o) => o.status === "paid").length;
    const todayRevenue = todayOrders
      .filter((o) => o.status === "paid")
      .reduce((s, o) => s + o.totalAmount, 0);

    const pendingReservations = await db.ktvReservation.count({
      where: { status: { in: ["pending", "confirmed"] } },
    });
    const totalMembers = await db.member.count();

    const todayRecharges = await db.memberTransaction.findMany({
      where: { type: "recharge", createdAt: { gte: todayStart } },
    });
    const todayMemberRecharge = todayRecharges.reduce((s, t) => s + t.amount, 0);

    // 按小时趋势（今天）
    const hourlyTrend: Array<{ hour: string; revenue: number; orders: number }> = [];
    for (let h = 0; h < 24; h++) {
      const hStart = new Date(todayStart);
      hStart.setHours(h, 0, 0, 0);
      const hEnd = new Date(hStart);
      hEnd.setHours(h + 1);
      const hOrders = todayOrders.filter(
        (o) => o.openedAt >= hStart && o.openedAt < hEnd,
      );
      hourlyTrend.push({
        hour: `${String(h).padStart(2, "0")}:00`,
        revenue: Math.round(
          hOrders.filter((o) => o.status === "paid").reduce((s, o) => s + o.totalAmount, 0) * 100,
        ) / 100,
        orders: hOrders.length,
      });
    }

    // 按包厢类型统计
    const typeMap = new Map<string, { count: number; inUse: number }>();
    rooms.forEach((r) => {
      const prev = typeMap.get(r.roomType) ?? { count: 0, inUse: 0 };
      prev.count++;
      if (r.status === "in_use") prev.inUse++;
      typeMap.set(r.roomType, prev);
    });

    return ok<KtvDashboardSummary>({
      totalRooms,
      idleRooms,
      inUseRooms,
      cleaningRooms,
      reservedRooms,
      todayRevenue: Math.round(todayRevenue * 100) / 100,
      todayOrders: todayOrders.length,
      todayCheckouts,
      pendingReservations,
      totalMembers,
      todayMemberRecharge: Math.round(todayMemberRecharge * 100) / 100,
      hourlyTrend,
      roomTypeStats: [...typeMap.entries()].map(([roomType, v]) => ({ roomType, ...v })),
    });
  } catch (e) {
    return ok<KtvDashboardSummary>({
      totalRooms: 0, idleRooms: 0, inUseRooms: 0, cleaningRooms: 0, reservedRooms: 0,
      todayRevenue: 0, todayOrders: 0, todayCheckouts: 0, pendingReservations: 0,
      totalMembers: 0, todayMemberRecharge: 0, hourlyTrend: [], roomTypeStats: [],
    });
  }
}
