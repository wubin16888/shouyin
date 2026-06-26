// GET/POST/PUT /api/sys/employees — 员工人事
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const list = await db.employee.findMany({
      where: { storeId: 1001 },
      orderBy: [{ status: "desc" }, { entryDate: "desc" }],
    });
    return ok(list.map((e) => ({
      id: e.id, name: e.name, phone: e.phone, position: e.position,
      department: e.department, role: e.role, discount: e.discount,
      monthlyGiftLimit: e.monthlyGiftLimit, usedGiftAmount: e.usedGiftAmount,
      resetMonth: e.resetMonth, status: e.status,
      entryDate: e.entryDate.toISOString(),
    })));
  } catch (e) {
    return fail(parseError(e));
  }
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const now = new Date();
    const e = await db.employee.create({
      data: { storeId: 1001, name: b.name, phone: b.phone ?? null,
        position: b.position ?? "waiter", department: b.department ?? null,
        role: b.role ?? "cashier", discount: Number(b.discount ?? 1),
        monthlyGiftLimit: Number(b.monthlyGiftLimit ?? 0), usedGiftAmount: 0,
        resetMonth: now.getMonth() + 1, status: 1 },
    });
    return ok({ id: e.id });
  } catch (e) {
    return fail(parseError(e));
  }
}

export async function PUT(req: Request) {
  try {
    const { id, ...data } = await req.json();
    if (!id) return fail("缺少 id");
    if (data.discount !== undefined) data.discount = Number(data.discount);
    if (data.monthlyGiftLimit !== undefined) data.monthlyGiftLimit = Number(data.monthlyGiftLimit);
    await db.employee.update({ where: { id }, data });
    return ok({ id });
  } catch (e) {
    return fail(parseError(e));
  }
}
