# V2-RESTORE — 前端修复代理（frontend-fix）

## 任务
多个功能因 git reset 丢失，需恢复。约束：只改 2 个文件
- 文件1: `src/components/layout/AppShell.tsx`
- 文件2: `src/components/public/ApplyPage.tsx`

## 已读上下文
- `worklog.md` 了解项目：V2 系列 KTV 收银/出品/财务/AI/系统维护全功能；V2-AUTH 加门店申请+员工入职+登录权限；V2-JOIN 补入职码审核
- `src/store/auth-store.ts` — AuthUser 接口（id/name/username/role/position/isStoreAdmin/storeId/storeName/discount，无 userType 字段）
- `src/store/industry-store.ts` — template/icon/name
- `src/app/page.tsx` — AppShell 仅在 user 已登录时渲染；modules 通过 allowedModules 传入；onLogout 传入
- `src/app/api/auth/login/route.ts` — 登录返回 employee 无 userType
- `src/lib/industry.ts` — 4 行业模板 ktv/supermarket/billiards/restaurant（+ custom）
- `src/components/ui/dialog.tsx` — Dialog/DialogContent/DialogHeader/DialogTitle/DialogDescription/DialogFooter 全部可导出
- `src/hooks/use-toast.ts` — useToast 返回 { toast }，toast({ title, description, variant }) 标准签名

## 工作记录

### 文件1: AppShell.tsx（8 处修改）

1. **lucide-react imports** — 加 `KeyRound, LogOut`
2. **UI imports** — 加 `Dialog/DialogContent/DialogHeader/DialogTitle/DialogDescription/DialogFooter`、`Input`、`Label`、`useToast`
3. **顶栏右侧布局重构**（user-info + 改密/退出）
   - 原 `登录` Button 包裹 `{!user && (...)}`：未登录时显示，登录后隐藏（AppShell 只在已登录渲染，所以实际永不显示，但保留代码语义清晰）
   - **主题切换前**加 user 信息卡：圆形渐变头像（用户名首字符）+ 用户名 + 副标题（云端管理员/门店管理员/角色）。`user.userType` 字段 AuthUser 接口无此定义，用 `(user as any).userType === "cloud_admin"` 安全访问，eslint 配置已关 `no-explicit-any`
   - **主题切换后**加 改密 按钮（`{user && ...}`，调 setPwOpen(true)）+ 退出 按钮（`{onLogout && ...}`，confirm 后 onLogout + reload）
4. **侧边栏 allowedModules 过滤** — `NAV_GROUPS.map` 内取 `visibleItems = allowedModules ? group.items.filter(item => allowedModules.includes(item.key)) : group.items`；空数组 `return null` 跳过整个分组；`{group.items.map` 改为 `{visibleItems.map`
5. **模块标题旁门店名 Badge** — `</h1>` 后加 `{user?.storeName && <Badge variant="outline" className="border-emerald-700/40 bg-emerald-950/40 text-emerald-300 text-xs ml-2">{template.icon} {user.storeName}</Badge>}`
6. **footer 前加修改密码弹窗** — `{pwOpen && <ChangePwDialog username={user?.username ?? ""} onClose={() => setPwOpen(false)} />}`
7. **文件末尾加 ChangePwDialog 组件** — 函数组件，3 Input（原密码/新密码/确认密码）+ DialogHeader KeyRound 图标 + 校验（必填/两次一致/新密码≥4位）+ POST `/api/auth/change-password` `{ username, oldPassword, newPassword }` + toast 反馈 + Enter 键提交
8. **AI 主题 CSS 变量** — 已存在于根 div style（`--ai-bg/--ai-card-bg/--ai-text/--ai-border/--ai-accent/--ai-glow/--ai-sidebar-bg/--ai-header-bg/--ai-radius/--ai-shadow/--ai-room-shadow/--ai-room-border/--ai-text-muted`），无需新增

### 文件2: ApplyPage.tsx（2 处修改）

1. **imports 调整** — 移除 `Select/SelectContent/SelectItem/SelectTrigger/SelectValue`；加 `cn` from `@/lib/utils`；定义 `INDUSTRY_OPTIONS`（4 行业：KTV 🎤 / 超市 🛒 / 台球室 🎱 / 饭店 🍽️，各带 desc）
2. **业态 Select 替换为行业卡片网格** — 原 2 列布局（区域 + 业态 Select）拆为：区域 Input 独立一行 + 业态 4 卡片 grid-cols-2 gap-3。卡片样式：选中态 emerald 边框 + emerald-950/40 背景 + ring-1 + shadow；未选中 slate-700 边框 + slate-900/60 背景 + hover slate-800/60。每卡片：emoji 2xl + 标签（选中 emerald-300，未选中 slate-200）+ desc 灰色小字

## 验证

- ✅ `bun run lint`：0 errors / 0 warnings（exit 0）
- ✅ dev server 编译成功（dev.log 末尾 "✓ Compiled in 175ms" + 持续 200 响应：`/api/ktv/rooms` `/api/ktv/dashboard` `/api/dashboard` 等）
- ✅ 中途 dev.log 曾报 "Module not found: Can't resolve 'components/ui/button'"（MultiEdit 误写为 `components/ui/button` 而非 `@/components/ui/button`），Edit 修复后编译恢复正常

## 注意事项

- **`/api/auth/change-password` 后端路由未实现**：本任务约束"只改 2 个文件"，前端 ChangePwDialog 调用此端点时会拿到 404。如需真正可用，需后续代理补该 route（POST `{ username, oldPassword, newPassword }`，校验后更新 Employee.password）
- **`user.userType` 字段 AuthUser 接口未定义**：当前用 `(user as any).userType` 兼容；如后续要支持云端管理员，需在 auth-store 的 AuthUser 接口加 `userType?: "cloud_admin" | "store"`
- AppShell 仅在已登录时渲染（page.tsx 中 `if (!user) return LoginPage`），所以 `{!user && 登录按钮}` 实际永不显示，但保留代码语义

## 修改文件
- `/home/z/my-project/src/components/layout/AppShell.tsx`（286→547 行）
- `/home/z/my-project/src/components/public/ApplyPage.tsx`（124→138 行）
