const{PrismaClient}=require("@prisma/client");const db=new PrismaClient();
async function main(){
  const emps = await db.employee.findMany({select:{name:true,username:true,password:true,role:true,storeId:true,status:true,isStoreAdmin:true}});
  console.log("员工总数:", emps.length);
  emps.forEach(e=>console.log(`  ${e.name} | username=${e.username} | pwd=${e.password} | role=${e.role} | store=${e.storeId} | status=${e.status}`));
  const stores = await db.store.findMany({select:{storeId:true,storeName:true}});
  console.log("门店:", stores.map(s=>`${s.storeId}:${s.storeName}`).join(", "));
  const apps = await db.storeApplication.findMany({select:{storeName:true,businessType:true,status:true,createdStoreId:true}});
  console.log("申请:", apps.length, "条");
  apps.forEach(a=>console.log(`  ${a.storeName} | ${a.businessType} | ${a.status} | storeId=${a.createdStoreId}`));
}
main().catch(e=>console.error(e.message)).finally(()=>db.$disconnect());
