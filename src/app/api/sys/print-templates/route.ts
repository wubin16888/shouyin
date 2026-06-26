// GET/POST/PUT/DELETE /api/sys/print-templates — 打印模板 CRUD
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const list = await db.printTemplate.findMany({
      where: type ? { type } : undefined,
      orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
    });
    return ok(list.map((t) => ({
      id: t.id, type: t.type, name: t.name, width: t.width,
      config: t.config, enabled: t.enabled, isActive: t.isActive,
      createdAt: t.createdAt.toISOString(),
    })));
  } catch (e) {
    return fail(parseError(e));
  }
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const t = await db.printTemplate.create({
      data: { type: b.type, name: b.name, width: Number(b.width ?? 58),
        config: b.config ?? "{}", enabled: true, isActive: false },
    });
    return ok({ id: t.id });
  } catch (e) {
    return fail(parseError(e));
  }
}

export async function PUT(req: Request) {
  try {
    const { id, isActive, ...data } = await req.json();
    if (!id) return fail("缺少 id");
    if (data.width !== undefined) data.width = Number(data.width);
    // 如果设为 active，先把同类型的其他模板取消 active
    if (isActive) {
      const cur = await db.printTemplate.findUnique({ where: { id } });
      if (cur) {
        await db.printTemplate.updateMany({
          where: { type: cur.type, isActive: true },
          data: { isActive: false },
        });
      }
    }
    await db.printTemplate.update({ where: { id }, data: { ...data, isActive } });
    return ok({ id });
  } catch (e) {
    return fail(parseError(e));
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await db.printTemplate.delete({ where: { id } });
    return ok({ id });
  } catch (e) {
    return fail(parseError(e));
  }
}
