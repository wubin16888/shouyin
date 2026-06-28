const{PrismaClient}=require("@prisma/client");const db=new PrismaClient();
async function main(){
  await db.themeTemplate.deleteMany({});
  const themes=[
    // 房态主题
    {type:"room_theme",name:"经典暗夜",description:"深色背景+鲜艳状态色，KTV标准配色",content:JSON.stringify({bgColor:"#0f172a",cardBg:"#1e293b",colors:{idle:"#059669",reserved:"#0284c7",seated:"#f59e0b",in_use:"#e11d48",checkout:"#eab308",cleaning:"#8b5cf6",maintenance:"#475569"}}),isOfficial:true,useCount:328},
    {type:"room_theme",name:"暗夜紫",description:"紫色系深色主题，高端KTV氛围",content:JSON.stringify({bgColor:"#1a0b2e",cardBg:"#2d1b4e",colors:{idle:"#7c3aed",reserved:"#6366f1",seated:"#f59e0b",in_use:"#ec4899",checkout:"#eab308",cleaning:"#a78bfa",maintenance:"#6b7280"}}),isOfficial:true,useCount:156},
    {type:"room_theme",name:"商务蓝",description:"沉稳蓝色系，适合商务KTV",content:JSON.stringify({bgColor:"#0c1929",cardBg:"#132f4c",colors:{idle:"#0ea5e9",reserved:"#3b82f6",seated:"#f59e0b",in_use:"#ef4444",checkout:"#eab308",cleaning:"#8b5cf6",maintenance:"#475569"}}),isOfficial:true,useCount:89},
    {type:"room_theme",name:"暖金奢华",description:"金色暖色调，VIP包厢风格",content:JSON.stringify({bgColor:"#1c1917",cardBg:"#292524",colors:{idle:"#d4a574",reserved:"#8b5cf6",seated:"#fbbf24",in_use:"#dc2626",checkout:"#eab308",cleaning:"#9ca3af",maintenance:"#52525b"}}),isOfficial:true,useCount:67},
    {type:"room_theme",name:"霓虹赛博",description:"霓虹灯效果，潮流酒吧风",content:JSON.stringify({bgColor:"#0a0014",cardBg:"#1a0033",colors:{idle:"#00ff88",reserved:"#00ddff",seated:"#ff00ff",in_use:"#ff0066",checkout:"#ffff00",cleaning:"#aa00ff",maintenance:"#666666"}}),isOfficial:true,useCount:42},
    {type:"room_theme",name:"简约白",description:"浅色主题，干净简洁",content:JSON.stringify({bgColor:"#f8fafc",cardBg:"#ffffff",colors:{idle:"#22c55e",reserved:"#3b82f6",seated:"#f59e0b",in_use:"#ef4444",checkout:"#eab308",cleaning:"#a855f7",maintenance:"#94a3b8"}}),isOfficial:true,useCount:35},
    // 商品套餐包
    {type:"product_pack",name:"KTV标准酒水包",description:"含50+常见酒水饮料，含图片和条码",content:JSON.stringify({productCount:50,categories:["酒水","饮料","零食"]}),isOfficial:true,useCount:215},
    {type:"product_pack",name:"台球室标准包",description:"含计时消费+饮品零食",content:JSON.stringify({productCount:30,categories:["饮品","零食","计时"]}),isOfficial:true,useCount:18},
    {type:"product_pack",name:"超市标准包",description:"含200+常见超市商品分类",content:JSON.stringify({productCount:200,categories:["食品","日用品","饮料","零食"]}),isOfficial:true,useCount:56},
    // 账单模板
    {type:"bill_template",name:"标准58mm账单",description:"58mm热敏纸，含门店信息/消费明细/支付信息",content:JSON.stringify({width:58,fontSize:12,showQrCode:true,showLogo:true,header:"欢迎光临",footer:"感谢惠顾"}),isOfficial:true,useCount:189},
    {type:"bill_template",name:"豪华80mm账单",description:"80mm宽纸，含详细明细+会员信息",content:JSON.stringify({width:80,fontSize:11,showQrCode:true,showLogo:true,header:"感谢光临",footer:"欢迎下次再来"}),isOfficial:true,useCount:45},
    // 出品单模板
    {type:"print_template",name:"标准出品单",description:"58mm，按出品部门分流",content:JSON.stringify({width:58,showRoomNo:true,showFlavor:true,showTime:true,copies:2}),isOfficial:true,useCount:167},
    {type:"print_template",name:"厨房联单",description:"80mm，后厨专用，含口味标注",content:JSON.stringify({width:80,showRoomNo:true,showFlavor:true,showTime:true,showQty:true,copies:1}),isOfficial:true,useCount:38},
    // 会员活动
    {type:"member_activity",name:"充值满送活动",description:"充500送50，充1000送120，充2000送300",content:JSON.stringify([{amount:500,gift:50},{amount:1000,gift:120},{amount:2000,gift:300}]),isOfficial:true,useCount:98},
    {type:"member_activity",name:"充值送积分",description:"充值1元送1积分，积分可抵现",content:JSON.stringify([{rate:1,pointRate:1}]),isOfficial:true,useCount:34},
    {type:"member_activity",name:"生日双倍积分",description:"会员生日当天消费积分翻倍",content:JSON.stringify({type:"birthday_double",desc:"生日当天积分x2"}),isOfficial:true,useCount:12},
  ];
  for(const t of themes){await db.themeTemplate.create({data:{...t,useCount:t.useCount||0}});}
  console.log("✅ 主题模板",themes.length,"个创建完成");
  console.log("  房态主题: 6个(暗夜/紫/蓝/金/霓虹/白)");
  console.log("  商品包: 3个(KTV/台球/超市)");
  console.log("  账单模板: 2个(58mm/80mm)");
  console.log("  出品单: 2个(标准/厨房)");
  console.log("  会员活动: 3个(充值送/积分/生日)");
}
main().catch(e=>{console.error("❌",e.message);process.exit(1)}).finally(()=>db.$disconnect());
