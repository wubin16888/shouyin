// GET/POST /api/sys/managers — 订房经理
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";
import type { BookingManagerInfo } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const mgrs = await db.bookingManager.findMany({
      where: { storeId: 1001 },
      orderBy: { createdAt: "desc" },
    });
    return ok<BookingManagerInfo[]>(
      mgrs.map((m) => ({
        id: m.id, name: m.name, phone: m.phone,
        commissionRate: m.commissionRate, status: m.status,
      })),
    );
  } catch (e) {
    return fail(parseError(e));
  }
}

export async function POST(req: Request) {
  try {
    const { name, phone, commissionRate } = await req.json();
    if (!name) return fail("缺少 name");
    const m = await db.bookingManager.create({
      data: { storeId: 1001, name, phone, commissionRate: Number(commissionRate ?? 0), status: 1 },
    });
    return ok({ id: m.id, name: m.name });
  } catch (e) {
    return fail(parseError(e));
  }
}
