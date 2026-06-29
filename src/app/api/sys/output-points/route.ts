// GET/POST/PUT /api/sys/output-points — 出品点设置
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const list = await db.outputPoint.findMany({
      where: { storeId: Number(new URL(req.url).searchParams.get("storeId") ?? req.headers.get("X-Store-Id") ?? 1001) },
      orderBy: { deptCode: "asc" },
    });
    return ok(list.map((o) => ({
      id: o.id, storeId: o.storeId, deptCode: o.deptCode, name: o.name,
      ip: o.ip, printMode: o.printMode, relayServer: o.relayServer,
      enabled: o.enabled, computerName: o.computerName,
    })));
  } catch (e) {
    return fail(parseError(e));
  }
}

export async function POST(req: Request) {
    const storeId = Number(req.headers.get("X-Store-Id") ?? 1001);
  try {
    const b = await req.json();
    const op = await db.outputPoint.create({
      data: { storeId, deptCode: b.deptCode, name: b.name, ip: b.ip ?? null,
        printMode: b.printMode ?? "client", relayServer: b.relayServer ?? null,
        computerName: b.computerName ?? null, enabled: b.enabled !== false },
    });
    return ok({ id: op.id });
  } catch (e) {
    return fail(parseError(e));
  }
}

export async function PUT(req: Request) {
  try {
    const { id, ...data } = await req.json();
    if (!id) return fail("缺少 id");
    await db.outputPoint.update({ where: { id }, data });
    return ok({ id });
  } catch (e) {
    return fail(parseError(e));
  }
}
