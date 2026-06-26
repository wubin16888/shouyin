// POST /api/sys/apply-theme — 应用主题模板（写入 SysConfig）
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { themeId } = await req.json();
    const theme = await db.themeTemplate.findUnique({ where: { id: themeId } });
    if (!theme) return fail("模板不存在");

    // 根据类型写入对应 SysConfig
    if (theme.type === "room_theme") {
      const content = JSON.parse(theme.content);
      const colors = content.colors;
      await db.sysConfig.upsert({
        where: { storeId_configKey: { storeId: 1001, configKey: "room_status_colors" } },
        update: { configValue: JSON.stringify(colors) },
        create: {
          storeId: 1001, configKey: "room_status_colors",
          configValue: JSON.stringify(colors), category: "room",
          description: "房态颜色配置",
        },
      });
    }
    // 其他类型模板的应用可扩展

    await db.themeTemplate.update({
      where: { id: themeId },
      data: { useCount: { increment: 1 } },
    });

    return ok({ applied: true, type: theme.type });
  } catch (e) {
    return fail(parseError(e));
  }
}
