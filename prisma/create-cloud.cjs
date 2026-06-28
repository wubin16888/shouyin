const{PrismaClient}=require("@prisma/client");const db=new PrismaClient();
async function main(){
  await db.store.upsert({where:{storeId:1001},update:{},create:{storeId:1001,storeName:"北京中关村店",storeToken:"token_1001",region:"华北",status:1,wsStatus:"online"}});
  await db.employee.upsert({where:{username:"cloud"},update:{role:"cloud_admin",isStoreAdmin:false,password:"cloud888",status:1},create:{storeId:1001,name:"云服务器管理员",phone:"13900000000",position:"manager",department:"云端",role:"cloud_admin",discount:1,status:1,username:"cloud",password:"cloud888",isStoreAdmin:false,resetMonth:new Date().getMonth()+1}});
  await db.employee.upsert({where:{username:"admin1001"},update:{},create:{storeId:1001,name:"门店管理员",phone:"13900001001",position:"manager",department:"管理层",role:"admin",discount:0.8,status:1,username:"admin1001",password:"001001",isStoreAdmin:true,resetMonth:new Date().getMonth()+1}});
  await db.employee.upsert({where:{username:"cashier1001"},update:{},create:{storeId:1001,name:"测试收银员",phone:"13800001234",position:"cashier",department:"收银部",role:"cashier",discount:1,status:1,username:"cashier1001",password:"001234",isStoreAdmin:false,resetMonth:new Date().getMonth()+1}});
  await db.employee.upsert({where:{username:"bar1001"},update:{},create:{storeId:1001,name:"测试吧台",phone:"13800005678",position:"bartender",department:"吧台部",role:"production",discount:1,status:1,username:"bar1001",password:"005678",isStoreAdmin:false,resetMonth:new Date().getMonth()+1}});
  console.log("✅ 账号创建完成: cloud/cloud888 admin1001/001001 cashier1001/001234 bar1001/005678");
}
main().catch(e=>{console.error("❌",e.message);process.exit(1)}).finally(()=>db.$disconnect());
