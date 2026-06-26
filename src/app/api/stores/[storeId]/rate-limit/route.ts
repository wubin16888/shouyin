// GET/PUT /api/stores/[storeId]/rate-limit — 限流配置
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";
import type { RateLimitInfo } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const { storeId } = await params;
    const rl = await db.storeRateLimit.findUnique({
      where: { storeId: Number(storeId) },
    });
    if (!rl) return fail("未找到限流配置");
    return ok<RateLimitInfo>({
      storeId: rl.storeId,
      readPerSec: rl.readPerSec,
      writePerSec: rl.writePerSec,
      syncPerSec: rl.syncPerSec,
      authPerSec: rl.authPerSec,
      burstAllowance: rl.burstAllowance,
      enabled: rl.enabled,
    });
  } catch (e) {
    return fail(parseError(e));
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const { storeId } = await params;
    const body = await req.json();
    const data: Record<string, unknown> = {};
    for (const k of ["readPerSec", "writePerSec", "syncPerSec", "authPerSec", "burstAllowance"]) {
      if (body[k] !== undefined) data[k] = Number(body[k]);
    }
    if (body.enabled !== undefined) data.enabled = Boolean(body.enabled);

    const rl = await db.storeRateLimit.upsert({
      where: { storeId: Number(storeId) },
      update: data,
      create: {
        storeId: Number(storeId),
        readPerSec: Number(data.readPerSec ?? 50),
        writePerSec: Number(data.writePerSec ?? 20),
        syncPerSec: Number(data.syncPerSec ?? 10),
        authPerSec: Number(data.authPerSec ?? 5),
        burstAllowance: Number(data.burstAllowance ?? 3),
        enabled: Boolean(data.enabled ?? true),
      },
    });

    await db.auditLog.create({
      data: {
        storeId: Number(storeId),
        userName: "admin",
        operationType: "config.update",
        resourceType: "rate_limit",
        resourceId: String(storeId),
        changes: JSON.stringify(data),
        status: "success",
      },
    });

    return ok<RateLimitInfo>({
      storeId: rl.storeId,
      readPerSec: rl.readPerSec,
      writePerSec: rl.writePerSec,
      syncPerSec: rl.syncPerSec,
      authPerSec: rl.authPerSec,
      burstAllowance: rl.burstAllowance,
      enabled: rl.enabled,
    });
  } catch (e) {
    return fail(parseError(e));
  }
}
