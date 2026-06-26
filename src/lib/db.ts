import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// 检测缓存的 client 是否缺少新模型（schema 更新后旧 client 仍存在 globalThis 缓存中）
// 若检测到模型缺失，则重建 client（Turbopack 热重载后会用最新的 PrismaClient 类）
function makeClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

let db = globalForPrisma.prisma ?? makeClient();
// 若缓存的 client 不包含 PrintTemplate（schema 后追加），重建一次
if (!(db as unknown as { printTemplate?: unknown }).printTemplate) {
  db = makeClient();
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

export { db };