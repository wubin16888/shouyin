// GET/POST/PUT /api/sys/gift-rules — 赠送规则
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";
import type { GiftRuleInfo } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rules = await db.giftRule.findMany({
      where: { storeId: 1001 },
      orderBy: { createdAt: "desc" },
    });
    return ok<GiftRuleInfo[]>(
      rules.map((r) => ({
        id: r.id, name: r.name, condProductName: r.condProductName,
        condQty: r.condQty, cumulative: r.cumulative,
        giftProductName: r.giftProductName, giftQty: r.giftQty,
        deliveries: r.deliveries, timeLimit: r.timeLimit,
        startTime: r.startTime, endTime: r.endTime,
        roomLimit: r.roomLimit, roomTypes: r.roomTypes, enabled: r.enabled,
      })),
    );
  } catch (e) {
    return fail(parseError(e));
  }
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const r = await db.giftRule.create({
      data: {
        storeId: 1001,
        name: b.name,
        condProductId: b.condProductId ?? null,
        condProductName: b.condProductName,
        condQty: Number(b.condQty ?? 2),
        cumulative: !!b.cumulative,
        giftProductName: b.giftProductName,
        giftQty: Number(b.giftQty ?? 1),
        deliveries: b.deliveries ?? "[]",
        timeLimit: !!b.timeLimit,
        startTime: b.startTime ?? null,
        endTime: b.endTime ?? null,
        roomLimit: !!b.roomLimit,
        roomTypes: b.roomTypes ?? null,
        enabled: b.enabled !== false,
      },
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
    const r = await db.giftRule.update({ where: { id }, data: { ...data, enabled: data.enabled !== undefined ? !!data.enabled : undefined } });
    return ok({ id: r.id });
  } catch (e) {
    return fail(parseError(e));
  }
}
