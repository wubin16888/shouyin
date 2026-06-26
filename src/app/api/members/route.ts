// GET /api/members — 会员列表
import { db } from "@/lib/db";
import { ok, parseError, fail } from "@/lib/api-helpers";
import type { MemberInfo } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = Number(searchParams.get("storeId") ?? 1001);
    const keyword = searchParams.get("keyword");

    const where = {
      storeId,
      ...(keyword
        ? {
            OR: [
              { name: { contains: keyword } },
              { phone: { contains: keyword } },
              { cardNo: { contains: keyword } },
            ],
          }
        : {}),
    };

    const members = await db.member.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return ok<MemberInfo[]>(
      members.map((m) => ({
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
      })),
    );
  } catch (e) {
    return fail(parseError(e));
  }
}
