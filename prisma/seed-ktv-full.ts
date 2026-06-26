// KTV 系统完整种子数据（动态配置版）
import { db } from "../src/lib/db";

const STORE_ID = 1001;

// ============ 系统配置默认值 ============
const SYS_CONFIGS = [
  // 系统参数
  { key: "currency_symbol", value: "¥", category: "system", desc: "货币符号（¥/$）" },
  { key: "store_name", value: "天娱 KTV 旗舰店", category: "system", desc: "门店名称" },
  { key: "business_hours", value: JSON.stringify({ open: "18:00", close: "02:00" }), category: "system", desc: "营业时间" },
  { key: "tax_rate", value: "0", category: "system", desc: "税率" },
  { key: "service_charge", value: "0.1", category: "system", desc: "服务费率(10%)" },
  { key: "round_mode", value: "元", category: "system", desc: "抹零方式（元/角/不抹）" },
  // 房态颜色（一状态一色）
  { key: "room_status_colors", value: JSON.stringify({
    idle: "#10b981",        // 空闲-绿
    reserved: "#3b82f6",    // 预订-蓝
    seated: "#f59e0b",      // 带位-黄
    in_use: "#ef4444",      // 已开房-红
    cleaning: "#a855f7",    // 清扫-紫
    maintenance: "#6b7280", // 维修-灰
  }), category: "room", desc: "房态颜色配置" },
  // 房态显示字段（收银台勾选）
  { key: "room_display_fields", value: JSON.stringify({
    roomNo: true, roomName: true, roomType: true, area: false,
    bookingManager: true, customerName: true, customerCount: true,
    consume: true, openedAt: true, duration: true,
  }), category: "display", desc: "房态显示字段（可勾选）" },
  // 出品参数
  { key: "output_mode", value: "auto", category: "system", desc: "出品模式：auto自动/ manual手动" },
  { key: "output_print_count", value: "2", category: "system", desc: "出品单打印次数" },
  // 点单参数
  { key: "order_gift_enabled", value: "true", category: "system", desc: "启用自动赠送" },
  { key: "order_flavor_required", value: "true", category: "system", desc: "必选口味强制弹出" },
];

// ============ 菜品大类 ============
const CATEGORIES = [
  { name: "酒水", sortOrder: 1, subs: ["常温", "冰镇"] },
  { name: "饮料", sortOrder: 2, subs: ["常温", "冰镇"] },
  { name: "零食", sortOrder: 3, subs: [] },
  { name: "水果", sortOrder: 4, subs: [] },
  { name: "热菜", sortOrder: 5, subs: ["微辣", "中辣", "特辣"] },
  { name: "凉菜", sortOrder: 6, subs: [] },
  { name: "主食", sortOrder: 7, subs: [] },
  { name: "套餐", sortOrder: 8, subs: [] },
];

// ============ 口味分类 ============
const FLAVOR_CATEGORIES = [
  { name: "酒水温度", required: false, flavors: ["常温", "冰镇"] },
  { name: "辣度", required: false, flavors: ["不辣", "微辣", "中辣", "特辣"] },
  { name: "甜度", required: false, flavors: ["全糖", "半糖", "少糖", "无糖"] },
];

// ============ 商品（含出品部门、口味绑定） ============
const PRODUCTS = [
  // 酒水 -> 吧台，绑酒水温度
  { name: "青岛啤酒", cat: "酒水", sub: "冰镇", price: 15, cost: 6, stock: 120, dept: "bar", flavors: ["酒水温度"] },
  { name: "百威啤酒", cat: "酒水", sub: "冰镇", price: 20, cost: 9, stock: 80, dept: "bar", flavors: ["酒水温度"] },
  { name: "科罗娜", cat: "酒水", sub: "冰镇", price: 25, cost: 12, stock: 60, dept: "bar", flavors: ["酒水温度"] },
  { name: "芝华士 12年", cat: "酒水", sub: "常温", price: 580, cost: 320, stock: 25, dept: "bar", flavors: ["酒水温度"] },
  { name: "轩尼诗 VSOP", cat: "酒水", sub: "常温", price: 680, cost: 380, stock: 18, dept: "bar", flavors: ["酒水温度"] },
  { name: "杰克丹尼", cat: "酒水", sub: "常温", price: 480, cost: 260, stock: 22, dept: "bar", flavors: ["酒水温度"] },
  { name: "黑方威士忌", cat: "酒水", sub: "常温", price: 520, cost: 280, stock: 20, dept: "bar", flavors: ["酒水温度"] },
  { name: "二锅头", cat: "酒水", sub: "常温", price: 18, cost: 6, stock: 100, dept: "bar", flavors: ["酒水温度"] },
  // 饮料 -> 吧台
  { name: "可乐", cat: "饮料", sub: "冰镇", price: 8, cost: 2, stock: 200, dept: "bar", flavors: ["酒水温度"] },
  { name: "雪碧", cat: "饮料", sub: "冰镇", price: 8, cost: 2, stock: 180, dept: "bar", flavors: ["酒水温度"] },
  { name: "橙汁", cat: "饮料", sub: "常温", price: 12, cost: 4, stock: 100, dept: "bar", flavors: [] },
  { name: "酸梅汤", cat: "饮料", sub: "冰镇", price: 10, cost: 3, stock: 120, dept: "bar", flavors: [] },
  { name: "矿泉水", cat: "饮料", sub: "常温", price: 5, cost: 1, stock: 300, dept: "bar", flavors: [] },
  // 零食 -> 吧台
  { name: "瓜子", cat: "零食", sub: null, price: 12, cost: 4, stock: 80, dept: "bar", flavors: [] },
  { name: "花生", cat: "零食", sub: null, price: 12, cost: 4, stock: 80, dept: "bar", flavors: [] },
  { name: "薯片", cat: "零食", sub: null, price: 15, cost: 5, stock: 60, dept: "bar", flavors: [] },
  { name: "鱿鱼丝", cat: "零食", sub: null, price: 18, cost: 7, stock: 50, dept: "bar", flavors: [] },
  { name: "牛肉干", cat: "零食", sub: null, price: 25, cost: 12, stock: 40, dept: "bar", flavors: [] },
  // 水果 -> 水果房
  { name: "水果拼盘（小）", cat: "水果", sub: null, price: 38, cost: 18, stock: 30, dept: "fruit", flavors: [] },
  { name: "水果拼盘（大）", cat: "水果", sub: null, price: 68, cost: 32, stock: 25, dept: "fruit", flavors: [] },
  { name: "西瓜碟", cat: "水果", sub: null, price: 28, cost: 12, stock: 35, dept: "fruit", flavors: [] },
  // 热菜 -> 厨房，绑辣度
  { name: "宫保鸡丁", cat: "热菜", sub: "微辣", price: 38, cost: 15, stock: 999, dept: "kitchen", flavors: ["辣度"] },
  { name: "水煮鱼片", cat: "热菜", sub: "中辣", price: 58, cost: 25, stock: 999, dept: "kitchen", flavors: ["辣度"] },
  { name: "麻婆豆腐", cat: "热菜", sub: "中辣", price: 22, cost: 8, stock: 999, dept: "kitchen", flavors: ["辣度"] },
  { name: "回锅肉", cat: "热菜", sub: "微辣", price: 42, cost: 18, stock: 999, dept: "kitchen", flavors: ["辣度"] },
  // 凉菜 -> 厨房
  { name: "凉拌黄瓜", cat: "凉菜", sub: null, price: 12, cost: 4, stock: 999, dept: "kitchen", flavors: [] },
  { name: "口水鸡", cat: "凉菜", sub: null, price: 28, cost: 12, stock: 999, dept: "kitchen", flavors: ["辣度"] },
  { name: "皮蛋豆腐", cat: "凉菜", sub: null, price: 14, cost: 5, stock: 999, dept: "kitchen", flavors: [] },
  // 主食 -> 厨房
  { name: "米饭", cat: "主食", sub: null, price: 2, cost: 0.5, stock: 999, dept: "kitchen", flavors: [] },
  { name: "蛋炒饭", cat: "主食", sub: null, price: 12, cost: 5, stock: 999, dept: "kitchen", flavors: [] },
  { name: "担担面", cat: "主食", sub: null, price: 18, cost: 7, stock: 999, dept: "kitchen", flavors: ["辣度"] },
  // 套餐
  { name: "欢唱 2 小时套餐（中包）", cat: "套餐", sub: null, price: 188, cost: 80, stock: 999, dept: "bar", flavors: [], isPackage: true },
  { name: "欢唱 3 小时套餐（大包）", cat: "套餐", sub: null, price: 388, cost: 180, stock: 999, dept: "bar", flavors: [], isPackage: true },
  { name: "酒水畅饮套餐（6人）", cat: "套餐", sub: null, price: 588, cost: 280, stock: 999, dept: "bar", flavors: [], isPackage: true },
  { name: "VIP 尊享套餐", cat: "套餐", sub: null, price: 1288, cost: 600, stock: 999, dept: "bar", flavors: [], isPackage: true },
];

// ============ 包厢 ============
const ROOMS = [
  { roomNo: "S01", roomName: "迷你小包", roomType: "小包", area: "A区", capacity: 4, hourlyRate: 28, minSpend: 0 },
  { roomNo: "S02", roomName: "迷你小包", roomType: "小包", area: "A区", capacity: 4, hourlyRate: 28, minSpend: 0 },
  { roomNo: "S03", roomName: "迷你小包", roomType: "小包", area: "A区", capacity: 4, hourlyRate: 28, minSpend: 0 },
  { roomNo: "M01", roomName: "舒适中包", roomType: "中包", area: "B区", capacity: 8, hourlyRate: 48, minSpend: 200 },
  { roomNo: "M02", roomName: "舒适中包", roomType: "中包", area: "B区", capacity: 8, hourlyRate: 48, minSpend: 200 },
  { roomNo: "M03", roomName: "舒适中包", roomType: "中包", area: "B区", capacity: 8, hourlyRate: 48, minSpend: 200 },
  { roomNo: "L01", roomName: "豪华大包", roomType: "大包", area: "C区", capacity: 15, hourlyRate: 88, minSpend: 500 },
  { roomNo: "L02", roomName: "豪华大包", roomType: "大包", area: "C区", capacity: 15, hourlyRate: 88, minSpend: 500 },
  { roomNo: "V01", roomName: "VIP 贵宾厅", roomType: "VIP", area: "V区", capacity: 20, hourlyRate: 128, minSpend: 888 },
  { roomNo: "V02", roomName: "VIP 贵宾厅", roomType: "VIP", area: "V区", capacity: 20, hourlyRate: 128, minSpend: 888 },
];

// ============ 订房经理 ============
const MANAGERS = [
  { name: "王经理", phone: "13900001001", commissionRate: 10 },
  { name: "李经理", phone: "13900001002", commissionRate: 8 },
  { name: "张经理", phone: "13900001003", commissionRate: 12 },
  { name: "陈经理", phone: "13900001004", commissionRate: 10 },
  { name: "刘经理", phone: "13900001005", commissionRate: 15 },
];

// ============ 赠送规则 ============
const GIFT_RULES = [
  { name: "百威买2送1", condProductName: "百威啤酒", condQty: 2, cumulative: true, giftProductName: "百威啤酒", giftQty: 1, deliveries: "[]", enabled: true },
  { name: "科罗娜买3送1", condProductName: "科罗娜", condQty: 3, cumulative: true, giftProductName: "科罗娜", giftQty: 1, deliveries: "[]", enabled: true },
  { name: "芝华士买1送6软饮", condProductName: "芝华士 12年", condQty: 1, cumulative: false, giftProductName: "芝华士 12年", giftQty: 0, deliveries: JSON.stringify([{ name: "矿泉水", qty: 6 }]), enabled: true },
  { name: "轩尼诗买1送6软饮", condProductName: "轩尼诗 VSOP", condQty: 1, cumulative: false, giftProductName: "轩尼诗 VSOP", giftQty: 0, deliveries: JSON.stringify([{ name: "矿泉水", qty: 6 }]), enabled: true },
];

// ============ 主题模板 ============
const THEMES = [
  {
    type: "room_theme",
    name: "经典深色",
    description: "深色背景 + 鲜艳状态色，KTV 标准配色",
    content: JSON.stringify({
      bgColor: "#1a1a2e",
      cardBg: "#16213e",
      colors: { idle: "#10b981", reserved: "#3b82f6", seated: "#f59e0b", in_use: "#ef4444", cleaning: "#a855f7", maintenance: "#6b7280" },
    }),
    isOfficial: true,
  },
  {
    type: "room_theme",
    name: "暖色商务",
    description: "暖色调，适合高端场所",
    content: JSON.stringify({
      bgColor: "#2d1b1b",
      cardBg: "#3d2424",
      colors: { idle: "#d4a574", reserved: "#8b5cf6", seated: "#fbbf24", in_use: "#dc2626", cleaning: "#9ca3af", maintenance: "#52525b" },
    }),
    isOfficial: true,
  },
  {
    type: "product_pack",
    name: "KTV 标准酒水包",
    description: "含 50+ 常见酒水饮料，含图片和条码",
    content: JSON.stringify({ productCount: 50, categories: ["酒水", "饮料", "零食"] }),
    isOfficial: true,
  },
  {
    type: "bill_template",
    name: "标准账单模板",
    description: "58mm 热敏纸，含门店信息/消费明细/支付信息",
    content: JSON.stringify({ width: 58, fontSize: 12, showQrCode: true }),
    isOfficial: true,
  },
  {
    type: "print_template",
    name: "出品单模板",
    description: "出品小票，按出品部门分流",
    content: JSON.stringify({ width: 58, showRoomNo: true, showFlavor: true }),
    isOfficial: true,
  },
  {
    type: "member_activity",
    name: "充值满送活动",
    description: "充 500 送 50，充 1000 送 120，充 2000 送 300",
    content: JSON.stringify([
      { amount: 500, gift: 50 },
      { amount: 1000, gift: 120 },
      { amount: 2000, gift: 300 },
    ]),
    isOfficial: true,
  },
];

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[rand(0, arr.length - 1)];
}

async function main() {
  console.log("🎤 开始 KTV 系统完整种子数据...");

  // 清空相关表
  await db.$transaction([
    db.memberTransaction.deleteMany(),
    db.member.deleteMany(),
    db.ktvOrderItem.deleteMany(),
    db.ktvOrder.deleteMany(),
    db.ktvReservation.deleteMany(),
    db.giftRule.deleteMany(),
    db.productFlavor.deleteMany(),
    db.flavorCategory.deleteMany(),
    db.product.deleteMany(),
    db.productSubcategory.deleteMany(),
    db.productCategory.deleteMany(),
    db.bookingManager.deleteMany(),
    db.ktvRoom.deleteMany(),
    db.sysConfig.deleteMany(),
    db.themeTemplate.deleteMany(),
  ]);

  const now = new Date();

  // 1. 系统配置
  for (const c of SYS_CONFIGS) {
    await db.sysConfig.create({
      data: { storeId: STORE_ID, configKey: c.key, configValue: c.value, category: c.category, description: c.desc },
    });
  }
  console.log(`✅ 系统配置 ${SYS_CONFIGS.length} 项`);

  // 2. 菜品大类 + 小类
  const catMap = new Map<string, { id: string; subs: Map<string, string> }>();
  for (const c of CATEGORIES) {
    const cat = await db.productCategory.create({
      data: { storeId: STORE_ID, name: c.name, sortOrder: c.sortOrder },
    });
    const subs = new Map<string, string>();
    for (const sn of c.subs) {
      const sub = await db.productSubcategory.create({
        data: { storeId: STORE_ID, categoryId: cat.id, name: sn, sortOrder: 0 },
      });
      subs.set(sn, sub.id);
    }
    catMap.set(c.name, { id: cat.id, subs });
  }
  console.log(`✅ 菜品大类 ${CATEGORIES.length} 个 + 小类`);

  // 3. 口味分类 + 选项
  const flavorCatMap = new Map<string, string>();
  const flavorMap = new Map<string, string>(); // "酒水温度|常温" -> flavorId
  for (const fc of FLAVOR_CATEGORIES) {
    const fcat = await db.flavorCategory.create({
      data: { storeId: STORE_ID, name: fc.name, required: fc.required, sortOrder: 0 },
    });
    flavorCatMap.set(fc.name, fcat.id);
    for (const fn of fc.flavors) {
      const f = await db.productFlavor.create({
        data: { flavorCategoryId: fcat.id, name: fn, priceDelta: 0, sortOrder: 0 },
      });
      flavorMap.set(`${fc.name}|${fn}`, f.id);
    }
  }
  console.log(`✅ 口味分类 ${FLAVOR_CATEGORIES.length} 个`);

  // 4. 商品
  const productMap = new Map<string, string>(); // name -> id
  for (const p of PRODUCTS) {
    const catInfo = catMap.get(p.cat)!;
    const subId = p.sub ? catInfo.subs.get(p.sub) ?? null : null;
    const prod = await db.product.create({
      data: {
        storeId: STORE_ID,
        name: p.name,
        categoryId: catInfo.id,
        subcategoryId: subId,
        price: p.price,
        cost: p.cost,
        stock: p.stock,
        barcode: `69${rand(10000000, 99999999)}`,
        outputDept: p.dept,
        isPackage: p.isPackage ?? false,
        status: 1,
      },
    });
    productMap.set(p.name, prod.id);
    // 绑定口味
    for (const fn of p.flavors) {
      const fcatId = flavorCatMap.get(fn);
      if (!fcatId) continue;
      // 把该口味分类下所有选项绑到此商品
      const flavors = await db.productFlavor.findMany({ where: { flavorCategoryId: fcatId } });
      await db.product.update({
        where: { id: prod.id },
        data: { flavors: { connect: flavors.map((f) => ({ id: f.id })) } },
      });
    }
  }
  console.log(`✅ 商品 ${PRODUCTS.length} 个（含口味绑定）`);

  // 5. 赠送规则
  for (const g of GIFT_RULES) {
    const condPid = productMap.get(g.condProductName);
    await db.giftRule.create({
      data: {
        storeId: STORE_ID,
        name: g.name,
        condProductId: condPid ?? null,
        condProductName: g.condProductName,
        condQty: g.condQty,
        cumulative: g.cumulative,
        giftProductName: g.giftProductName,
        giftQty: g.giftQty,
        deliveries: g.deliveries,
        enabled: g.enabled,
      },
    });
  }
  console.log(`✅ 赠送规则 ${GIFT_RULES.length} 条`);

  // 6. 包厢
  const roomMap = new Map<string, string>();
  for (const r of ROOMS) {
    const room = await db.ktvRoom.create({
      data: { storeId: STORE_ID, roomNo: r.roomNo, roomName: r.roomName, roomType: r.roomType, area: r.area, capacity: r.capacity, hourlyRate: r.hourlyRate, minSpend: r.minSpend, status: "idle" },
    });
    roomMap.set(r.roomNo, room.id);
  }
  console.log(`✅ 包厢 ${ROOMS.length} 间`);

  // 7. 订房经理
  const managerMap = new Map<string, string>();
  for (const m of MANAGERS) {
    const mgr = await db.bookingManager.create({
      data: { storeId: STORE_ID, name: m.name, phone: m.phone, commissionRate: m.commissionRate, status: 1 },
    });
    managerMap.set(m.name, mgr.id);
  }
  console.log(`✅ 订房经理 ${MANAGERS.length} 人`);

  // 8. 会员
  const MEMBERS = [
    { cardNo: "M001", name: "张三", phone: "13800001111", level: "钻石", balance: 3200, points: 8800, totalSpent: 28800, discount: 0.8 },
    { cardNo: "M002", name: "李四", phone: "13800002222", level: "金卡", balance: 1500, points: 4200, totalSpent: 12600, discount: 0.88 },
    { cardNo: "M003", name: "王五", phone: "13800003333", level: "金卡", balance: 800, points: 3100, totalSpent: 9800, discount: 0.88 },
    { cardNo: "M004", name: "赵六", phone: "13800004444", level: "银卡", balance: 320, points: 1500, totalSpent: 4500, discount: 0.95 },
    { cardNo: "M005", name: "孙七", phone: "13800005555", level: "银卡", balance: 150, points: 800, totalSpent: 2200, discount: 0.95 },
    { cardNo: "M008", name: "郑十", phone: "13800008888", level: "钻石", balance: 5800, points: 12000, totalSpent: 45600, discount: 0.8 },
  ];
  for (const m of MEMBERS) {
    await db.member.create({
      data: { storeId: STORE_ID, cardNo: m.cardNo, name: m.name, phone: m.phone, level: m.level, balance: m.balance, points: m.points, totalSpent: m.totalSpent, discount: m.discount, status: 1 },
    });
  }
  console.log(`✅ 会员 ${MEMBERS.length} 个`);

  // 9. 预订
  const RESERVATIONS = [
    { customerName: "刘先生", phone: "13900001111", partySize: 6, offsetHours: 2, durationHours: 3, roomNo: "M01", status: "confirmed", manager: "王经理" },
    { customerName: "陈小姐", phone: "13900002222", partySize: 10, offsetHours: 3, durationHours: 4, roomNo: "L01", status: "pending", manager: "李经理" },
    { customerName: "黄总", phone: "13900003333", partySize: 18, offsetHours: 4, durationHours: 5, roomNo: "V01", status: "confirmed", manager: "张经理" },
    { customerName: "林女士", phone: "13900004444", partySize: 4, offsetHours: 1, durationHours: 2, roomNo: null, status: "pending", manager: "陈经理" },
    { customerName: "何先生", phone: "13900005555", partySize: 8, offsetHours: -1, durationHours: 3, roomNo: "M02", status: "arrived", manager: "刘经理" },
  ];
  for (const r of RESERVATIONS) {
    const startAt = new Date(now.getTime() + r.offsetHours * 3600000);
    const endAt = new Date(startAt.getTime() + r.durationHours * 3600000);
    await db.ktvReservation.create({
      data: {
        storeId: STORE_ID,
        roomId: r.roomNo ? roomMap.get(r.roomNo) ?? null : null,
        roomNo: r.roomNo,
        customerName: r.customerName,
        phone: r.phone,
        partySize: r.partySize,
        startAt,
        endAt,
        status: r.status,
      },
    });
  }
  console.log(`✅ 预订 ${RESERVATIONS.length} 条`);

  // 10. 生成 3 个进行中订单
  const inUseRooms = ["M02", "L01", "V02"];
  const products = await db.product.findMany();
  for (const roomNo of inUseRooms) {
    const room = await db.ktvRoom.findUnique({ where: { storeId_roomNo: { storeId: STORE_ID, roomNo } } });
    if (!room) continue;
    const openedAt = new Date(now.getTime() - rand(30, 180) * 60000);
    const manager = pick(MANAGERS);
    const orderNo = `KTV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${rand(1000, 9999)}`;
    const order = await db.ktvOrder.create({
      data: {
        storeId: STORE_ID,
        orderNo,
        roomId: room.id,
        roomNo: room.roomNo,
        roomType: room.roomType,
        hourlyRate: room.hourlyRate,
        customerName: pick(["刘先生", "陈小姐", "黄总", "张先生"]),
        customerCount: rand(4, 12),
        bookingManagerId: managerMap.get(manager.name),
        bookingManagerName: manager.name,
        openedAt,
        status: "open",
      },
    });
    await db.ktvRoom.update({ where: { id: room.id }, data: { status: "in_use", openedAt, currentOrderId: order.id } });

    const itemCount = rand(3, 8);
    let productFee = 0;
    for (let i = 0; i < itemCount; i++) {
      const p = pick(products);
      const qty = rand(1, 4);
      productFee += p.price * qty;
      const delivered = Math.random() < 0.6;
      await db.ktvOrderItem.create({
        data: {
          orderId: order.id,
          productId: p.id,
          productName: p.name,
          price: p.price,
          qty,
          flavors: p.outputDept === "bar" ? JSON.stringify([{ category: "酒水温度", flavor: "冰镇" }]) : null,
          outputDept: p.outputDept,
          status: delivered ? "delivered" : (Math.random() < 0.5 ? "printed" : "pending"),
          printedAt: delivered ? new Date(openedAt.getTime() + rand(0, 30) * 60000) : (Math.random() < 0.5 ? new Date() : null),
          deliveredAt: delivered ? new Date(openedAt.getTime() + rand(1, 30) * 60000) : null,
          createdAt: new Date(openedAt.getTime() + rand(0, 60) * 60000),
        },
      });
      if (p.stock < 999) {
        await db.product.update({ where: { id: p.id }, data: { stock: { decrement: qty } } });
      }
    }
    await db.ktvOrder.update({ where: { id: order.id }, data: { productFee: Math.round(productFee * 100) / 100 } });
  }
  console.log(`✅ 进行中订单 ${inUseRooms.length} 个`);

  // 11. 1 个清扫中包厢
  const cleanRoom = await db.ktvRoom.findUnique({ where: { storeId_roomNo: { storeId: STORE_ID, roomNo: "S01" } } });
  if (cleanRoom) {
    await db.ktvRoom.update({ where: { id: cleanRoom.id }, data: { status: "cleaning", openedAt: null, currentOrderId: null } });
  }

  // 12. 20 个历史已结账订单
  for (let i = 0; i < 20; i++) {
    const r = pick(ROOMS);
    const room = await db.ktvRoom.findUnique({ where: { storeId_roomNo: { storeId: STORE_ID, roomNo: r.roomNo } } });
    if (!room) continue;
    const openedAt = new Date(now.getTime() - rand(1, 14) * 86400000 - rand(18, 23) * 3600000);
    const durationMin = rand(60, 360);
    const closedAt = new Date(openedAt.getTime() + durationMin * 60000);
    const roomFee = Math.round(r.hourlyRate * (durationMin / 60) * 100) / 100;
    const productFee = Math.round(rand(50, 800) * 100) / 100;
    const discount = Math.random() < 0.4 ? Math.round(productFee * 0.12 * 100) / 100 : 0;
    const total = Math.round((roomFee + productFee - discount) * 100) / 100;
    const manager = pick(MANAGERS);
    const orderNo = `KTV-${openedAt.getFullYear()}${String(openedAt.getMonth() + 1).padStart(2, "0")}${String(openedAt.getDate()).padStart(2, "0")}-${rand(1000, 9999)}`;
    const order = await db.ktvOrder.create({
      data: {
        storeId: STORE_ID,
        orderNo,
        roomId: room.id,
        roomNo: room.roomNo,
        roomType: room.roomType,
        hourlyRate: r.hourlyRate,
        customerName: pick(["刘先生", "陈小姐", "黄总", "张先生", "林女士", "何先生"]),
        customerCount: rand(2, 18),
        bookingManagerId: managerMap.get(manager.name),
        bookingManagerName: manager.name,
        openedAt,
        closedAt,
        durationMinutes: durationMin,
        roomFee,
        productFee,
        discount,
        totalAmount: total,
        payMethod: pick(["cash", "wechat", "alipay", "member"]),
        status: "paid",
      },
    });
    // 明细
    const ic = rand(2, 6);
    for (let j = 0; j < ic; j++) {
      const p = pick(products);
      const qty = rand(1, 3);
      await db.ktvOrderItem.create({
        data: {
          orderId: order.id,
          productId: p.id,
          productName: p.name,
          price: p.price,
          qty,
          flavors: null,
          outputDept: p.outputDept,
          status: "delivered",
          printedAt: new Date(openedAt.getTime() + rand(0, 10) * 60000),
          deliveredAt: new Date(openedAt.getTime() + rand(1, 30) * 60000),
          createdAt: new Date(openedAt.getTime() + rand(0, 60) * 60000),
        },
      });
    }
  }
  console.log(`✅ 历史已结账订单 20 个`);

  // 13. 主题模板
  for (const t of THEMES) {
    await db.themeTemplate.create({
      data: {
        type: t.type,
        name: t.name,
        description: t.description,
        content: t.content,
        isOfficial: t.isOfficial,
        useCount: rand(50, 500),
      },
    });
  }
  console.log(`✅ 主题模板 ${THEMES.length} 个`);

  console.log("\n🎉 KTV 系统种子数据完成！");
  console.log(`   系统:${SYS_CONFIGS.length} | 大类:${CATEGORIES.length} | 口味:${FLAVOR_CATEGORIES.length} | 商品:${PRODUCTS.length}`);
  console.log(`   赠送:${GIFT_RULES.length} | 包厢:${ROOMS.length} | 经理:${MANAGERS.length} | 会员:${MEMBERS.length}`);
  console.log(`   模板:${THEMES.length} | 预订:${RESERVATIONS.length} | 进行中:${inUseRooms.length} | 历史:20`);
}

main()
  .catch((e) => {
    console.error("❌ 种子失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
