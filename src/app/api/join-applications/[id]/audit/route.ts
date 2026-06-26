// POST /api/join-applications/[id]/audit — 审核入职申请
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { status, auditRemark, auditedBy, position, role } = await req.json();
    if (!["approved", "rejected"].includes(status))
      return fail("status 必须为 approved 或 rejected");

    const app = await db.joinApplication.findUnique({ where: { id } });
    if (!app) return fail("申请不存在");
    if (app.status !== "pending") return fail("申请已处理");

    let createdEmployeeId: string | undefined;
    let username: string | undefined;
    let password: string | undefined;

    if (status === "approved") {
      // 生成员工账号
      const empCount = await db.employee.count({ where: { storeId: app.storeId } });
      username = `emp${app.storeId}_${empCount + 1}`;
      password = app.phone.slice(-6); // 默认密码=手机后6位

      const emp = await db.employee.create({
        data: {
          storeId: app.storeId, name: app.name, phone: app.phone,
          position: position ?? app.position,
          role: role ?? app.role,
          status: 1, username, password, isStoreAdmin: false,
          resetMonth: new Date().getMonth() + 1,
        },
      });
      createdEmployeeId = emp.id;
    }

    const updated = await db.joinApplication.update({
      where: { id },
      data: {
        status, auditRemark: auditRemark ?? null,
        auditedBy: auditedBy ?? "admin",
        auditedAt: new Date(),
        createdEmployeeId,
      },
    });

    return ok({
      id: updated.id, status: updated.status,
      createdEmployeeId, username, password,
    });
  } catch (e) {
    return fail(parseError(e));
  }
}
