// GET/PUT /api/config — 门店配置项
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";
import type { StoreConfigInfo } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = Number(searchParams.get("storeId"));
    if (!storeId) return fail("缺少 storeId");

    const configs = await db.storeConfig.findMany({
      where: { storeId },
      orderBy: { configKey: "asc" },
    });

    const result: StoreConfigInfo[] = configs.map((c) => ({
      id: c.id,
      storeId: c.storeId,
      configKey: c.configKey,
      configValue: c.configValue,
      valueType: c.valueType as StoreConfigInfo["valueType"],
      description: c.description,
      version: c.version,
      updatedAt: c.updatedAt.toISOString(),
    }));
    return ok(result);
  } catch (e) {
    return fail(parseError(e));
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const storeId = Number(body.storeId);
    const configKey = String(body.configKey);
    const configValue = String(body.configValue);
    const operator = String(body.operator ?? "admin");
    if (!storeId || !configKey) return fail("缺少 storeId 或 configKey");

    const existing = await db.storeConfig.findUnique({
      where: { storeId_configKey: { storeId, configKey } },
    });
    if (!existing) return fail("配置项不存在");

    const oldVersion = existing.version;
    const newVersion = oldVersion + 1;

    const updated = await db.storeConfig.update({
      where: { storeId_configKey: { storeId, configKey } },
      data: { configValue, version: newVersion },
    });

    await db.configHistory.create({
      data: {
        storeId,
        configKey,
        oldValue: existing.configValue,
        newValue: configValue,
        version: newVersion,
        operator,
        isRollback: false,
      },
    });

    await db.auditLog.create({
      data: {
        storeId,
        userName: operator,
        operationType: "config.update",
        resourceType: "config",
        resourceId: configKey,
        changes: JSON.stringify({
          from: existing.configValue,
          to: configValue,
          version: { from: oldVersion, to: newVersion },
        }),
        status: "success",
      },
    });

    return ok<StoreConfigInfo>({
      id: updated.id,
      storeId: updated.storeId,
      configKey: updated.configKey,
      configValue: updated.configValue,
      valueType: updated.valueType as StoreConfigInfo["valueType"],
      description: updated.description,
      version: updated.version,
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (e) {
    return fail(parseError(e));
  }
}
