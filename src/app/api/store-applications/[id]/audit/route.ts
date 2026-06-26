// POST /api/store-applications/[id]/audit — 审批门店申请
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { status, auditRemark, auditedBy } = await req.json();
    if (!["approved", "rejected"].includes(status))
      return fail("status 必须为 approved 或 rejected");

    const app = await db.storeApplication.findUnique({ where: { id } });
    if (!app) return fail("申请不存在");
    if (app.status !== "pending") return fail("申请已处理");

    let createdStoreId: number | undefined;

    if (status === "approved") {
      // 生成新门店ID（取最大值+1）
      const maxStore = await db.store.findFirst({ orderBy: { storeId: "desc" } });
      const newStoreId = (maxStore?.storeId ?? 1000) + 1;

      // 创建门店
      const store = await db.store.create({
        data: {
          storeId: newStoreId,
          storeName: app.storeName,
          storeToken: `token_store_${newStoreId}_${Math.floor(Math.random() * 1000)}`,
          region: app.region ?? "未分类",
          status: 1,
          wsStatus: "offline",
        },
      });

      // 创建门店管理员账号（Employee，isStoreAdmin=true）
      const username = `admin${newStoreId}`;
      const password = `${app.phone.slice(-6)}`; // 默认密码=手机后6位
      await db.employee.create({
        data: {
          storeId: newStoreId,
          name: app.contactName,
          phone: app.phone,
          position: "manager",
          department: "管理层",
          role: "admin",
          discount: 0.8,
          status: 1,
          username,
          password,
          isStoreAdmin: true,
          resetMonth: new Date().getMonth() + 1,
        },
      });

      createdStoreId = newStoreId;

      await db.auditLog.create({
        data: {
          storeId: newStoreId,
          userName: auditedBy ?? "system",
          operationType: "store.toggle",
          resourceType: "store_application",
          resourceId: id,
          changes: JSON.stringify({ action: "approved", storeId: newStoreId, adminUsername: username }),
          status: "success",
        },
      });
    }

    const updated = await db.storeApplication.update({
      where: { id },
      data: {
        status,
        auditRemark: auditRemark ?? null,
        auditedBy: auditedBy ?? "system",
        auditedAt: new Date(),
        createdStoreId,
      },
    });

    return ok({
      id: updated.id,
      status: updated.status,
      createdStoreId,
      adminUsername: status === "approved" && createdStoreId ? `admin${createdStoreId}` : null,
      adminPassword: status === "approved" && app.phone ? app.phone.slice(-6) : null,
    });
  } catch (e) {
    return fail(parseError(e));
  }
}
