import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";
import { INDUSTRY_TEMPLATES, type IndustryType } from "@/lib/industry";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const storeId = Number(new URL(req.url).searchParams.get("storeId") ?? req.headers.get("X-Store-Id") ?? 1001);
    const cfg = await db.sysConfig.findUnique({ where: { storeId_configKey: { storeId, configKey: "industry_template" } } });
    const type = (cfg?.configValue as IndustryType) ?? "ktv";
    const template = INDUSTRY_TEMPLATES[type] ?? INDUSTRY_TEMPLATES.ktv;
    return ok({ type, template, available: Object.values(INDUSTRY_TEMPLATES) });
  } catch (e) { return fail(parseError(e)); }
}

export async function POST(req: Request) {
  try {
    const { type, storeId } = await req.json();
    const sid = Number(storeId) || 1001;
    await db.sysConfig.upsert({
      where: { storeId_configKey: { storeId: sid, configKey: "industry_template" } },
      update: { configValue: type },
      create: { storeId: sid, configKey: "industry_template", configValue: type, category: "system", description: "行业模板" },
    });
    return ok({ type });
  } catch (e) { return fail(parseError(e)); }
}
