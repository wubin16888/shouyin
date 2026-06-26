// GET/POST /api/sys/themes — 主题模板市场
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";
import type { ThemeTemplateInfo } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const themes = await db.themeTemplate.findMany({
      where: type ? { type } : undefined,
      orderBy: { useCount: "desc" },
    });
    return ok<ThemeTemplateInfo[]>(
      themes.map((t) => ({
        id: t.id, type: t.type, name: t.name, description: t.description,
        thumbnail: t.thumbnail, content: t.content, isOfficial: t.isOfficial,
        useCount: t.useCount, createdAt: t.createdAt.toISOString(),
      })),
    );
  } catch (e) {
    return fail(parseError(e));
  }
}

export async function POST(req: Request) {
  try {
    const { type, name, description, content } = await req.json();
    const t = await db.themeTemplate.create({
      data: { type, name, description, content, isOfficial: false, useCount: 0 },
    });
    return ok({ id: t.id });
  } catch (e) {
    return fail(parseError(e));
  }
}
