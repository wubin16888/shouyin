// GET /api/members/by-phone?phone=xxx — 按手机号查会员
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";
import type { MemberInfo } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");
    if (!phone) return fail("缺少 phone");

    const m = await db.member.findUnique({ where: { phone } });
    if (!m) return ok<MemberInfo | null>(null);

    return ok<MemberInfo>({
      id: m.id,
      storeId: m.storeId,
      cardNo: m.cardNo,
      name: m.name,
      phone: m.phone,
      level: m.level,
      balance: m.balance,
      points: m.points,
      totalSpent: m.totalSpent,
      discount: m.discount,
      status: m.status,
      createdAt: m.createdAt.toISOString(),
    });
  } catch (e) {
    return fail(parseError(e));
  }
}
