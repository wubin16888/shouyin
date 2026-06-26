# KTV 云边协同门店管理系统 — 部署指南

## 系统要求
- NAS 支持 Docker（群晖/威联通/铁威马等均可）
- 或 NAS 支持 Node.js 18+ / Bun
- 1GB 以上内存
- 1GB 以上磁盘空间

## 方式一：Docker 部署（推荐，最简单）

### 1. 把代码放到 NAS
```bash
# 在 NAS 上找个目录
cd /volume1/docker
git clone <你的仓库地址> ktv-system
cd ktv-system
```

### 2. 一键启动
```bash
docker-compose up -d --build
```
首次构建约 5-10 分钟，会自动：
- 安装依赖
- 生成 Prisma Client
- 构建 Next.js
- 启动服务

### 3. 初始化数据（只需一次）
```bash
# 进入容器执行 seed
docker exec -it ktv-system sh -c "npx prisma db push && node prisma/seed.js"
```

### 4. 访问
浏览器打开 `http://NAS的IP:3000`

### 5. 数据持久化
数据库和图片已通过 volume 挂载到 `./data/` 目录，重启容器数据不丢。

### 更新版本
```bash
git pull
docker-compose up -d --build
```

## 方式二：Node.js 直接部署

### 1. 安装 Node.js 18+ 或 Bun
```bash
# 群晖：套件中心安装 Node.js
# 或用 nvm 安装
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
```

### 2. 拉代码 + 安装
```bash
git clone <你的仓库地址> ktv-system
cd ktv-system
npm install --legacy-peer-deps
```

### 3. 配置环境
```bash
cp .env.example .env
# 编辑 .env，确认 DATABASE_URL 路径
```

### 4. 初始化数据库
```bash
npx prisma db push
npx prisma generate
bun run db:seed         # 云端数据
bun run db:seed-ktv     # KTV数据
bun run db:seed-ktv-full # 完整KTV数据
bun run db:seed-templates # 打印模板
```

### 5. 构建 + 运行
```bash
npm run build
npm run start
# 或用 pm2 守护
npm install -g pm2
pm2 start npm --name ktv-system -- start
pm2 save
pm2 startup  # 开机自启
```

## 方式三：内网穿透（外网访问）

NAS 在内网，外网访问需要：
- **群晖**：控制面板 → 外部访问 → 反向代理，把 3000 端口代理出去
- **通用**：用 frp / ngrok / cloudflare tunnel
- 配合域名 + HTTPS 证书（微信小程序需要 HTTPS）

## 默认账号

| 角色 | 用户名 | 密码 | 权限 |
|------|--------|------|------|
| 门店管理员 | admin1007 | 009999 | 全部模块 |
| 测试员工 | emp1001_10 | 001234 | 收银系统 |

密码规则：手机号后6位。可在系统维护→人事里改。

## 备份

### 数据库备份
```bash
# 定期备份 SQLite 文件
cp ./data/db/custom.db ./backup/custom-$(date +%Y%m%d).db
```

### 群晖定时备份
控制面板 → 任务计划 → 新增 → 用户定义脚本：
```bash
cp /volume1/docker/ktv-system/data/db/custom.db /volume1/backup/ktv-$(date +%Y%m%d).db
```

## 常见问题

**Q: 构建失败？**
A: 检查 Node.js 版本 ≥ 18，内存 ≥ 1GB。`--legacy-peer-deps` 解决依赖冲突。

**Q: 数据库锁死？**
A: SQLite 并发有限，多门店高频写入建议换 PostgreSQL。改 .env 的 DATABASE_URL 即可。

**Q: 微信小程序对接？**
A: 小程序请求地址必须是 HTTPS 域名，配置反向代理 + 证书后，小程序调 `https://你的域名/api/xxx`。

**Q: 图片不显示？**
A: 确保 `./data/public/dishes/` 目录有图片文件，volume 挂载正确。

## 技术栈
- Next.js 16 + TypeScript + Tailwind CSS 4 + shadcn/ui
- Prisma ORM + SQLite（可换 PostgreSQL）
- Zustand 状态管理
- z-ai-web-dev-sdk（AI 助手，无需 KEY）
