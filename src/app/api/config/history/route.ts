// GET /api/config/history — 配置变更历史
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";
import type { ConfigHistoryInfo } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = Number(searchParams.get("storeId"));
    const configKey = searchParams.get("configKey");
    if (!storeId || !configKey) return fail("缺少 storeId 或 configKey");

    const history = await db.configHistory.findMany({
      where: { storeId, configKey },
      orderBy: { version: "desc" },
    });

    const result: ConfigHistoryInfo[] = history.map((h) => ({
      id: h.id,
      storeId: h.storeId,
      configKey: h.configKey,
      oldValue: h.oldValue,
      newValue: h.newValue,
      version: h.version,
      operator: h.operator,
      isRollback: h.isRollback,
      sourceVersion: h.sourceVersion,
      createdAt: h.createdAt.toISOString(),
    }));
    return ok(result);
  } catch (e) {
    return fail(parseError(e));
  }
}
