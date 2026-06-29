// GET/POST/PUT/DELETE /api/sys/rooms-settings — 包厢设置 CRUD
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const rooms = await db.ktvRoom.findMany({
      where: { storeId: Number(new URL(req.url).searchParams.get("storeId") ?? req.headers.get("X-Store-Id") ?? 1001) },
      orderBy: [{ area: "asc" }, { roomNo: "asc" }],
    });
    return ok(rooms.map((r) => ({
      id: r.id, roomNo: r.roomNo, roomName: r.roomName, roomType: r.roomType,
      area: r.area, capacity: r.capacity, hourlyRate: r.hourlyRate,
      minSpend: r.minSpend, billingMode: r.billingMode, packageId: r.packageId,
      roomIp: r.roomIp, status: r.status,
    })));
  } catch (e) {
    return fail(parseError(e));
  }
}

export async function POST(req: Request) {
    const storeId = Number(req.headers.get("X-Store-Id") ?? 1001);
  try {
    const b = await req.json();
    const r = await db.ktvRoom.create({
      data: { storeId, roomNo: b.roomNo, roomName: b.roomName ?? b.roomNo,
        roomType: b.roomType ?? "中包", area: b.area ?? null,
        capacity: Number(b.capacity ?? 6), hourlyRate: Number(b.hourlyRate ?? 38),
        minSpend: Number(b.minSpend ?? 0), billingMode: b.billingMode ?? "hourly",
        packageId: b.billingMode === "package" ? (b.packageId ?? null) : null,
        roomIp: b.roomIp ?? null, status: "idle" },
    });
    return ok({ id: r.id });
  } catch (e) {
    return fail(parseError(e));
  }
}

export async function PUT(req: Request) {
  try {
    const { id, ...data } = await req.json();
    if (!id) return fail("缺少 id");
    for (const k of ["capacity", "hourlyRate", "minSpend"]) {
      if (data[k] !== undefined) data[k] = Number(data[k]);
    }
    await db.ktvRoom.update({ where: { id }, data });
    return ok({ id });
  } catch (e) {
    return fail(parseError(e));
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return fail("缺少 id");
    await db.ktvRoom.delete({ where: { id } });
    return ok({ id });
  } catch (e) {
    return fail(parseError(e));
  }
}
