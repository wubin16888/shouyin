// POST /api/members/[id]/recharge — 会员充值
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";
import type { MemberTransactionInfo } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { amount, payMethod, remark } = await req.json();
    const amt = Number(amount);
    if (!amt || amt <= 0) return fail("充值金额必须大于 0");

    const member = await db.member.findUnique({ where: { id } });
    if (!member) return fail("会员不存在");
    if (member.status !== 1) return fail("会员已冻结");

    const newBalance = member.balance + amt;
    const newPoints = member.points + Math.floor(amt);

    const tx = await db.memberTransaction.create({
      data: {
        memberId: id,
        type: "recharge",
        amount: amt,
        pointsDelta: Math.floor(amt),
        balanceAfter: newBalance,
        payMethod: payMethod ?? "cash",
        remark: remark ?? "会员充值",
      },
    });

    await db.member.update({
      where: { id },
      data: { balance: newBalance, points: newPoints },
    });

    return ok<MemberTransactionInfo>({
      id: tx.id,
      memberId: tx.memberId,
      type: "recharge",
      amount: tx.amount,
      pointsDelta: tx.pointsDelta,
      balanceAfter: tx.balanceAfter,
      payMethod: tx.payMethod,
      remark: tx.remark,
      relatedOrderNo: tx.relatedOrderNo,
      createdAt: tx.createdAt.toISOString(),
    });
  } catch (e) {
    return fail(parseError(e));
  }
}
