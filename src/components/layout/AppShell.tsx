// 主布局：分组侧边栏 + 渐变顶栏 + 内容区 + sticky footer
// 视觉升级：玻璃质感 + 精致分组导航 + 220px 侧边栏

"use client";

import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Store,
  Settings2,
  RefreshCw,
  BarChart3,
  ScrollText,
  UtensilsCrossed,
  Cloud,
  Music2,
  ShoppingBag,
  Users,
  CalendarClock,
  Menu,
  X,
  Sun,
  Moon,
  ClipboardList,
  CreditCard,
  PieChart,
  Wallet,
  ChefHat,
  Cog,
  Sparkles,
  ChevronRight,
  LogIn,
  KeyRound,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useUIStore } from "@/store/ui-store";
import { useAuth as useAuthStore } from "@/store/auth-store";
import { useIndustry } from "@/store/industry-store";

export type ModuleKey =
  // 云端管理
  | "dashboard"
  | "stores"
  | "config"
  | "sync"
  | "reports"
  | "audit"
  // KTV 业务（4 核心模块）
  | "system"
  | "cashier"
  | "production"
  | "finance"
  | "ai-assistant"
  // 旧版 KTV（更多功能）
  | "ktv-rooms"
  | "ktv-order"
  | "ktv-checkout"
  | "ktv-reservations"
  // 通用
  | "pos"
  | "members";

interface NavItem {
  key: ModuleKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
}

interface NavGroup {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "KTV 业务",
    icon: Music2,
    items: [
      { key: "system", label: "系统维护", icon: Cog, desc: "配置中心（商品/口味/赠送/权限/主题）" },
      { key: "cashier", label: "收银系统", icon: Wallet, desc: "房态图 / 开台 / 点单 / 买单" },
      { key: "production", label: "出品系统", icon: ChefHat, desc: "吧台 / 厨房 / 水果房出单" },
      { key: "finance", label: "财务查询", icon: PieChart, desc: "经营总览 / 提成 / 账单" },
      { key: "ai-assistant", label: "AI 经营助手", icon: Sparkles, desc: "智能问答 / 经营建议" },
    ],
  },
  {
    title: "云端管理",
    icon: Cloud,
    items: [
      { key: "dashboard", label: "总览仪表盘", icon: LayoutDashboard, desc: "KPI 与实时概览" },
      { key: "stores", label: "门店监控", icon: Store, desc: "连接状态与限流" },
      { key: "config", label: "配置中心", icon: Settings2, desc: "配置下发与回滚" },
      { key: "sync", label: "数据同步", icon: RefreshCw, desc: "同步日志与冲突" },
      { key: "reports", label: "连锁报表", icon: BarChart3, desc: "多门店营收分析" },
      { key: "audit", label: "审计日志", icon: ScrollText, desc: "操作追溯" },
    ],
  },
  {
    title: "更多功能",
    icon: ShoppingBag,
    items: [
      { key: "ktv-rooms", label: "包厢看板", icon: Music2, desc: "开台 / 结账 / 状态" },
      { key: "ktv-order", label: "点单送房", icon: ClipboardList, desc: "酒水零食点单" },
      { key: "ktv-checkout", label: "开台结账", icon: CreditCard, desc: "合并结算与折扣" },
      { key: "ktv-reservations", label: "预订管理", icon: CalendarClock, desc: "时段预订" },
      { key: "members", label: "会员系统", icon: Users, desc: "储值 / 积分" },
      { key: "pos", label: "POS 收银", icon: UtensilsCrossed, desc: "超市收银演示" },
    ],
  },
];

const ALL_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

interface AppShellProps {
  active: ModuleKey;
  onNavigate: (key: ModuleKey) => void;
  children: React.ReactNode;
  allowedModules?: string[];
  onLogout?: () => void;
}

export function AppShell({ active, onNavigate, children, allowedModules, onLogout }: AppShellProps) {
  const { theme, toggleTheme, sidebarOpen, setSidebarOpen } = useUIStore();
  const [onlineCount, setOnlineCount] = useState<number | null>(null);
  const [pwOpen, setPwOpen] = useState(false);
  const { user } = useAuthStore();
  const { template, loadFromServer } = useIndustry();

  useEffect(() => { loadFromServer(); }, [loadFromServer]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // 读取 AI 主题配色（页面背景/卡片背景/文字色/光感/边框/阴影）
  const [themeColors, setThemeColors] = useState<{
    bg?: string; card?: string; text?: string;
    visual?: {
      borderColor?: string; borderRadius?: number; boxShadow?: string;
      glowEffect?: string; cardBgGradient?: string; headerBg?: string;
      sidebarBg?: string; accentColor?: string; roomShadow?: string;
      roomBorder?: string; textMuted?: string;
    };
  }>({});
  useEffect(() => {
    let cancelled = false;
    const loadTheme = async () => {
      try {
        // 从 localStorage 读门店 ID
        let storeId = 1001;
        try {
          const authStr = localStorage.getItem("ktv-auth");
          if (authStr) {
            const auth = JSON.parse(authStr);
            if (auth?.state?.user?.storeId) storeId = auth.state.user.storeId;
          }
        } catch {}
        const res = await fetch(`/api/sys/config?category=system&storeId=${storeId}`);
        const body = await res.json();
        if (!cancelled && body.data) {
          const cfgs = body.data;
          const bg = cfgs.find((c: any) => c.configKey === "page_bg_color")?.configValue;
          const card = cfgs.find((c: any) => c.configKey === "card_bg_color")?.configValue;
          const text = cfgs.find((c: any) => c.configKey === "text_color")?.configValue;
          const visualRaw = cfgs.find((c: any) => c.configKey === "theme_visual")?.configValue;
          let visual: any = undefined;
          if (visualRaw) { try { visual = JSON.parse(visualRaw); } catch {} }
          setThemeColors({ bg, card, text, visual });
        }
      } catch { /* ignore */ }
    };
    loadTheme();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/dashboard");
        const body = await res.json();
        if (!cancelled && body?.data) setOnlineCount(body.data.onlineStores);
      } catch {
        /* ignore */
      }
    };
    load();
    const t = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const activeItem = ALL_ITEMS.find((n) => n.key === active);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: themeColors.bg || undefined,
        color: themeColors.text || undefined,
        // 用 CSS 变量让所有子组件继承 AI 主题色
        "--ai-bg": themeColors.bg || "transparent",
        "--ai-card-bg": themeColors.card || "transparent",
        "--ai-text": themeColors.text || "inherit",
        "--ai-border": themeColors.visual?.borderColor || "rgba(148,163,184,0.2)",
        "--ai-accent": themeColors.visual?.accentColor || "#059669",
        "--ai-glow": themeColors.visual?.glowEffect || "none",
        "--ai-sidebar-bg": themeColors.visual?.sidebarBg || "transparent",
        "--ai-header-bg": themeColors.visual?.headerBg || "transparent",
        "--ai-radius": themeColors.visual?.borderRadius ? `${themeColors.visual.borderRadius}px` : "12px",
        "--ai-shadow": themeColors.visual?.boxShadow || "none",
        "--ai-room-shadow": themeColors.visual?.roomShadow || "none",
        "--ai-room-border": themeColors.visual?.roomBorder || "none",
        "--ai-text-muted": themeColors.visual?.textMuted || "rgba(148,163,184,0.8)",
      } as React.CSSProperties}
    >
      {/* 顶栏 — 渐变 + 玻璃质感 + AI 主题 */}
      <header
        className="sticky top-0 z-40 border-b backdrop-blur-xl"
        style={{
          background: themeColors.visual?.headerBg || "linear-gradient(to right, #0f172a, #1e293b, #0f172a)",
          borderColor: themeColors.visual?.borderColor || "rgba(148,163,184,0.2)",
        }}
      >
        {/* 顶部高光线 */}
        <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-slate-300 hover:bg-slate-800/60 hover:text-white"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="切换菜单"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* 精致 Logo 区 */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-emerald-500/30 blur-md" />
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-900/40">
                <Music2 className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm sm:text-base font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                {template.icon} {template.name}管理系统
              </span>
              <span className="hidden sm:inline text-[10px] text-emerald-400/80 tracking-wider font-medium">
                {user?.storeName ?? "未指定门店"}
              </span>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {onlineCount !== null && (
              <Badge
                variant="secondary"
                className="hidden sm:flex items-center gap-1.5 border border-emerald-700/40 bg-emerald-950/40 text-emerald-300 px-2.5 py-1"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="font-medium tabular-nums">{onlineCount}</span>
                <span className="text-emerald-400/80">门店在线</span>
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { window.location.href = "/?apply=1"; }}
              className="hidden sm:flex text-slate-300 hover:bg-slate-800/60 hover:text-emerald-300 gap-1.5"
            >
              <Store className="h-4 w-4" /> 门店申请
            </Button>
            {!user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { window.location.href = "/?login=1"; }}
                className="text-slate-300 hover:bg-slate-800/60 hover:text-emerald-300 gap-1.5"
              >
                <LogIn className="h-4 w-4" /> 登录
              </Button>
            )}
            {user && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-800/60 border border-slate-700/50">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {user.name.slice(0, 1)}
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs font-medium text-slate-200 leading-tight">{user.name}</div>
                  <div className="text-[10px] text-slate-500 leading-tight">
                    {(user as any).userType === "cloud_admin" ? "☁️ 云端管理员" : `${user.storeName ?? ""} · ${user.isStoreAdmin ? "门店管理员" : user.role}`}
                  </div>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="切换主题"
              className="text-slate-300 hover:bg-slate-800/60 hover:text-white"
            >
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
            {user && (
              <Button variant="ghost" size="sm" onClick={() => setPwOpen(true)}
                className="text-slate-400 hover:bg-slate-800/60 hover:text-emerald-300 gap-1.5">
                <KeyRound className="h-4 w-4" /><span className="hidden sm:inline">改密</span>
              </Button>
            )}
            {onLogout && (
              <Button variant="ghost" size="sm" onClick={() => { if (confirm("确定退出？")) { onLogout(); window.location.reload(); } }}
                className="text-slate-400 hover:bg-red-950/40 hover:text-red-400 gap-1.5">
                <LogOut className="h-4 w-4" /><span className="hidden sm:inline">退出</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* 侧边栏 — 220px + 玻璃质感 + AI 主题 */}
        <aside
          className={cn(
            "fixed md:sticky top-16 z-30 h-[calc(100vh-4rem)] w-[220px] shrink-0 border-r backdrop-blur-xl transition-transform overflow-y-auto",
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          )}
          style={{
            backgroundColor: themeColors.visual?.sidebarBg || undefined,
            borderColor: themeColors.visual?.borderColor || "rgba(148,163,184,0.2)",
          }}
        >
          <nav className="flex h-full flex-col gap-5 p-4">
            {NAV_GROUPS.map((group) => {
              const GroupIcon = group.icon;
              const visibleItems = allowedModules ? group.items.filter((item) => allowedModules.includes(item.key)) : group.items;
              if (visibleItems.length === 0) return null;
              return (
                <div key={group.title} className="space-y-1.5">
                  {/* 分组标题：小图标 + 字母间距 */}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.18em]">
                    <GroupIcon className="h-3 w-3 text-slate-600" />
                    {group.title}
                  </div>
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = active === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => {
                          onNavigate(item.key);
                          setSidebarOpen(false);
                        }}
                        className={cn(
                          "group flex items-start gap-3 rounded-lg px-3 py-3 text-left transition-all w-full",
                          isActive
                            ? "bg-gradient-to-r from-emerald-950/60 to-slate-800/40 border border-emerald-700/40 shadow-sm shadow-emerald-950/30"
                            : "border border-transparent hover:bg-slate-800/60 hover:border-slate-700/50",
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
                            isActive
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-slate-800/60 text-slate-500 group-hover:text-slate-300",
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            className={cn(
                              "text-sm font-medium transition-colors",
                              isActive
                                ? "text-white"
                                : "text-slate-300 group-hover:text-slate-100",
                            )}
                          >
                            {item.label}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">
                            {item.desc}
                          </div>
                        </div>
                        {isActive && (
                          <ChevronRight className="h-3.5 w-3.5 text-emerald-400 mt-1 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* 移动端遮罩 */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 top-16 z-20 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* 主内容 */}
        <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8">
          <div className="mb-5 md:mb-7">
            <div className="flex items-center gap-2.5">
              <div className="h-6 w-1.5 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600" />
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                {activeItem?.label}
              </h1>
              {user?.storeName && (
                <Badge variant="outline" className="border-emerald-700/40 bg-emerald-950/40 text-emerald-300 text-xs ml-2">
                  {template.icon} {user.storeName}
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate-400 mt-1.5 ml-4">{activeItem?.desc}</p>
          </div>
          {children}
        </main>
      </div>

      {pwOpen && <ChangePwDialog username={user?.username ?? ""} onClose={() => setPwOpen(false)} />}

      {/* sticky footer */}
      <footer className="mt-auto border-t border-slate-800 bg-slate-950">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 sm:px-6 py-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Cloud className="h-3.5 w-3.5 text-emerald-600" />
            <span>云边协同门店管理系统 · KTV + 超市 · Next.js 16 + Prisma</span>
          </div>
          <div className="flex items-center gap-3">
            <span>边缘端：SQLite 离线缓存</span>
            <span className="hidden sm:inline text-slate-700">·</span>
            <span>云端：集中配置与同步</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// 修改密码弹窗 — 调 /api/auth/change-password
function ChangePwDialog({ username, onClose }: { username: string; onClose: () => void }) {
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const submit = async () => {
    if (!oldPw || !newPw || !confirmPw) {
      toast({ title: "请填写完整", variant: "destructive" });
      return;
    }
    if (newPw !== confirmPw) {
      toast({ title: "两次新密码不一致", variant: "destructive" });
      return;
    }
    if (newPw.length < 4) {
      toast({ title: "新密码至少 4 位", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, oldPassword: oldPw, newPassword: newPw }),
      });
      const body = await res.json();
      if (body.code === 200) {
        toast({ title: "密码已修改", description: "下次登录请使用新密码" });
        onClose();
      } else {
        toast({ title: "修改失败", description: body.msg, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "网络错误", description: String(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-100">
            <KeyRound className="h-5 w-5 text-emerald-400" />
            修改密码
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            账号：{username}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-slate-200">原密码</Label>
            <Input type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)}
              className="bg-slate-800/60 border-slate-700 text-slate-100" />
          </div>
          <div>
            <Label className="text-slate-200">新密码</Label>
            <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)}
              className="bg-slate-800/60 border-slate-700 text-slate-100" />
          </div>
          <div>
            <Label className="text-slate-200">确认新密码</Label>
            <Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              className="bg-slate-800/60 border-slate-700 text-slate-100" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}
            className="bg-slate-800 border-slate-700 text-slate-300">取消</Button>
          <Button onClick={submit} disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 gap-2">
            {loading ? "提交中..." : <><KeyRound className="h-4 w-4" /> 确认修改</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
