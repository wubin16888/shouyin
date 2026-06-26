// GET/POST /api/ktv/reservations — 预订列表 / 新建预订
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";
import type { KtvReservationInfo } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);

    const reservations = await db.ktvReservation.findMany({
      where: status ? { status } : undefined,
      orderBy: { startAt: "asc" },
      take: limit,
    });

    return ok<KtvReservationInfo[]>(
      reservations.map((r) => ({
        id: r.id,
        storeId: r.storeId,
        roomId: r.roomId,
        roomNo: r.roomNo,
        customerName: r.customerName,
        phone: r.phone,
        partySize: r.partySize,
        startAt: r.startAt.toISOString(),
        endAt: r.endAt.toISOString(),
        status: r.status as KtvReservationInfo["status"],
        remark: r.remark,
        createdAt: r.createdAt.toISOString(),
      })),
    );
  } catch (e) {
    return fail(parseError(e));
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { customerName, phone, partySize, startAt, endAt, roomNo, remark } = body;
    if (!customerName || !phone || !startAt || !endAt)
      return fail("缺少必填字段");

    let roomId: string | null = null;
    if (roomNo) {
      const room = await db.ktvRoom.findUnique({
        where: { storeId_roomNo: { storeId: 1001, roomNo } },
      });
      if (room) roomId = room.id;
    }

    const r = await db.ktvReservation.create({
      data: {
        storeId: 1001,
        roomId,
        roomNo: roomNo ?? null,
        customerName,
        phone,
        partySize: Number(partySize ?? 4),
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        status: "pending",
        remark: remark ?? null,
      },
    });

    return ok<KtvReservationInfo>({
      id: r.id,
      storeId: r.storeId,
      roomId: r.roomId,
      roomNo: r.roomNo,
      customerName: r.customerName,
      phone: r.phone,
      partySize: r.partySize,
      startAt: r.startAt.toISOString(),
      endAt: r.endAt.toISOString(),
      status: "pending",
      remark: r.remark,
      createdAt: r.createdAt.toISOString(),
    });
  } catch (e) {
    return fail(parseError(e));
  }
}
