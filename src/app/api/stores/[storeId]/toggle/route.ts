// POST /api/stores/[storeId]/toggle — 切换门店启用状态
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const { storeId } = await params;
    const body = await req.json();
    const status = Number(body.status);
    if (![0, 1].includes(status)) return fail("status 必须为 0 或 1");

    const updated = await db.store.update({
      where: { storeId: Number(storeId) },
      data: { status },
    });

    await db.auditLog.create({
      data: {
        storeId: Number(storeId),
        userName: "admin",
        operationType: "store.toggle",
        resourceType: "store",
        resourceId: String(storeId),
        changes: JSON.stringify({ status: { from: 1 - status, to: status } }),
        status: "success",
      },
    });

    return ok({ storeId: updated.storeId, status: updated.status });
  } catch (e) {
    return fail(parseError(e));
  }
}
