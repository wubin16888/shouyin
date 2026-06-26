// 云边协同 POS 系统 — 种子数据脚本
// 运行: bun run db:seed

import { db } from "../src/lib/db";

const STORES = [
  { storeId: 1001, storeName: "北京中关村店", region: "华北", wsStatus: "online" },
  { storeId: 1002, storeName: "上海浦东店", region: "华东", wsStatus: "online" },
  { storeId: 1003, storeName: "深圳福田店", region: "华南", wsStatus: "offline" },
  { storeId: 1004, storeName: "广州天河店", region: "华南", wsStatus: "online" },
  { storeId: 1005, storeName: "杭州西湖店", region: "华东", wsStatus: "offline" },
  { storeId: 1006, storeName: "成都春熙路店", region: "西南", wsStatus: "online" },
];

const CONFIG_KEYS = [
  { key: "module_pos_enabled", value: "true", type: "boolean", desc: "POS 收银模块" },
  { key: "module_room_enabled", value: "true", type: "boolean", desc: "客房管理模块" },
  { key: "module_member_enabled", value: "true", type: "boolean", desc: "会员系统模块" },
  { key: "business_hours", value: '{"open":"09:00","close":"22:00"}', type: "json", desc: "营业时间" },
  { key: "tax_rate", value: "0.06", type: "number", desc: "税率" },
  { key: "print_template_id", value: "tpl_default_v2", type: "string", desc: "打印模板" },
  { key: "sync_interval_sec", value: "10", type: "number", desc: "数据同步间隔(秒)" },
  { key: "offline_mode_enabled", value: "true", type: "boolean", desc: "离线模式开关" },
];

const DISHES = [
  { name: "招牌宫保鸡丁", category: "热菜", price: 38 },
  { name: "水煮鱼片", category: "热菜", price: 58 },
  { name: "麻婆豆腐", category: "热菜", price: 22 },
  { name: "回锅肉", category: "热菜", price: 42 },
  { name: "鱼香肉丝", category: "热菜", price: 32 },
  { name: "凉拌黄瓜", category: "凉菜", price: 12 },
  { name: "口水鸡", category: "凉菜", price: 28 },
  { name: "皮蛋豆腐", category: "凉菜", price: 14 },
  { name: "米饭", category: "主食", price: 2 },
  { name: "蛋炒饭", category: "主食", price: 12 },
  { name: "担担面", category: "主食", price: 18 },
  { name: "酸梅汤", category: "饮品", price: 8 },
  { name: "鲜榨橙汁", category: "饮品", price: 15 },
  { name: "青岛啤酒", category: "饮品", price: 10 },
  { name: "红豆双皮奶", category: "甜品", price: 16 },
  { name: "杨枝甘露", category: "甜品", price: 18 },
];

const AUDIT_OPS = [
  "config.update", "order.create", "order.refund", "store.toggle",
  "user.login", "user.logout", "member.recharge", "dish.update", "sync.resolve",
];

const PAY_METHODS = ["cash", "wechat", "alipay", "member", "card"];

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[rand(0, arr.length - 1)];
}

async function main() {
  console.log("🌱 开始种子数据...");

  // 清空
  await db.$transaction([
    db.dish.deleteMany(),
    db.chainReportDaily.deleteMany(),
    db.websocketEvent.deleteMany(),
    db.auditLog.deleteMany(),
    db.syncConflict.deleteMany(),
    db.syncLog.deleteMany(),
    db.order.deleteMany(),
    db.storeRateLimit.deleteMany(),
    db.configHistory.deleteMany(),
    db.storeConfig.deleteMany(),
    db.store.deleteMany(),
  ]);

  // 1. 门店
  const now = new Date();
  for (const s of STORES) {
    const lastConn = s.wsStatus === "online"
      ? new Date(now.getTime() - rand(60, 7200) * 1000)
      : new Date(now.getTime() - rand(5, 60) * 60 * 1000);
    await db.store.create({
      data: {
        storeId: s.storeId,
        storeName: s.storeName,
        storeToken: `token_store_${s.storeId}_${rand(100, 999)}`,
        region: s.region,
        status: 1,
        wsStatus: s.wsStatus,
        lastConnectedAt: lastConn,
      },
    });
  }
  console.log(`✅ 门店 ${STORES.length} 条`);

  // 2. 配置项 + 历史
  for (const s of STORES) {
    for (const ck of CONFIG_KEYS) {
      const version = rand(1, 5);
      await db.storeConfig.create({
        data: {
          storeId: s.storeId,
          configKey: ck.key,
          configValue: ck.value,
          valueType: ck.type,
          description: ck.desc,
          version,
        },
      });
      // 配置历史
      for (let v = 1; v <= version; v++) {
        await db.configHistory.create({
          data: {
            storeId: s.storeId,
            configKey: ck.key,
            oldValue: v > 1 ? JSON.stringify({ value: ck.value, v: v - 1 }) : null,
            newValue: JSON.stringify({ value: ck.value, v }),
            version: v,
            operator: pick(["admin", "manager_zhang", "manager_li", "root"]),
            isRollback: Math.random() < 0.1,
            sourceVersion: Math.random() < 0.1 ? v - 2 : null,
            createdAt: new Date(now.getTime() - (version - v) * 86400000 - rand(0, 3600) * 1000),
          },
        });
      }
    }
  }
  console.log(`✅ 配置项 ${STORES.length * CONFIG_KEYS.length} 条 + 历史`);

  // 3. 限流配置
  for (const s of STORES) {
    await db.storeRateLimit.create({
      data: {
        storeId: s.storeId,
        readPerSec: pick([30, 50, 80, 100]),
        writePerSec: pick([15, 20, 30]),
        syncPerSec: pick([5, 10, 15]),
        authPerSec: pick([3, 5, 8]),
        burstAllowance: pick([3, 5, 10]),
        enabled: s.storeId !== 1003,
      },
    });
  }
  console.log(`✅ 限流配置 ${STORES.length} 条`);

  // 4. 订单（每个门店最近 7 天，每天 20~60 单）
  let orderSeq = 100000;
  for (const s of STORES) {
    for (let d = 6; d >= 0; d--) {
      const dayOrders = rand(20, 60);
      for (let i = 0; i < dayOrders; i++) {
        const createdAt = new Date(now.getTime() - d * 86400000 - rand(0, 86400) * 1000);
        const itemCount = rand(1, 8);
        const totalAmount = Math.round(itemCount * pick([12, 18, 25, 32, 45, 58]) * 100) / 100;
        const status = Math.random() < 0.85 ? 2 : (Math.random() < 0.7 ? 1 : 3);
        await db.order.create({
          data: {
            orderId: ++orderSeq,
            storeId: s.storeId,
            orderNo: `ORD-${s.storeId}-${createdAt.getFullYear()}${String(createdAt.getMonth() + 1).padStart(2, "0")}${String(createdAt.getDate()).padStart(2, "0")}-${String(i).padStart(4, "0")}`,
            totalAmount,
            status,
            payMethod: pick(PAY_METHODS),
            itemCount,
            syncVersion: rand(1, 10),
            items: JSON.stringify(Array.from({ length: itemCount }, (_, k) => ({
              name: pick(DISHES).name,
              qty: rand(1, 3),
              price: pick([12, 18, 22, 28, 32, 38, 42, 58]),
            }))),
            createdAt,
            updatedAt: createdAt,
          },
        });
      }
    }
  }
  console.log(`✅ 订单生成完毕`);

  // 5. 同步日志
  for (const s of STORES) {
    for (let i = 0; i < 40; i++) {
      const startedAt = new Date(now.getTime() - rand(0, 86400 * 3) * 1000);
      const failed = Math.random() < 0.08;
      await db.syncLog.create({
        data: {
          storeId: s.storeId,
          syncType: pick(["order", "config", "member"]),
          status: failed ? "failed" : "success",
          recordCount: rand(1, 50),
          durationMs: rand(50, 3000),
          errorMessage: failed ? pick(["连接超时", "数据校验失败", "版本冲突", "云端 500"]) : null,
          startedAt,
          completedAt: failed ? null : new Date(startedAt.getTime() + rand(50, 3000)),
        },
      });
    }
  }
  console.log(`✅ 同步日志 ${STORES.length * 40} 条`);

  // 6. 同步冲突
  for (const s of STORES) {
    const cnt = rand(2, 6);
    for (let i = 0; i < cnt; i++) {
      const resolved = Math.random() < 0.4;
      await db.syncConflict.create({
        data: {
          storeId: s.storeId,
          orderId: rand(100000, 999999),
          localVersion: rand(5, 20),
          cloudVersion: rand(5, 20),
          localData: JSON.stringify({ totalAmount: rand(100, 500), status: 2 }),
          cloudData: JSON.stringify({ totalAmount: rand(100, 500), status: 2 }),
          conflictReason: pick(["版本号不一致", "金额字段冲突", "状态字段冲突", "并发更新"]),
          resolveStatus: resolved ? "resolved" : "pending",
          resolveMethod: resolved ? pick(["local_wins", "cloud_wins", "merge"]) : null,
          retryCount: rand(0, 3),
          createdAt: new Date(now.getTime() - rand(0, 86400 * 2) * 1000),
          resolvedAt: resolved ? new Date(now.getTime() - rand(0, 3600) * 1000) : null,
        },
      });
    }
  }
  console.log(`✅ 同步冲突生成完毕`);

  // 7. 审计日志
  for (const s of STORES) {
    for (let i = 0; i < 50; i++) {
      await db.auditLog.create({
        data: {
          storeId: s.storeId,
          userName: pick(["admin", "manager_zhang", "manager_li", "cashier_wang", "root", "system"]),
          operationType: pick(AUDIT_OPS),
          resourceType: pick(["config", "order", "store", "user", "member", "dish"]),
          resourceId: String(rand(1, 1000)),
          changes: JSON.stringify({ field: pick(["status", "price", "name", "hours"]), from: "A", to: "B" }),
          status: Math.random() < 0.95 ? "success" : "failed",
          ipAddress: `192.168.${rand(1, 50)}.${rand(2, 254)}`,
          createdAt: new Date(now.getTime() - rand(0, 86400 * 3) * 1000),
        },
      });
    }
  }
  console.log(`✅ 审计日志 ${STORES.length * 50} 条`);

  // 8. WebSocket 事件
  for (const s of STORES) {
    for (let i = 0; i < 20; i++) {
      await db.websocketEvent.create({
        data: {
          storeId: s.storeId,
          eventType: pick(["connect", "disconnect", "reconnect"]),
          clientIp: `192.168.${rand(1, 50)}.${rand(2, 254)}`,
          sessionDuration: rand(60, 28800),
          pendingMessages: rand(0, 15),
          reason: Math.random() < 0.3 ? pick(["网络超时", "服务重启", "心跳丢失", "正常关闭"]) : null,
          createdAt: new Date(now.getTime() - rand(0, 86400 * 2) * 1000),
        },
      });
    }
  }
  console.log(`✅ WebSocket 事件 ${STORES.length * 20} 条`);

  // 9. 连锁日报（最近 7 天 × 6 门店）
  for (let d = 6; d >= 0; d--) {
    const date = new Date(now.getTime() - d * 86400000);
    date.setHours(0, 0, 0, 0);
    for (const s of STORES) {
      const totalOrders = rand(20, 60);
      const totalRevenue = Math.round(totalOrders * rand(80, 200) * 100) / 100;
      await db.chainReportDaily.create({
        data: {
          reportDate: date,
          storeId: s.storeId,
          totalOrders,
          totalRevenue,
          avgOrderValue: Math.round((totalRevenue / totalOrders) * 100) / 100,
          totalRefunds: rand(0, 3),
          totalDiscountAmount: Math.round(totalRevenue * 0.05 * 100) / 100,
          memberCardPayments: rand(5, 20),
          memberCardAmount: Math.round(totalRevenue * 0.3 * 100) / 100,
        },
      });
    }
  }
  console.log(`✅ 连锁日报 ${7 * STORES.length} 条`);

  // 10. 菜品
  for (const dish of DISHES) {
    await db.dish.create({
      data: {
        storeId: 1001,
        name: dish.name,
        category: dish.category,
        price: dish.price,
        status: Math.random() < 0.9 ? 1 : 0,
      },
    });
  }
  console.log(`✅ 菜品 ${DISHES.length} 条`);

  console.log("\n🎉 种子数据完成！");
  console.log(`   门店: ${STORES.length} | 菜品: ${DISHES.length} | 配置项: ${STORES.length * CONFIG_KEYS.length}`);
  console.log(`   在线门店: ${STORES.filter(s => s.wsStatus === "online").length} | 离线门店: ${STORES.filter(s => s.wsStatus === "offline").length}`);
}

main()
  .catch((e) => {
    console.error("❌ 种子失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
