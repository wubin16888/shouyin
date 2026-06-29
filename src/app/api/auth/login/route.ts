// POST /api/auth/login — 员工登录（三级权限：云管理员/门店管理员/门店员工）
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

// 门店员工角色对应可访问的模块 + 默认进入的模块
const ROLE_CONFIG: Record<string, { modules: string[]; default: string }> = {
  manager: { modules: ["cashier", "production", "finance"], default: "finance" },
  cashier: { modules: ["cashier", "members"], default: "cashier" },
  production: { modules: ["production"], default: "production" },
  marketing: { modules: ["cashier", "finance"], default: "cashier" },
};

// 门店管理员可访问的模块（本店全部业务，不含云端管理）
const STORE_ADMIN_MODULES = ["system", "cashier", "production", "finance", "members"];

// 云服务器管理员可访问的模块（云端管理 + 所有业务）
const CLOUD_ADMIN_MODULES = [
  "dashboard", "stores", "config", "sync", "reports", "audit",
  "system", "cashier", "production", "finance", "members",
];

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

    let finalModules: string[];
    let defaultModule: string;
    let userType: "cloud_admin" | "store_admin" | "employee";

    if (emp.role === "cloud_admin") {
      // 云服务器管理员：看所有门店 + 云端管理
      userType = "cloud_admin";
      finalModules = CLOUD_ADMIN_MODULES;
      defaultModule = "dashboard";
    } else if (emp.isStoreAdmin || emp.role === "admin") {
      // 门店管理员：看本店全部业务
      userType = "store_admin";
      finalModules = STORE_ADMIN_MODULES;
      defaultModule = "cashier";
    } else {
      // 门店员工：按角色看对应模块
      userType = "employee";
      const config = ROLE_CONFIG[emp.role] ?? ROLE_CONFIG.cashier;
      finalModules = config.modules;
      defaultModule = config.default;
    }

    return ok({
      employee: {
        id: emp.id, name: emp.name, username: emp.username,
        role: emp.role, position: emp.position, isStoreAdmin: emp.isStoreAdmin,
        userType,
        storeId: emp.storeId, storeName: emp.store?.storeName,
        discount: emp.discount,
      },
      modules: finalModules,
      defaultModule,
      token: `emp_${emp.id}_${Date.now()}`,
    });
  } catch (e) {
    return fail(parseError(e));
  }
}
