// GET/POST /api/store-applications — 门店申请列表 / 提交申请
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const list = await db.storeApplication.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
    });
    return ok(list.map((a) => ({
      id: a.id, storeName: a.storeName, contactName: a.contactName,
      phone: a.phone, region: a.region, address: a.address,
      licenseNo: a.licenseNo, businessType: a.businessType, remark: a.remark,
      status: a.status, auditRemark: a.auditRemark, createdStoreId: a.createdStoreId,
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
    if (!b.storeName || !b.contactName || !b.phone)
      return fail("缺少必填字段：门店名/联系人/电话");
    const a = await db.storeApplication.create({
      data: {
        storeName: b.storeName, contactName: b.contactName, phone: b.phone,
        region: b.region ?? null, address: b.address ?? null,
        licenseNo: b.licenseNo ?? null, businessType: b.businessType ?? "ktv",
        remark: b.remark ?? null, status: "pending",
      },
    });
    return ok({ id: a.id, status: "pending" });
  } catch (e) {
    return fail(parseError(e));
  }
}
