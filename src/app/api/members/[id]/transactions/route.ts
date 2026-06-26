// GET /api/members/[id]/transactions — 会员交易记录
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";
import type { MemberTransactionInfo } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const txs = await db.memberTransaction.findMany({
      where: { memberId: id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return ok<MemberTransactionInfo[]>(
      txs.map((t) => ({
        id: t.id,
        memberId: t.memberId,
        type: t.type as MemberTransactionInfo["type"],
        amount: t.amount,
        pointsDelta: t.pointsDelta,
        balanceAfter: t.balanceAfter,
        payMethod: t.payMethod,
        remark: t.remark,
        relatedOrderNo: t.relatedOrderNo,
        createdAt: t.createdAt.toISOString(),
      })),
    );
  } catch (e) {
    return fail(parseError(e));
  }
}
