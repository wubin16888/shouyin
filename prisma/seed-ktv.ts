// KTV 种子数据
// 运行: bun run db:seed-ktv

import { db } from "../src/lib/db";

const ROOMS = [
  { roomNo: "S01", roomName: "迷你小包", roomType: "小包", capacity: 4, hourlyRate: 28, minSpend: 0 },
  { roomNo: "S02", roomName: "迷你小包", roomType: "小包", capacity: 4, hourlyRate: 28, minSpend: 0 },
  { roomNo: "S03", roomName: "迷你小包", roomType: "小包", capacity: 4, hourlyRate: 28, minSpend: 0 },
  { roomNo: "M01", roomName: "舒适中包", roomType: "中包", capacity: 8, hourlyRate: 48, minSpend: 200 },
  { roomNo: "M02", roomName: "舒适中包", roomType: "中包", capacity: 8, hourlyRate: 48, minSpend: 200 },
  { roomNo: "M03", roomName: "舒适中包", roomType: "中包", capacity: 8, hourlyRate: 48, minSpend: 200 },
  { roomNo: "L01", roomName: "豪华大包", roomType: "大包", capacity: 15, hourlyRate: 88, minSpend: 500 },
  { roomNo: "L02", roomName: "豪华大包", roomType: "大包", capacity: 15, hourlyRate: 88, minSpend: 500 },
  { roomNo: "V01", roomName: "VIP 贵宾厅", roomType: "VIP", capacity: 20, hourlyRate: 128, minSpend: 888 },
  { roomNo: "V02", roomName: "VIP 贵宾厅", roomType: "VIP", capacity: 20, hourlyRate: 128, minSpend: 888 },
];

const PRODUCTS = [
  // 酒水
  { name: "青岛啤酒", category: "酒水", price: 15, cost: 6, stock: 120 },
  { name: "百威啤酒", category: "酒水", price: 20, cost: 9, stock: 80 },
  { name: "科罗娜", category: "酒水", price: 25, cost: 12, stock: 60 },
  { name: "芝华士 12年", category: "酒水", price: 580, cost: 320, stock: 25 },
  { name: "黑方威士忌", category: "酒水", price: 520, cost: 280, stock: 20 },
  { name: "轩尼诗 VSOP", category: "酒水", price: 680, cost: 380, stock: 18 },
  { name: "杰克丹尼", category: "酒水", price: 480, cost: 260, stock: 22 },
  { name: "二锅头", category: "酒水", price: 18, cost: 6, stock: 100 },
  // 饮料
  { name: "可乐", category: "饮料", price: 8, cost: 2, stock: 200 },
  { name: "雪碧", category: "饮料", price: 8, cost: 2, stock: 180 },
  { name: "橙汁", category: "饮料", price: 12, cost: 4, stock: 100 },
  { name: "酸梅汤", category: "饮料", price: 10, cost: 3, stock: 120 },
  { name: "柠檬水", category: "饮料", price: 12, cost: 3, stock: 90 },
  { name: "矿泉水", category: "饮料", price: 5, cost: 1, stock: 300 },
  // 零食
  { name: "瓜子", category: "零食", price: 12, cost: 4, stock: 80 },
  { name: "花生", category: "零食", price: 12, cost: 4, stock: 80 },
  { name: "薯片", category: "零食", price: 15, cost: 5, stock: 60 },
  { name: "鱿鱼丝", category: "零食", price: 18, cost: 7, stock: 50 },
  { name: "牛肉干", category: "零食", price: 25, cost: 12, stock: 40 },
  // 水果
  { name: "水果拼盘（小）", category: "水果", price: 38, cost: 18, stock: 30 },
  { name: "水果拼盘（大）", category: "水果", price: 68, cost: 32, stock: 25 },
  { name: "西瓜碟", category: "水果", price: 28, cost: 12, stock: 35 },
  // 套餐
  { name: "欢唱 2 小时套餐（中包）", category: "套餐", price: 188, cost: 80, stock: 999 },
  { name: "欢唱 3 小时套餐（大包）", category: "套餐", price: 388, cost: 180, stock: 999 },
  { name: "酒水畅饮套餐（6人）", category: "套餐", price: 588, cost: 280, stock: 999 },
  { name: "VIP 尊享套餐", category: "套餐", price: 1288, cost: 600, stock: 999 },
];

const MEMBERS = [
  { cardNo: "M001", name: "张三", phone: "13800001111", level: "钻石", balance: 3200, points: 8800, totalSpent: 28800, discount: 0.8 },
  { cardNo: "M002", name: "李四", phone: "13800002222", level: "金卡", balance: 1500, points: 4200, totalSpent: 12600, discount: 0.88 },
  { cardNo: "M003", name: "王五", phone: "13800003333", level: "金卡", balance: 800, points: 3100, totalSpent: 9800, discount: 0.88 },
  { cardNo: "M004", name: "赵六", phone: "13800004444", level: "银卡", balance: 320, points: 1500, totalSpent: 4500, discount: 0.95 },
  { cardNo: "M005", name: "孙七", phone: "13800005555", level: "银卡", balance: 150, points: 800, totalSpent: 2200, discount: 0.95 },
  { cardNo: "M006", name: "周八", phone: "13800006666", level: "普通会员", balance: 0, points: 200, totalSpent: 600, discount: 1 },
  { cardNo: "M007", name: "吴九", phone: "13800007777", level: "普通会员", balance: 50, points: 120, totalSpent: 380, discount: 1 },
  { cardNo: "M008", name: "郑十", phone: "13800008888", level: "钻石", balance: 5800, points: 12000, totalSpent: 45600, discount: 0.8 },
];

const RESERVATIONS = [
  { customerName: "刘先生", phone: "13900001111", partySize: 6, offsetHours: 2, durationHours: 3, roomNo: "M01", status: "confirmed" },
  { customerName: "陈小姐", phone: "13900002222", partySize: 10, offsetHours: 3, durationHours: 4, roomNo: "L01", status: "pending" },
  { customerName: "黄总", phone: "13900003333", partySize: 18, offsetHours: 4, durationHours: 5, roomNo: "V01", status: "confirmed" },
  { customerName: "林女士", phone: "13900004444", partySize: 4, offsetHours: 1, durationHours: 2, roomNo: null, status: "pending" },
  { customerName: "何先生", phone: "13900005555", partySize: 8, offsetHours: -1, durationHours: 3, roomNo: "M02", status: "arrived" },
  { customerName: "张小姐", phone: "13900006666", partySize: 12, offsetHours: 6, durationHours: 4, roomNo: "L02", status: "pending" },
];

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[rand(0, arr.length - 1)];
}

async function main() {
  console.log("🎤 开始 KTV 种子数据...");

  // 清空 KTV 相关表
  await db.$transaction([
    db.memberTransaction.deleteMany(),
    db.member.deleteMany(),
    db.ktvOrderItem.deleteMany(),
    db.ktvOrder.deleteMany(),
    db.ktvReservation.deleteMany(),
    db.ktvProduct.deleteMany(),
    db.ktvRoom.deleteMany(),
  ]);

  const storeId = 1001;
  const now = new Date();

  // 1. 包厢
  const roomMap = new Map<string, string>();
  for (const r of ROOMS) {
    const room = await db.ktvRoom.create({
      data: {
        storeId,
        roomNo: r.roomNo,
        roomName: r.roomName,
        roomType: r.roomType,
        capacity: r.capacity,
        hourlyRate: r.hourlyRate,
        minSpend: r.minSpend,
        status: "idle",
      },
    });
    roomMap.set(r.roomNo, room.id);
  }
  console.log(`✅ 包厢 ${ROOMS.length} 间`);

  // 2. 商品
  for (const p of PRODUCTS) {
    await db.ktvProduct.create({
      data: {
        storeId,
        name: p.name,
        category: p.category,
        price: p.price,
        cost: p.cost,
        stock: p.stock,
        barcode: `69${rand(10000000, 99999999)}`,
        status: 1,
      },
    });
  }
  console.log(`✅ 商品 ${PRODUCTS.length} 个`);

  // 3. 会员
  for (const m of MEMBERS) {
    const member = await db.member.create({
      data: {
        storeId,
        cardNo: m.cardNo,
        name: m.name,
        phone: m.phone,
        level: m.level,
        balance: m.balance,
        points: m.points,
        totalSpent: m.totalSpent,
        discount: m.discount,
        status: 1,
      },
    });

    // 给每个会员生成几条交易记录
    for (let i = 0; i < rand(3, 8); i++) {
      const isRecharge = Math.random() < 0.4;
      const amount = isRecharge ? pick([500, 1000, 2000, 3000, 5000]) : pick([88, 188, 288, 388, 588, 1288]);
      const pointsDelta = isRecharge ? 0 : Math.floor(amount);
      const daysAgo = rand(1, 60);
      const createdAt = new Date(now.getTime() - daysAgo * 86400000 - rand(0, 86400) * 1000);
      const balanceAfter = Math.max(0, m.balance + (isRecharge ? amount : -amount) * (rand(0, 5) - 2));
      await db.memberTransaction.create({
        data: {
          memberId: member.id,
          type: isRecharge ? "recharge" : "consume",
          amount: isRecharge ? amount : -amount,
          pointsDelta,
          balanceAfter,
          payMethod: isRecharge ? pick(["cash", "wechat", "alipay"]) : null,
          remark: isRecharge ? "会员充值" : `KTV消费`,
          relatedOrderNo: isRecharge ? null : `KTV-${createdAt.getFullYear()}${String(createdAt.getMonth() + 1).padStart(2, "0")}${String(createdAt.getDate()).padStart(2, "0")}-${rand(1000, 9999)}`,
          createdAt,
        },
      });
    }
  }
  console.log(`✅ 会员 ${MEMBERS.length} 个 + 交易记录`);

  // 4. 预订
  for (const r of RESERVATIONS) {
    const startAt = new Date(now.getTime() + r.offsetHours * 3600000);
    const endAt = new Date(startAt.getTime() + r.durationHours * 3600000);
    await db.ktvReservation.create({
      data: {
        storeId,
        roomId: r.roomNo ? roomMap.get(r.roomNo) ?? null : null,
        roomNo: r.roomNo,
        customerName: r.customerName,
        phone: r.phone,
        partySize: r.partySize,
        startAt,
        endAt,
        status: r.status,
        remark: r.partySize >= 15 ? "需要安排大包" : undefined,
      },
    });
  }
  console.log(`✅ 预订 ${RESERVATIONS.length} 条`);

  // 5. 生成几个进行中的包厢订单（开台状态）
  const inUseRooms = ["M02", "L01", "V02"];
  const products = await db.ktvProduct.findMany();
  for (const roomNo of inUseRooms) {
    const room = await db.ktvRoom.findUnique({ where: { storeId_roomNo: { storeId, roomNo } } });
    if (!room) continue;
    const openedAt = new Date(now.getTime() - rand(30, 180) * 60000);
    const orderNo = `KTV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${rand(1000, 9999)}`;
    const order = await db.ktvOrder.create({
      data: {
        storeId,
        orderNo,
        roomId: room.id,
        roomNo: room.roomNo,
        roomType: room.roomType,
        hourlyRate: room.hourlyRate,
        customerName: pick(["刘先生", "陈小姐", "黄总", "张先生"]),
        customerCount: rand(4, 12),
        phone: `139${rand(10000000, 99999999)}`,
        openedAt,
        status: "open",
      },
    });

    // 更新包厢状态
    await db.ktvRoom.update({
      where: { id: room.id },
      data: { status: "in_use", openedAt, currentOrderId: order.id },
    });

    // 给订单加 3-8 个商品
    const itemCount = rand(3, 8);
    let productFee = 0;
    for (let i = 0; i < itemCount; i++) {
      const p = pick(products);
      const qty = rand(1, 4);
      productFee += p.price * qty;
      const delivered = Math.random() < 0.7;
      await db.ktvOrderItem.create({
        data: {
          orderId: order.id,
          productId: p.id,
          productName: p.name,
          price: p.price,
          qty,
          status: delivered ? "delivered" : "pending",
          deliveredAt: delivered ? new Date(openedAt.getTime() + rand(1, 30) * 60000) : null,
          createdAt: new Date(openedAt.getTime() + rand(0, 60) * 60000),
        },
      });
      // 扣库存
      await db.ktvProduct.update({
        where: { id: p.id },
        data: { stock: { decrement: qty } },
      });
    }
    await db.ktvOrder.update({
      where: { id: order.id },
      data: { productFee: Math.round(productFee * 100) / 100 },
    });
  }
  console.log(`✅ 进行中订单 ${inUseRooms.length} 个（含商品明细）`);

  // 6. 生成 20 个历史已结账订单
  for (let i = 0; i < 20; i++) {
    const r = pick(ROOMS);
    const room = await db.ktvRoom.findUnique({ where: { storeId_roomNo: { storeId, roomNo: r.roomNo } } });
    if (!room) continue;
    const openedAt = new Date(now.getTime() - rand(1, 14) * 86400000 - rand(18, 22) * 3600000);
    const durationMin = rand(60, 360);
    const closedAt = new Date(openedAt.getTime() + durationMin * 60000);
    const roomFee = Math.round((r.hourlyRate * (durationMin / 60)) * 100) / 100;
    const productFee = Math.round(rand(50, 800) * 100) / 100;
    const discount = Math.random() < 0.4 ? Math.round(productFee * 0.12 * 100) / 100 : 0;
    const total = Math.round((roomFee + productFee - discount) * 100) / 100;
    const orderNo = `KTV-${openedAt.getFullYear()}${String(openedAt.getMonth() + 1).padStart(2, "0")}${String(openedAt.getDate()).padStart(2, "0")}-${rand(1000, 9999)}`;

    const order = await db.ktvOrder.create({
      data: {
        storeId,
        orderNo,
        roomId: room.id,
        roomNo: room.roomNo,
        roomType: room.roomType,
        hourlyRate: r.hourlyRate,
        customerName: pick(["刘先生", "陈小姐", "黄总", "张先生", "林女士", "何先生"]),
        customerCount: rand(2, 18),
        phone: `139${rand(10000000, 99999999)}`,
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

    // 加商品明细
    const ic = rand(2, 6);
    let realProductFee = 0;
    for (let j = 0; j < ic; j++) {
      const p = pick(products);
      const qty = rand(1, 3);
      realProductFee += p.price * qty;
      await db.ktvOrderItem.create({
        data: {
          orderId: order.id,
          productId: p.id,
          productName: p.name,
          price: p.price,
          qty,
          status: "delivered",
          deliveredAt: new Date(openedAt.getTime() + rand(1, 30) * 60000),
          createdAt: new Date(openedAt.getTime() + rand(0, 60) * 60000),
        },
      });
    }
  }
  console.log(`✅ 历史已结账订单 20 个`);

  // 7. 设置 1 个清扫中的包厢
  const cleanRoom = await db.ktvRoom.findUnique({ where: { storeId_roomNo: { storeId, roomNo: "S01" } } });
  if (cleanRoom) {
    await db.ktvRoom.update({
      where: { id: cleanRoom.id },
      data: { status: "cleaning", openedAt: null, currentOrderId: null },
    });
  }
  console.log(`✅ 清扫中包厢 1 间`);

  console.log("\n🎉 KTV 种子数据完成！");
  console.log(`   包厢: ${ROOMS.length} (空闲${ROOMS.length - inUseRooms.length - 1} / 使用中${inUseRooms.length} / 清扫1)`);
  console.log(`   商品: ${PRODUCTS.length} | 会员: ${MEMBERS.length} | 预订: ${RESERVATIONS.length}`);
}

main()
  .catch((e) => {
    console.error("❌ 种子失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
