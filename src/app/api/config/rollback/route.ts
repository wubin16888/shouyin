// POST /api/config/rollback — 回滚配置到历史版本
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";
import type { StoreConfigInfo } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { historyId } = await req.json();
    if (!historyId) return fail("缺少 historyId");

    const hist = await db.configHistory.findUnique({ where: { id: historyId } });
    if (!hist) return fail("历史记录不存在");

    const config = await db.storeConfig.findUnique({
      where: { storeId_configKey: { storeId: hist.storeId, configKey: hist.configKey } },
    });
    if (!config) return fail("配置项不存在");

    const newVersion = config.version + 1;
    const rolledBackValue = hist.oldValue ?? hist.newValue;

    const updated = await db.storeConfig.update({
      where: { storeId_configKey: { storeId: hist.storeId, configKey: hist.configKey } },
      data: { configValue: rolledBackValue, version: newVersion },
    });

    await db.configHistory.create({
      data: {
        storeId: hist.storeId,
        configKey: hist.configKey,
        oldValue: config.configValue,
        newValue: rolledBackValue,
        version: newVersion,
        operator: "admin",
        isRollback: true,
        sourceVersion: hist.version,
      },
    });

    await db.auditLog.create({
      data: {
        storeId: hist.storeId,
        userName: "admin",
        operationType: "config.update",
        resourceType: "config",
        resourceId: hist.configKey,
        changes: JSON.stringify({
          rollback: true,
          from: config.configValue,
          to: rolledBackValue,
          sourceVersion: hist.version,
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
