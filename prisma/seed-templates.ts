// seed 打印模板 + auto_deliver 配置
import { db } from "../src/lib/db";

async function main() {
  // 1. auto_deliver 配置
  await db.sysConfig.upsert({
    where: { storeId_configKey: { storeId: 1001, configKey: "auto_deliver" } },
    update: {},
    create: {
      storeId: 1001, configKey: "auto_deliver", configValue: "false",
      category: "system", description: "出品自动送达（开启后点单直接标记已送达，不再走出品流程）",
    },
  });
  console.log("✅ auto_deliver 配置");

  // 2. 打印模板
  await db.printTemplate.deleteMany({});
  const templates = [
    {
      type: "production", name: "标准出品单", width: 58, isActive: true,
      config: JSON.stringify({
        header: "天娱 KTV 出品单",
        footer: "感谢惠顾",
        showLogo: false, showQrCode: false,
        showRoomNo: true, showFlavor: true, showTime: true, showQty: true,
        fontSize: 12, copies: 2,
        fields: ["roomNo", "productName", "flavor", "qty", "time", "dept"],
      }),
    },
    {
      type: "bill", name: "标准账单", width: 58, isActive: true,
      config: JSON.stringify({
        header: "天娱 KTV 账单",
        footer: "欢迎下次光临",
        showLogo: true, showQrCode: true,
        showRoomNo: true, showCustomer: true, showManager: true,
        showItems: true, showSummary: true, showMember: true,
        fontSize: 11, copies: 1,
        fields: ["orderNo", "roomNo", "openedAt", "duration", "items", "roomFee", "productFee", "discount", "total", "payMethod"],
      }),
    },
    {
      type: "reservation", name: "预订单", width: 58, isActive: true,
      config: JSON.stringify({
        header: "天娱 KTV 预订单",
        footer: "请按时到店",
        showLogo: false, showQrCode: false,
        fontSize: 12, copies: 1,
        fields: ["customerName", "phone", "partySize", "startAt", "endAt", "roomNo", "remark"],
      }),
    },
    {
      type: "gift", name: "赠送单", width: 58, isActive: true,
      config: JSON.stringify({
        header: "赠送单",
        footer: "",
        showLogo: false, showQrCode: false,
        fontSize: 12, copies: 1,
        fields: ["roomNo", "productName", "qty", "manager", "remark", "time"],
      }),
    },
  ];
  for (const t of templates) {
    await db.printTemplate.create({ data: { ...t, enabled: true } });
  }
  console.log(`✅ 打印模板 ${templates.length} 个`);
}

main().catch(console.error).finally(() => db.$disconnect());
