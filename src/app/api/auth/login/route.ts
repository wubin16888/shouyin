// POST /api/auth/login — 员工登录
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

// 角色对应可访问的前端模块
const ROLE_MODULES: Record<string, string[]> = {
  admin: ["system", "cashier", "production", "finance", "members"],
  manager: ["cashier", "production", "finance"],
  cashier: ["cashier", "members"],
  production: ["production"],
  marketing: ["cashier", "finance"],
};

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) return fail("缺少用户名或密码");

    const emp = await db.employee.findUnique({
      where: { username },
      include: { store: { select: { storeName: true, storeId: true } } },
    });
    if (!emp) return fail("用户名不存在");
    if (emp.password !== password) return fail("密码错误");
    if (emp.status !== 1) return fail("账号已禁用，请联系管理员");

    const modules = ROLE_MODULES[emp.role] ?? ["cashier"];
    // 门店管理员有全部权限
    const finalModules = emp.isStoreAdmin
      ? ["system", "cashier", "production", "finance", "members"]
      : modules;

    return ok({
      employee: {
        id: emp.id, name: emp.name, username: emp.username,
        role: emp.role, position: emp.position, isStoreAdmin: emp.isStoreAdmin,
        storeId: emp.storeId, storeName: emp.store?.storeName,
        discount: emp.discount,
      },
      modules: finalModules,
      // 默认跳转的模块（第一个）
      defaultModule: finalModules[0],
      token: `emp_${emp.id}_${Date.now()}`, // 简单 token
    });
  } catch (e) {
    return fail(parseError(e));
  }
}
