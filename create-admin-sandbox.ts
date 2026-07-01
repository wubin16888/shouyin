import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
  // 先确保门店存在
  await db.store.upsert({
    where: { storeId: 1001 },
    update: {},
    create: {
      storeId: 1001,
      storeName: "测试门店",
      storeToken: "test_token",
      region: "华东",
      status: 1
    }
  });
  
  await db.employee.upsert({
    where: { username: 'cloud' },
    update: {
       password: 'cloud123',
       status: 1
    },
    create: {
      id: 'admin_cloud_001',
      username: 'cloud',
      password: 'cloud123',
      name: '超级管理员',
      role: 'cloud_admin',
      position: 'manager',
      isStoreAdmin: true,
      status: 1,
      storeId: 1001,
      discount: 1.0
    }
  });
  console.log('✅ Store and Admin created');
}
main().finally(() => db.$disconnect())
