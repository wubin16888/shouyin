// GET/POST /api/join-applications — 入职申请列表 / 提交
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = Number(searchParams.get("storeId"));
    const status = searchParams.get("status");
    if (!storeId) return fail("缺少 storeId");
    const list = await db.joinApplication.findMany({
      where: { storeId, ...(status ? { status } : {}) },
      orderBy: { createdAt: "desc" },
    });
    return ok(list.map((a) => ({
      id: a.id, storeId: a.storeId, name: a.name, phone: a.phone,
      position: a.position, role: a.role, idCard: a.idCard,
      emergencyContact: a.emergencyContact, emergencyPhone: a.emergencyPhone,
      joinCode: a.joinCode, status: a.status,
      createdEmployeeId: a.createdEmployeeId, auditRemark: a.auditRemark,
      auditedBy: a.auditedBy, auditedAt: a.auditedAt?.toISOString() ?? null,
      createdAt: a.createdAt.toISOString(),
    })));
  } catch (e) {
    return fail(parseError(e));
  }
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    if (!b.storeId || !b.name || !b.phone || !b.joinCode)
      return fail("缺少必填字段");
    const a = await db.joinApplication.create({
      data: {
        storeId: Number(b.storeId), name: b.name, phone: b.phone,
        position: b.position ?? "waiter", role: b.role ?? "cashier",
        idCard: b.idCard ?? null,
        emergencyContact: b.emergencyContact ?? null,
        emergencyPhone: b.emergencyPhone ?? null,
        joinCode: b.joinCode, status: "pending",
      },
    });
    return ok({ id: a.id, status: "pending" });
  } catch (e) {
    return fail(parseError(e));
  }
}
