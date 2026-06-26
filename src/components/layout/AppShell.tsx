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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUIStore } from "@/store/ui-store";

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
}

export function AppShell({ active, onNavigate, children }: AppShellProps) {
  const { theme, toggleTheme, sidebarOpen, setSidebarOpen } = useUIStore();
  const [onlineCount, setOnlineCount] = useState<number | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

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
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* 顶栏 — 渐变 + 玻璃质感 */}
      <header className="sticky top-0 z-40 border-b border-slate-700/50 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-900/70">
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
                KTV 管理系统
              </span>
              <span className="hidden sm:inline text-[10px] text-slate-500 tracking-wider uppercase">
                Cloud · Edge · Sync
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { window.location.href = "/?login=1"; }}
              className="text-slate-300 hover:bg-slate-800/60 hover:text-emerald-300 gap-1.5"
            >
              <LogIn className="h-4 w-4" /> 登录
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="切换主题"
              className="text-slate-300 hover:bg-slate-800/60 hover:text-white"
            >
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* 侧边栏 — 220px + 玻璃质感 + 精致分组 */}
        <aside
          className={cn(
            "fixed md:sticky top-16 z-30 h-[calc(100vh-4rem)] w-[220px] shrink-0 border-r border-slate-700/50 bg-slate-900/95 backdrop-blur-xl transition-transform overflow-y-auto",
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          )}
        >
          <nav className="flex h-full flex-col gap-5 p-4">
            {NAV_GROUPS.map((group) => {
              const GroupIcon = group.icon;
              return (
                <div key={group.title} className="space-y-1.5">
                  {/* 分组标题：小图标 + 字母间距 */}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.18em]">
                    <GroupIcon className="h-3 w-3 text-slate-600" />
                    {group.title}
                  </div>
                  {group.items.map((item) => {
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
            </div>
            <p className="text-sm text-slate-400 mt-1.5 ml-4">{activeItem?.desc}</p>
          </div>
          {children}
        </main>
      </div>

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
