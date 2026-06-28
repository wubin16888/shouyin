const{PrismaClient}=require("@prisma/client");const db=new PrismaClient();
async function main(){
  console.log("🚀 开始初始化...");
  await db.store.upsert({where:{storeId:1001},update:{},create:{storeId:1001,storeName:"北京中关村店",storeToken:"token_1001",region:"华北",status:1,wsStatus:"online"}});
  console.log("✅ 门店");
  await db.employee.upsert({where:{username:"cloud"},update:{role:"cloud_admin",password:"cloud888"},create:{storeId:1001,name:"云管理员",phone:"13900000000",position:"manager",role:"cloud_admin",discount:1,status:1,username:"cloud",password:"cloud888",isStoreAdmin:false,resetMonth:new Date().getMonth()+1}});
  await db.employee.upsert({where:{username:"admin1001"},update:{},create:{storeId:1001,name:"门店管理员",phone:"13900001001",position:"manager",role:"admin",discount:0.8,status:1,username:"admin1001",password:"001001",isStoreAdmin:true,resetMonth:new Date().getMonth()+1}});
  await db.employee.upsert({where:{username:"cashier1001"},update:{},create:{storeId:1001,name:"收银员",phone:"13800001234",position:"cashier",role:"cashier",discount:1,status:1,username:"cashier1001",password:"001234",isStoreAdmin:false,resetMonth:new Date().getMonth()+1}});
  console.log("✅ 账号: cloud/cloud888 admin1001/001001 cashier1001/001234");
  const configs=[
    {configKey:"currency_symbol",configValue:"¥",category:"system",description:"货币符号"},
    {configKey:"store_name",configValue:"天娱KTV",category:"system",description:"门店名"},
    {configKey:"business_hours",configValue:'{"open":"18:00","close":"02:00"}',category:"system",description:"营业时间"},
    {configKey:"service_charge",configValue:"0.1",category:"system",description:"服务费"},
    {configKey:"room_status_colors",configValue:'{"idle":"#059669","reserved":"#3b82f6","seated":"#f59e0b","in_use":"#e11d48","checkout":"#eab308","cleaning":"#8b5cf6","maintenance":"#475569"}',category:"room",description:"房态色"},
    {configKey:"room_display_fields",configValue:'{"roomNo":true,"roomName":true,"roomType":true,"bookingManager":true,"customerName":true,"customerCount":true,"consume":true,"openedAt":true,"duration":true}',category:"display",description:"显示字段"},
    {configKey:"auto_deliver",configValue:"false",category:"system",description:"自动送达"},
    {configKey:"industry_template",configValue:"ktv",category:"system",description:"行业模板"},
  ];
  for(const c of configs){await db.sysConfig.upsert({where:{storeId_configKey:{storeId:1001,configKey:c.configKey}},update:{},create:{storeId:1001,...c}});}
  console.log("✅ 配置");
  const cats=[{n:"酒水",s:1},{n:"饮料",s:2},{n:"零食",s:3},{n:"水果",s:4},{n:"热菜",s:5},{n:"凉菜",s:6},{n:"主食",s:7},{n:"套餐",s:8}];
  const cm={};
  for(const c of cats){const cat=await db.productCategory.upsert({where:{storeId_name:{storeId:1001,name:c.n}},update:{},create:{storeId:1001,name:c.n,sortOrder:c.s}});cm[c.n]=cat.id;}
  console.log("✅ 大类");
  const ps=[
    {n:"青岛啤酒",c:"酒水",p:15,co:6,st:120,d:"bar",i:"/dishes/beer.png"},
    {n:"百威啤酒",c:"酒水",p:20,co:9,st:80,d:"bar",i:"/dishes/beer.png"},
    {n:"科罗娜",c:"酒水",p:25,co:12,st:60,d:"bar",i:"/dishes/beer.png"},
    {n:"芝华士12年",c:"酒水",p:580,co:320,st:25,d:"bar",i:"/dishes/whisky.png"},
    {n:"轩尼诗VSOP",c:"酒水",p:680,co:380,st:18,d:"bar",i:"/dishes/whisky.png"},
    {n:"可乐",c:"饮料",p:8,co:2,st:200,d:"bar",i:"/dishes/drinks.png"},
    {n:"雪碧",c:"饮料",p:8,co:2,st:180,d:"bar",i:"/dishes/drinks.png"},
    {n:"矿泉水",c:"饮料",p:5,co:1,st:300,d:"bar",i:"/dishes/drinks.png"},
    {n:"瓜子",c:"零食",p:12,co:4,st:80,d:"bar",i:"/dishes/snacks.png"},
    {n:"花生",c:"零食",p:12,co:4,st:80,d:"bar",i:"/dishes/snacks.png"},
    {n:"水果拼盘小",c:"水果",p:38,co:18,st:30,d:"fruit",i:"/dishes/fruit.png"},
    {n:"水果拼盘大",c:"水果",p:68,co:32,st:25,d:"fruit",i:"/dishes/fruit.png"},
    {n:"宫保鸡丁",c:"热菜",p:38,co:15,st:999,d:"kitchen",i:"/dishes/hotdish.png"},
    {n:"水煮鱼片",c:"热菜",p:58,co:25,st:999,d:"kitchen",i:"/dishes/hotdish.png"},
    {n:"凉拌黄瓜",c:"凉菜",p:12,co:4,st:999,d:"kitchen",i:"/dishes/hotdish.png"},
    {n:"米饭",c:"主食",p:2,co:0.5,st:999,d:"kitchen",i:"/dishes/hotdish.png"},
    {n:"欢唱套餐中包",c:"套餐",p:188,co:80,st:999,d:"bar",i:"/dishes/whisky.png",pk:true,pp:188},
    {n:"VIP尊享套餐",c:"套餐",p:1288,co:600,st:999,d:"bar",i:"/dishes/whisky.png",pk:true,pp:1288},
  ];
  for(const p of ps){await db.product.create({data:{storeId:1001,name:p.n,categoryId:cm[p.c],price:p.p,cost:p.co,stock:p.st,outputDept:p.d,imageUrl:p.i,isPackage:!!p.pk,packagePrice:p.pp||0,status:1,countToMinSpend:p.n==="矿泉水"}});}
  console.log("✅ 商品");
  const rs=[
    {no:"S01",nm:"迷你小包",ty:"小包",ar:"A区",cap:4,rate:28,min:0,mode:"hourly"},
    {no:"S02",nm:"迷你小包",ty:"小包",ar:"A区",cap:4,rate:28,min:0,mode:"hourly"},
    {no:"M01",nm:"舒适中包",ty:"中包",ar:"B区",cap:8,rate:48,min:200,mode:"hourly"},
    {no:"M02",nm:"舒适中包",ty:"中包",ar:"B区",cap:8,rate:48,min:200,mode:"hourly"},
    {no:"L01",nm:"豪华大包",ty:"大包",ar:"C区",cap:15,rate:88,min:500,mode:"hourly"},
    {no:"V01",nm:"VIP贵宾厅",ty:"VIP",ar:"V区",cap:20,rate:128,min:888,mode:"minspend"},
    {no:"V02",nm:"VIP贵宾厅",ty:"VIP",ar:"V区",cap:20,rate:128,min:888,mode:"minspend"},
  ];
  for(const r of rs){await db.ktvRoom.create({data:{storeId:1001,roomNo:r.no,roomName:r.nm,roomType:r.ty,area:r.ar,capacity:r.cap,hourlyRate:r.rate,minSpend:r.min,billingMode:r.mode,roomIp:"192.168.1."+(100+parseInt(r.no.replace(/\D/g,""))),status:"idle"}});}
  console.log("✅ 房台");
  const ms=[{cardNo:"M001",name:"张三",phone:"13800001111",level:"钻石",balance:3200,points:8800,totalSpent:28800,discount:0.8},{cardNo:"M002",name:"李四",phone:"13800002222",level:"金卡",balance:1500,points:4200,totalSpent:12600,discount:0.88}];
  for(const m of ms){await db.member.create({data:{storeId:1001,...m,status:1}});}
  console.log("✅ 会员");
  console.log("\n🎉 完成! cloud/cloud888 admin1001/001001 cashier1001/001234");
}
main().catch(e=>{console.error("❌",e.message);process.exit(1)}).finally(()=>db.$disconnect());
