// 增量 seed：出品点 + 员工 + 包厢补字段
import { db } from "../src/lib/db";

const STORE_ID = 1001;

async function main() {
  console.log("🔧 增量 seed 开始...");

  // 1. 出品点设置
  await db.outputPoint.deleteMany({});
  const outputPoints = [
    { deptCode: "bar", name: "吧台", ip: "192.168.1.101", printMode: "client", computerName: "JS" },
    { deptCode: "kitchen", name: "厨房", ip: "192.168.1.102", printMode: "network", relayServer: "192.168.1.200", computerName: "CF" },
    { deptCode: "fruit", name: "水果房", ip: "192.168.1.103", printMode: "network", relayServer: "192.168.1.200", computerName: "SGF" },
    { deptCode: "outside", name: "外卖", ip: "192.168.1.104", printMode: "client", computerName: "WM" },
  ];
  for (const op of outputPoints) {
    await db.outputPoint.create({ data: { storeId: STORE_ID, ...op, enabled: true } });
  }
  console.log(`✅ 出品点 ${outputPoints.length} 个`);

  // 2. 员工（人事）
  await db.employee.deleteMany({});
  const employees = [
    { name: "王经理", phone: "13900001001", position: "manager", department: "管理层", role: "manager", discount: 0.8, monthlyGiftLimit: 2000 },
    { name: "李经理", phone: "13900001002", position: "manager", department: "管理层", role: "manager", discount: 0.85, monthlyGiftLimit: 1500 },
    { name: "张营销", phone: "13900001003", position: "marketing", department: "营销部", role: "manager", discount: 0.88, monthlyGiftLimit: 1000 },
    { name: "陈营销", phone: "13900001004", position: "marketing", department: "营销部", role: "cashier", discount: 0.9, monthlyGiftLimit: 800 },
    { name: "刘收银", phone: "13900001005", position: "cashier", department: "收银部", role: "cashier", discount: 1, monthlyGiftLimit: 0 },
    { name: "赵吧台", phone: "13900001006", position: "bartender", department: "吧台部", role: "production", discount: 1, monthlyGiftLimit: 0 },
    { name: "孙厨师", phone: "13900001007", position: "chef", department: "厨房部", role: "production", discount: 1, monthlyGiftLimit: 0 },
    { name: "周服务员", phone: "13900001008", position: "waiter", department: "服务部", role: "cashier", discount: 0.95, monthlyGiftLimit: 300 },
  ];
  const now = new Date();
  for (const e of employees) {
    await db.employee.create({
      data: { storeId: STORE_ID, ...e, usedGiftAmount: Math.floor(Math.random() * 500), resetMonth: now.getMonth() + 1, entryDate: new Date(now.getTime() - Math.floor(Math.random() * 365) * 86400000) },
    });
  }
  console.log(`✅ 员工 ${employees.length} 人`);

  // 3. 包厢补 billingMode 和 roomIp
  const rooms = await db.ktvRoom.findMany();
  for (const r of rooms) {
    let billingMode = "hourly";
    if (r.roomType === "VIP") billingMode = "minspend";
    else if (r.roomType === "大包") billingMode = "hourly";
    else if (r.roomType === "中包") billingMode = "hourly";
    await db.ktvRoom.update({
      where: { id: r.id },
      data: {
        billingMode,
        roomIp: `192.168.1.${100 + parseInt(r.roomNo.replace(/\D/g, ""))}`,
      },
    });
  }
  console.log(`✅ 包厢 ${rooms.length} 间补字段`);

  // 4. 把"常温/冰镇"从酒水/饮料的小类移除（改成无小类），口味里已有"酒水温度"
  // 删除酒水/饮料下的常温、冰镇小类
  await db.productSubcategory.deleteMany({
    where: {
      storeId: STORE_ID,
      name: { in: ["常温", "冰镇"] },
    },
  });
  console.log(`✅ 清理酒水饮料的常温/冰镇小类（已归到口味）`);

  // 5. 给部分商品设置 countToMinSpend（服务费类、纸巾类不计低消）
  // 矿泉水、纸巾等不计低消
  const noMinSpend = ["矿泉水", "纸巾", "湿巾"];
  for (const name of noMinSpend) {
    await db.product.updateMany({
      where: { storeId: STORE_ID, name },
      data: { countToMinSpend: false },
    });
  }
  console.log(`✅ 标记不计低消商品`);

  // 6. 套餐商品设 packagePrice
  const packages = [
    { name: "欢唱 2 小时套餐（中包）", packagePrice: 188 },
    { name: "欢唱 3 小时套餐（大包）", packagePrice: 388 },
    { name: "酒水畅饮套餐（6人）", packagePrice: 588 },
    { name: "VIP 尊享套餐", packagePrice: 1288 },
  ];
  for (const p of packages) {
    await db.product.updateMany({
      where: { storeId: STORE_ID, name: p.name },
      data: { isPackage: true, packagePrice: p.packagePrice, packageItems: JSON.stringify([
        { name: "青岛啤酒", qty: 6 },
        { name: "可乐", qty: 4 },
        { name: "矿泉水", qty: 4 },
        { name: "瓜子", qty: 2 },
      ]) },
    });
  }
  console.log(`✅ 套餐 ${packages.length} 个设 packagePrice`);

  console.log("\n🎉 增量 seed 完成！");
}

main().catch((e) => { console.error("❌", e); process.exit(1); }).finally(() => db.$disconnect());
