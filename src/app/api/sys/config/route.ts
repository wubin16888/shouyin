// GET/PUT /api/sys/config — 系统配置读取与更新
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";
import type { SysConfigInfo } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const configs = await db.sysConfig.findMany({
      where: category ? { category } : undefined,
      orderBy: { category: "asc" },
    });
    return ok<SysConfigInfo[]>(
      configs.map((c) => ({
        id: c.id, storeId: c.storeId, configKey: c.configKey,
        configValue: c.configValue, category: c.category,
        description: c.description, updatedAt: c.updatedAt.toISOString(),
      })),
    );
  } catch (e) {
    return fail(parseError(e));
  }
}

export async function PUT(req: Request) {
  try {
    const { configKey, configValue } = await req.json();
    const updated = await db.sysConfig.update({
      where: { storeId_configKey: { storeId: 1001, configKey } },
      data: { configValue },
    });
    return ok<SysConfigInfo>({
      id: updated.id, storeId: updated.storeId, configKey: updated.configKey,
      configValue: updated.configValue, category: updated.category,
      description: updated.description, updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (e) {
    return fail(parseError(e));
  }
}
