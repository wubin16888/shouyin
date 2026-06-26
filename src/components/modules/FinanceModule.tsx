// 财务/经理查询模块 — 经营分析前端（老板/经理视角）
// 深色商务质感 · 5 个页签：经营总览 / 今昨对比 / 订房提成 / 历史账单 / 本周趋势

"use client";

import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Download,
  Search,
  ChevronRight,
  ChevronDown,
  DollarSign,
  Receipt,
  DoorOpen,
  Users,
  Clock,
  CalendarDays,
  Crown,
  Activity,
  Filter,
  Printer,
  BarChart3,
  PieChart as PieChartIcon,
  ListOrdered,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceDot,
  LabelList,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import type {
  KtvRoomInfoV2,
  KtvDashboardSummary,
  BookingManagerInfo,
  KtvOrderInfoV2,
  ProductCategoryInfo,
} from "@/lib/types";
import { yuan, fullTime, payMethodLabel } from "@/components/common/format";

// 订单带订房经理字段（路由已返回 bookingManagerId/bookingManagerName）
type FOrder = KtvOrderInfoV2;

// ============ 房态配色（同收银：降低饱和度的专业配色） ============
const ROOM_STATUS: Record<
  string,
  { label: string; chip: string; dot: string; ring: string }
> = {
  idle: {
    label: "空闲",
    chip: "bg-emerald-600/15 text-emerald-300 border-emerald-600/40",
    dot: "bg-emerald-500",
    ring: "ring-emerald-600/30",
  },
  reserved: {
    label: "预订",
    chip: "bg-sky-600/15 text-sky-300 border-sky-600/40",
    dot: "bg-sky-500",
    ring: "ring-sky-600/30",
  },
  seated: {
    label: "带位",
    chip: "bg-amber-500/15 text-amber-300 border-amber-500/40",
    dot: "bg-amber-500",
    ring: "ring-amber-500/30",
  },
  in_use: {
    label: "已开",
    chip: "bg-rose-600/15 text-rose-300 border-rose-600/40",
    dot: "bg-rose-500",
    ring: "ring-rose-600/30",
  },
  cleaning: {
    label: "清扫",
    chip: "bg-violet-500/15 text-violet-300 border-violet-500/40",
    dot: "bg-violet-500",
    ring: "ring-violet-500/30",
  },
  maintenance: {
    label: "维修",
    chip: "bg-slate-600/15 text-slate-300 border-slate-600/40",
    dot: "bg-slate-500",
    ring: "ring-slate-600/30",
  },
};

// recharts 暗色 Tooltip 样式
const DARK_TOOLTIP = {
  contentStyle: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 8,
    color: "#f1f5f9",
    fontSize: 12,
  },
  labelStyle: { color: "#94a3b8", marginBottom: 4 },
  itemStyle: { color: "#f1f5f9" },
};

const CHART_COLORS = {
  emerald: "#059669",
  amber: "#f59e0b",
  sky: "#0284c7",
  rose: "#e11d48",
  slate: "#475569",
};

// ============ 日期工具 ============
function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}
function dateKey(d: Date): string {
  return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}
function weekdayShort(d: Date): string {
  return ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][d.getDay()];
}

// 同比涨跌（今日 vs 昨日），返回百分比与方向
function trend(today: number, yesterday: number): {
  pct: number;
  up: boolean | null;
} {
  if (yesterday === 0) {
    return { pct: today > 0 ? 100 : 0, up: today > 0 ? true : null };
  }
  const diff = ((today - yesterday) / yesterday) * 100;
  return { pct: Math.abs(Math.round(diff * 10) / 10), up: diff >= 0 };
}

// =====================================================================
// 主模块
// =====================================================================
export function FinanceModule() {
  const [tab, setTab] = useState("overview");

  return (
    <div className="rounded-2xl bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 min-h-[700px] border border-slate-800/50 shadow-xl shadow-black/20">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30">
            <Crown className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              财务 · 经理查询
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              经营数据分析 · 房态监控 · 提成核算 · 账单查询
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="bg-slate-900/60 border-slate-700 text-slate-300 gap-1.5 px-3 py-1"
        >
          <Activity className="h-3.5 w-3.5 text-emerald-400" />
          实时数据
        </Badge>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="bg-slate-900/60 border border-slate-700/50 p-1.5 h-auto flex flex-wrap gap-1 rounded-xl">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-300 rounded-lg transition-all"
          >
            经营总览
          </TabsTrigger>
          <TabsTrigger
            value="compare"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-300 rounded-lg transition-all"
          >
            今昨对比
          </TabsTrigger>
          <TabsTrigger
            value="commission"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-300 rounded-lg transition-all"
          >
            订房提成
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-300 rounded-lg transition-all"
          >
            历史账单
          </TabsTrigger>
          <TabsTrigger
            value="category-sales"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-300 rounded-lg transition-all"
          >
            分类销售
          </TabsTrigger>
          <TabsTrigger
            value="production-detail"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-300 rounded-lg transition-all"
          >
            出品明细
          </TabsTrigger>
          <TabsTrigger
            value="weekly"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-300 rounded-lg transition-all"
          >
            本周趋势
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab />
        </TabsContent>
        <TabsContent value="compare" className="mt-6">
          <CompareTab />
        </TabsContent>
        <TabsContent value="commission" className="mt-6">
          <CommissionTab />
        </TabsContent>
        <TabsContent value="history" className="mt-6">
          <HistoryTab />
        </TabsContent>
        <TabsContent value="category-sales" className="mt-6">
          <CategorySalesTab />
        </TabsContent>
        <TabsContent value="production-detail" className="mt-6">
          <ProductionDetailTab />
        </TabsContent>
        <TabsContent value="weekly" className="mt-6">
          <WeeklyTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// =====================================================================
// 共享数据 Hook：一次性加载 rooms / dashboard / paidOrders / managers
// =====================================================================
function useFinanceData() {
  const [rooms, setRooms] = useState<KtvRoomInfoV2[]>([]);
  const [dash, setDash] = useState<KtvDashboardSummary | null>(null);
  const [orders, setOrders] = useState<FOrder[]>([]);
  const [managers, setManagers] = useState<BookingManagerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshAt, setRefreshAt] = useState<Date | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [r, d, o, m] = await Promise.all([
        api.getKtvRooms(),
        api.getKtvDashboard(),
        api.getKtvOrders("paid"),
        api.getBookingManagers(),
      ]);
      setRooms(r);
      setDash(d);
      setOrders(o);
      setManagers(m);
      setRefreshAt(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  return { rooms, dash, orders, managers, loading, refreshAt, reload: load };
}

// ============ 顶部刷新条 ============
function RefreshBar({
  refreshAt,
  onReload,
  loading,
  hint,
}: {
  refreshAt: Date | null;
  onReload: () => void;
  loading: boolean;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <p className="text-xs text-slate-400">
        {hint ?? "每 30 秒自动刷新"} ·
        {refreshAt ? ` 最近更新 ${refreshAt.toLocaleTimeString("zh-CN")}` : ""}
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={onReload}
        disabled={loading}
        className="gap-1 bg-slate-800/60 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        刷新
      </Button>
    </div>
  );
}

// =====================================================================
// 页签1：经营总览（实时）
// =====================================================================
function OverviewTab() {
  const { rooms, dash, loading, refreshAt, reload } = useFinanceData();

  const openRate =
    rooms.length > 0
      ? Math.round(
          (rooms.filter((r) => r.status === "in_use").length / rooms.length) *
            100,
        )
      : 0;

  const avgPerGuest =
    dash && dash.todayCheckouts > 0
      ? dash.todayRevenue / dash.todayCheckouts
      : 0;

  return (
    <div className="space-y-6">
      <RefreshBar refreshAt={refreshAt} onReload={reload} loading={loading} />

      {/* KPI 卡片 */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="今日营收"
          icon={<DollarSign className="h-4 w-4" />}
          value={dash ? yuan(dash.todayRevenue) : "—"}
          accent="emerald"
          loading={loading}
          sub={`今日已结 ${dash?.todayCheckouts ?? 0} 单`}
        />
        <KpiCard
          title="今日开台数"
          icon={<DoorOpen className="h-4 w-4" />}
          value={dash?.todayOrders ?? 0}
          accent="amber"
          loading={loading}
          sub={`进行中 ${dash ? dash.todayOrders - dash.todayCheckouts : 0} 台`}
        />
        <KpiCard
          title="今日已结账"
          icon={<Receipt className="h-4 w-4" />}
          value={dash?.todayCheckouts ?? 0}
          accent="sky"
          loading={loading}
          sub="已完成订单数"
        />
        <KpiCard
          title="客单价"
          icon={<Users className="h-4 w-4" />}
          value={yuan(avgPerGuest)}
          accent="rose"
          loading={loading}
          sub="已结账均值"
        />
      </div>

      {/* 实时房态看板 */}
      <Card className="bg-slate-800/80 border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-slate-100 flex items-center gap-2">
                <DoorOpen className="h-5 w-5 text-emerald-400" />
                实时房态看板
              </CardTitle>
              <CardDescription className="text-slate-400">
                共 {rooms.length} 间包厢
              </CardDescription>
            </div>
            {/* 开房率 */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-slate-400">开房率</div>
                <div className="text-2xl font-bold text-emerald-400">
                  {openRate}%
                </div>
              </div>
              <Separator orientation="vertical" className="h-10 bg-slate-700" />
              <div className="text-right">
                <div className="text-xs text-slate-400">已开 / 总数</div>
                <div className="text-lg font-semibold text-slate-100">
                  {rooms.filter((r) => r.status === "in_use").length} /{" "}
                  {rooms.length}
                </div>
              </div>
            </div>
          </div>

          {/* 图例 */}
          <div className="flex flex-wrap gap-3 mt-3">
            {Object.entries(ROOM_STATUS).map(([k, v]) => (
              <div
                key={k}
                className="flex items-center gap-1.5 text-xs text-slate-400"
              >
                <span className={`h-2.5 w-2.5 rounded-sm ${v.dot}`} />
                {v.label}
              </div>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-24 bg-slate-700/50" />
              ))}
            </div>
          ) : (
            <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {rooms.map((room) => {
                const meta = ROOM_STATUS[room.status] ?? ROOM_STATUS.idle;
                const elapsed = room.openedAt
                  ? Math.floor(
                      (Date.now() - new Date(room.openedAt).getTime()) / 60000,
                    )
                  : 0;
                return (
                  <div
                    key={room.id}
                    className={`rounded-lg border ${meta.chip} p-3 ring-1 ${meta.ring} min-h-[100px]`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-base text-slate-100">
                        {room.roomNo}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded border ${meta.chip}`}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {room.roomType} · {room.capacity}人
                    </div>
                    {room.status === "in_use" && (
                      <div className="mt-2 pt-2 border-t border-slate-700/60 text-[11px] space-y-0.5">
                        <div className="flex items-center gap-1 text-rose-300">
                          <Clock className="h-3 w-3" />
                          {elapsed} 分钟
                        </div>
                        {room.currentOrder && (
                          <div className="text-slate-300">
                            消费{" "}
                            <span className="font-semibold text-emerald-300">
                              {yuan(room.currentOrder.productFee)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 24小时营业趋势 */}
      <Card className="bg-slate-800/80 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-slate-100 flex items-center gap-2">
            <Activity className="h-5 w-5 text-amber-400" />
            24 小时营业趋势
          </CardTitle>
          <CardDescription className="text-slate-400">
            今日各小时营收（柱）与开台数
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full bg-slate-700/50" />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dash?.hourlyTrend ?? []}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="hour"
                    stroke="#64748b"
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    interval={1}
                  />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <Tooltip
                    {...DARK_TOOLTIP}
                    formatter={(value: number, name: string) =>
                      name === "营收"
                        ? [yuan(value), "营收"]
                        : [`${value} 单`, "开台数"]
                    }
                  />
                  <Bar
                    dataKey="revenue"
                    name="营收"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  >
                    {(dash?.hourlyTrend ?? []).map((entry, i) => (
                      <Cell
                        key={i}
                        fill={
                          entry.revenue > 0
                            ? CHART_COLORS.emerald
                            : "#1e293b"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// =====================================================================
// 页签2：今日 vs 昨日对比
// =====================================================================
function CompareTab() {
  const { dash, orders, loading, refreshAt, reload } = useFinanceData();

  const { today, yesterday } = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const yStart = new Date(todayStart);
    yStart.setDate(yStart.getDate() - 1);

    const yOrders = orders.filter((o) => {
      const d = new Date(o.openedAt);
      return d >= yStart && d < todayStart;
    });
    const yRevenue = yOrders.reduce((s, o) => s + o.totalAmount, 0);
    return {
      today: {
        revenue: dash?.todayRevenue ?? 0,
        orders: dash?.todayCheckouts ?? 0,
        opens: dash?.todayOrders ?? 0,
      },
      yesterday: {
        revenue: Math.round(yRevenue * 100) / 100,
        orders: yOrders.length,
        opens: yOrders.length,
      },
    };
  }, [orders, dash]);

  const tRev = trend(today.revenue, yesterday.revenue);
  const tOrd = trend(today.orders, yesterday.orders);
  const tOpen = trend(today.opens, yesterday.opens);

  // 对比图数据（营收缩为千元，与订单/开台同量级）
  const chartData = [
    {
      name: "营收(千元)",
      今日: Math.round(today.revenue / 10) / 100,
      昨日: Math.round(yesterday.revenue / 10) / 100,
      rawToday: today.revenue,
      rawYest: yesterday.revenue,
    },
    { name: "订单数", 今日: today.orders, 昨日: yesterday.orders },
    { name: "开台数", 今日: today.opens, 昨日: yesterday.opens },
  ];

  return (
    <div className="space-y-6">
      <RefreshBar refreshAt={refreshAt} onReload={reload} loading={loading} />

      <div className="grid gap-4 md:grid-cols-3">
        <CompareCard
          title="营收对比"
          icon={<DollarSign className="h-4 w-4" />}
          today={yuan(today.revenue)}
          yesterday={yuan(yesterday.revenue)}
          trend={tRev}
          loading={loading}
        />
        <CompareCard
          title="已结订单对比"
          icon={<Receipt className="h-4 w-4" />}
          today={`${today.orders} 单`}
          yesterday={`${yesterday.orders} 单`}
          trend={tOrd}
          loading={loading}
        />
        <CompareCard
          title="开台数对比"
          icon={<DoorOpen className="h-4 w-4" />}
          today={`${today.opens} 台`}
          yesterday={`${yesterday.opens} 台`}
          trend={tOpen}
          loading={loading}
        />
      </div>

      <Card className="bg-slate-800/80 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-slate-100">今昨双柱对比</CardTitle>
          <CardDescription className="text-slate-400">
            营收单位：千元 · 订单/开台单位：单/台
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-72 w-full bg-slate-700/50" />
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 16, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    tick={{ fontSize: 12, fill: "#cbd5e1" }}
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                  />
                  <Tooltip
                    {...DARK_TOOLTIP}
                    formatter={(value: number, name: string, props) => {
                      if (
                        name === "今日" &&
                        props.payload?.rawToday !== undefined
                      ) {
                        return [yuan(props.payload.rawToday), "今日营收"];
                      }
                      if (
                        name === "昨日" &&
                        props.payload?.rawYest !== undefined
                      ) {
                        return [yuan(props.payload.rawYest), "昨日营收"];
                      }
                      return [value, name];
                    }}
                  />
                  <Bar
                    dataKey="今日"
                    fill={CHART_COLORS.emerald}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={48}
                  />
                  <Bar
                    dataKey="昨日"
                    fill={CHART_COLORS.slate}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
              今日
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-slate-500" />
              昨日
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =====================================================================
// 页签3：订房提成表
// =====================================================================
function CommissionTab() {
  const { orders, managers, loading, refreshAt, reload } = useFinanceData();

  const rows = useMemo(() => {
    const map = new Map<
      string,
      { name: string; count: number; amount: number }
    >();
    for (const o of orders) {
      const name = o.bookingManagerName || "未指定";
      const cur = map.get(name) ?? { name, count: 0, amount: 0 };
      cur.count += 1;
      cur.amount += o.totalAmount;
      map.set(name, cur);
    }
    const rateByName = new Map(
      managers.map((m) => [m.name, m.commissionRate]),
    );
    return [...map.values()]
      .map((r) => {
        const rate = rateByName.get(r.name) ?? 0;
        return {
          ...r,
          rate,
          commission: Math.round(r.amount * rate * 100) / 100,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [orders, managers]);

  const total = rows.reduce(
    (acc, r) => ({
      count: acc.count + r.count,
      amount: acc.amount + r.amount,
      commission: acc.commission + r.commission,
    }),
    { count: 0, amount: 0, commission: 0 },
  );

  return (
    <div className="space-y-6">
      <RefreshBar refreshAt={refreshAt} onReload={reload} loading={loading} />

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="订房经理数"
          icon={<Users className="h-4 w-4" />}
          value={rows.length}
          accent="sky"
          loading={loading}
        />
        <KpiCard
          title="已结账订单"
          icon={<Receipt className="h-4 w-4" />}
          value={total.count}
          accent="amber"
          loading={loading}
        />
        <KpiCard
          title="订房消费总额"
          icon={<DollarSign className="h-4 w-4" />}
          value={yuan(total.amount)}
          accent="emerald"
          loading={loading}
        />
        <KpiCard
          title="应发提成合计"
          icon={<Crown className="h-4 w-4" />}
          value={yuan(total.commission)}
          accent="rose"
          loading={loading}
        />
      </div>

      <Card className="bg-slate-800/80 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-slate-100">订房提成明细表</CardTitle>
          <CardDescription className="text-slate-400">
            按订房经理聚合已结账订单 · 提成 = 消费总额 × 提成比例
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full bg-slate-700/50" />
          ) : rows.length === 0 ? (
            <div className="py-12 text-center text-slate-400">暂无数据</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 bg-slate-800/60 hover:bg-slate-800/60">
                    <TableHead className="text-slate-300 font-semibold">订房经理</TableHead>
                    <TableHead className="text-slate-300 font-semibold text-right">
                      订房数
                    </TableHead>
                    <TableHead className="text-slate-300 font-semibold text-right">
                      消费总额
                    </TableHead>
                    <TableHead className="text-slate-300 font-semibold text-right">
                      提成比例
                    </TableHead>
                    <TableHead className="text-slate-300 font-semibold text-right">
                      提成金额
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow
                      key={r.name}
                      className="border-slate-700/60 odd:bg-slate-800/30 hover:bg-slate-700/40 transition-colors"
                    >
                      <TableCell className="font-medium text-slate-100">
                        {r.name}
                      </TableCell>
                      <TableCell className="text-right text-slate-300 tabular-nums">
                        {r.count}
                      </TableCell>
                      <TableCell className="text-right text-slate-200 tabular-nums">
                        {yuan(r.amount)}
                      </TableCell>
                      <TableCell className="text-right text-amber-300 tabular-nums">
                        {(r.rate * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right font-semibold text-emerald-300 tabular-nums">
                        {yuan(r.commission)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t-2 border-slate-600 bg-slate-900/40 hover:bg-slate-900/40">
                    <TableCell className="font-bold text-slate-100">
                      合计
                    </TableCell>
                    <TableCell className="text-right font-bold text-slate-100 tabular-nums">
                      {total.count}
                    </TableCell>
                    <TableCell className="text-right font-bold text-slate-100 tabular-nums">
                      {yuan(total.amount)}
                    </TableCell>
                    <TableCell className="text-right text-slate-500">—</TableCell>
                    <TableCell className="text-right font-bold text-emerald-300 tabular-nums">
                      {yuan(total.commission)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// =====================================================================
// 页签4：历史账单查询
// =====================================================================
function HistoryTab() {
  const { orders, loading, refreshAt, reload } = useFinanceData();

  const [fRoom, setFRoom] = useState("");
  const [fCust, setFCust] = useState("");
  const [fFrom, setFFrom] = useState("");
  const [fTo, setFTo] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (fRoom && !o.roomNo.toLowerCase().includes(fRoom.toLowerCase()))
        return false;
      if (
        fCust &&
        !(o.customerName ?? "").toLowerCase().includes(fCust.toLowerCase())
      )
        return false;
      const od = new Date(o.openedAt);
      if (fFrom && od < new Date(fFrom + "T00:00:00")) return false;
      if (fTo && od > new Date(fTo + "T23:59:59")) return false;
      return true;
    });
  }, [orders, fRoom, fCust, fFrom, fTo]);

  const exportCsv = () => {
    const head = [
      "订单号",
      "包厢",
      "客户",
      "订房经理",
      "开台时间",
      "时长(分)",
      "包厢费",
      "商品费",
      "折扣",
      "实付",
      "支付方式",
      "状态",
    ];
    const lines = filtered.map((o) =>
      [
        o.orderNo,
        o.roomNo,
        o.customerName ?? "",
        o.bookingManagerName ?? "",
        fullTime(o.openedAt),
        o.durationMinutes,
        o.roomFee.toFixed(2),
        o.productFee.toFixed(2),
        o.discount.toFixed(2),
        o.totalAmount.toFixed(2),
        payMethodLabel(o.payMethod ?? ""),
        o.status,
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(","),
    );
    const csv = "\uFEFF" + [head.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ktv-bills-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <RefreshBar refreshAt={refreshAt} onReload={reload} loading={loading} />

      {/* 筛选 + 导出 */}
      <Card className="bg-slate-800/80 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Search className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-200">筛选与导出</span>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400">开始日期</label>
              <Input
                type="date"
                value={fFrom}
                onChange={(e) => setFFrom(e.target.value)}
                className="bg-slate-900/60 border-slate-700 text-slate-100 w-40"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400">结束日期</label>
              <Input
                type="date"
                value={fTo}
                onChange={(e) => setFTo(e.target.value)}
                className="bg-slate-900/60 border-slate-700 text-slate-100 w-40"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400">包厢号</label>
              <Input
                placeholder="如 V02"
                value={fRoom}
                onChange={(e) => setFRoom(e.target.value)}
                className="bg-slate-900/60 border-slate-700 text-slate-100 w-28"
              />
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
              <label className="text-xs text-slate-400">客户名</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <Input
                  placeholder="搜索客户"
                  value={fCust}
                  onChange={(e) => setFCust(e.target.value)}
                  className="bg-slate-900/60 border-slate-700 text-slate-100 pl-8"
                />
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFFrom("");
                setFTo("");
                setFRoom("");
                setFCust("");
              }}
              className="bg-slate-900/60 border-slate-700 text-slate-300 hover:bg-slate-700"
            >
              重置
            </Button>
            <Button
              size="sm"
              onClick={exportCsv}
              className="gap-1 bg-emerald-600 hover:bg-emerald-700"
            >
              <Download className="h-4 w-4" />
              导出 CSV
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => printHistoryBills(filtered)}
              disabled={filtered.length === 0}
              className="gap-1 bg-slate-900/60 border-slate-700 text-slate-200 hover:bg-slate-700"
            >
              <Printer className="h-4 w-4" />
              打印
            </Button>
          </div>
          <div className="text-xs text-slate-400 mt-3">
            共 {filtered.length} 条账单（已结账）
          </div>
        </CardContent>
      </Card>

      {/* 账单表格 */}
      <Card className="bg-slate-800/80 border-slate-700">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4">
              <Skeleton className="h-64 w-full bg-slate-700/50" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              未找到匹配账单
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[640px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-slate-800 shadow-md">
                  <TableRow className="border-slate-700 hover:bg-transparent">
                    <TableHead className="text-slate-300 font-semibold w-8"></TableHead>
                    <TableHead className="text-slate-300 font-semibold">订单号</TableHead>
                    <TableHead className="text-slate-300 font-semibold">包厢</TableHead>
                    <TableHead className="text-slate-300 font-semibold">客户</TableHead>
                    <TableHead className="text-slate-300 font-semibold">订房经理</TableHead>
                    <TableHead className="text-slate-300 font-semibold">开台时间</TableHead>
                    <TableHead className="text-slate-300 font-semibold text-right">时长</TableHead>
                    <TableHead className="text-slate-300 font-semibold text-right">包厢费</TableHead>
                    <TableHead className="text-slate-300 font-semibold text-right">商品费</TableHead>
                    <TableHead className="text-slate-300 font-semibold text-right">折扣</TableHead>
                    <TableHead className="text-slate-300 font-semibold text-right">实付</TableHead>
                    <TableHead className="text-slate-300 font-semibold">支付</TableHead>
                    <TableHead className="text-slate-300 font-semibold">状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((o) => {
                    const isOpen = expanded === o.id;
                    return (
                      <Fragment key={o.id}>
                        <TableRow
                          className="border-slate-700/60 odd:bg-slate-800/30 hover:bg-slate-700/40 cursor-pointer transition-colors"
                          onClick={() =>
                            setExpanded(isOpen ? null : o.id)
                          }
                        >
                          <TableCell className="text-slate-400">
                            {isOpen ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-300">
                            {o.orderNo}
                          </TableCell>
                          <TableCell className="text-slate-100 font-medium">
                            {o.roomNo}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {o.customerName || "散客"}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {o.bookingManagerName || "—"}
                          </TableCell>
                          <TableCell className="text-slate-400 text-xs">
                            {fullTime(o.openedAt)}
                          </TableCell>
                          <TableCell className="text-right text-slate-300 tabular-nums">
                            {o.durationMinutes}
                          </TableCell>
                          <TableCell className="text-right text-slate-300 tabular-nums">
                            {yuan(o.roomFee)}
                          </TableCell>
                          <TableCell className="text-right text-slate-300 tabular-nums">
                            {yuan(o.productFee)}
                          </TableCell>
                          <TableCell className="text-right text-emerald-300 tabular-nums">
                            {o.discount > 0 ? `-${yuan(o.discount)}` : "—"}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-emerald-300 tabular-nums">
                            {yuan(o.totalAmount)}
                          </TableCell>
                          <TableCell className="text-slate-300 text-xs">
                            {payMethodLabel(o.payMethod ?? "")}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
                            >
                              已结账
                            </Badge>
                          </TableCell>
                        </TableRow>
                        {isOpen && (
                          <TableRow className="border-slate-700/60 bg-slate-900/50 hover:bg-slate-900/50">
                            <TableCell colSpan={13} className="p-4">
                              <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-3">
                                <div className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                                  <Receipt className="h-3.5 w-3.5" />
                                  消费明细（{o.items?.length ?? 0} 项）
                                </div>
                                {o.items && o.items.length > 0 ? (
                                  <div className="overflow-x-auto">
                                    <Table>
                                      <TableHeader>
                                        <TableRow className="border-slate-700/60 hover:bg-transparent">
                                          <TableHead className="text-slate-400 text-xs">
                                            商品
                                          </TableHead>
                                          <TableHead className="text-slate-400 text-xs text-right">
                                            单价
                                          </TableHead>
                                          <TableHead className="text-slate-400 text-xs text-right">
                                            数量
                                          </TableHead>
                                          <TableHead className="text-slate-400 text-xs text-right">
                                            小计
                                          </TableHead>
                                          <TableHead className="text-slate-400 text-xs">
                                            状态
                                          </TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {o.items.map((it) => (
                                          <TableRow
                                            key={it.id}
                                            className="border-slate-700/40 hover:bg-transparent"
                                          >
                                            <TableCell className="text-slate-200 text-xs">
                                              {it.productName}
                                            </TableCell>
                                            <TableCell className="text-right text-slate-300 text-xs tabular-nums">
                                              {yuan(it.price)}
                                            </TableCell>
                                            <TableCell className="text-right text-slate-300 text-xs tabular-nums">
                                              ×{it.qty}
                                            </TableCell>
                                            <TableCell className="text-right text-slate-200 text-xs tabular-nums">
                                              {yuan(it.price * it.qty)}
                                            </TableCell>
                                            <TableCell className="text-xs">
                                              <Badge
                                                variant="outline"
                                                className={
                                                  it.status === "delivered"
                                                    ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                                                    : it.status === "cancelled"
                                                    ? "bg-rose-500/10 text-rose-300 border-rose-500/30"
                                                    : "bg-slate-500/10 text-slate-300 border-slate-500/30"
                                                }
                                              >
                                                {it.status === "delivered"
                                                  ? "已送达"
                                                  : it.status === "cancelled"
                                                  ? "已退"
                                                  : "待送"}
                                              </Badge>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                ) : (
                                  <div className="text-xs text-slate-500 py-2">
                                    无明细记录
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// =====================================================================
// 页签：分类销售
// =====================================================================
type CategorySalesData = {
  categorySales: Array<{ name: string; qty: number; amount: number; orderCount: number }>;
  deptSales: Array<{ name: string; qty: number; amount: number }>;
  productSales: Array<{ name: string; qty: number; amount: number; category: string }>;
  totalOrders: number;
  totalAmount: number;
};

function CategorySalesTab() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState<CategorySalesData | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const query = async () => {
    setLoading(true);
    try {
      const res = await api.getCategorySales(startDate || undefined, endDate || undefined);
      setData(res as CategorySalesData);
    } catch (e) {
      toast({ title: "查询失败", description: String(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    query();
  }, []);

  const totalAmt = data?.totalAmount ?? 0;
  const totalOrd = data?.totalOrders ?? 0;
  const catSales = data?.categorySales ?? [];
  const deptSales = data?.deptSales ?? [];
  const prodSales = (data?.productSales ?? []).slice(0, 20);

  const catChartData = catSales.map((c) => ({ name: c.name, amount: c.amount, qty: c.qty }));

  const deptLabel = (d: string) =>
    ({ bar: "吧台", kitchen: "厨房", fruit: "水果房", outside: "外卖" } as Record<string, string>)[d] ?? d;

  const handlePrint = () => {
    if (!data) return;
    printCategorySales(data, { startDate, endDate });
  };

  return (
    <div className="space-y-6">
      <RefreshBar
        refreshAt={null}
        onReload={query}
        loading={loading}
        hint="按需查询"
      />

      {/* 筛选 + KPI */}
      <Card className="bg-slate-800/80 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Filter className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-200">日期筛选</span>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400">开始日期</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-slate-900/60 border-slate-700 text-slate-100 w-44" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400">结束日期</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-slate-900/60 border-slate-700 text-slate-100 w-44" />
            </div>
            <Button size="sm" onClick={query} disabled={loading} className="gap-1 bg-emerald-600 hover:bg-emerald-700">
              <Search className="h-4 w-4" /> 查询
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setStartDate(""); setEndDate(""); }} className="bg-slate-900/60 border-slate-700 text-slate-300 hover:bg-slate-700">
              重置
            </Button>
            <Button size="sm" variant="outline" onClick={handlePrint} disabled={!data} className="gap-1 bg-slate-900/60 border-slate-700 text-slate-200 hover:bg-slate-700 ml-auto">
              <Printer className="h-4 w-4" /> 打印
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 顶部 KPI */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard title="总订单数" value={totalOrd} icon={<Receipt className="h-4 w-4" />} accent="amber" loading={loading} />
        <KpiCard title="总销售额" value={yuan(totalAmt)} icon={<DollarSign className="h-4 w-4" />} accent="emerald" loading={loading} />
        <KpiCard title="大类数" value={catSales.length} icon={<PieChartIcon className="h-4 w-4" />} accent="sky" loading={loading} />
        <KpiCard title="商品数" value={data?.productSales?.length ?? 0} icon={<ListOrdered className="h-4 w-4" />} accent="rose" loading={loading} />
      </div>

      {/* 按大类销售 */}
      <Card className="bg-slate-800/80 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-slate-100 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-400" /> 按大类销售
          </CardTitle>
          <CardDescription className="text-slate-400">大类销售额占比与销量</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-72 w-full bg-slate-700/50" />
          ) : catSales.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">暂无数据</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={catChartData} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                    <XAxis type="number" stroke="#475569" tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => `¥${v}`} />
                    <YAxis type="category" dataKey="name" stroke="#475569" tick={{ fontSize: 11, fill: "#cbd5e1" }} width={64} />
                    <Tooltip
                      {...DARK_TOOLTIP}
                      formatter={(v: number) => [yuan(v), "销售额"]}
                      cursor={{ fill: "#33415540" }}
                    />
                    <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                      {catChartData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS.emerald} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="overflow-x-auto max-h-72 overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-slate-800">
                    <TableRow className="border-slate-700 hover:bg-transparent">
                      <TableHead className="text-slate-300 text-xs">大类</TableHead>
                      <TableHead className="text-slate-300 text-xs text-right">销量</TableHead>
                      <TableHead className="text-slate-300 text-xs text-right">销售额</TableHead>
                      <TableHead className="text-slate-300 text-xs text-right">订单数</TableHead>
                      <TableHead className="text-slate-300 text-xs text-right">占比</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {catSales.map((c) => {
                      const pct = totalAmt > 0 ? (c.amount / totalAmt) * 100 : 0;
                      return (
                        <TableRow key={c.name} className="border-slate-700/60 odd:bg-slate-800/30 hover:bg-slate-700/40">
                          <TableCell className="text-slate-200 text-xs font-medium">{c.name}</TableCell>
                          <TableCell className="text-right text-slate-300 text-xs tabular-nums">{c.qty}</TableCell>
                          <TableCell className="text-right text-emerald-300 text-xs tabular-nums font-medium">{yuan(c.amount)}</TableCell>
                          <TableCell className="text-right text-slate-300 text-xs tabular-nums">{c.orderCount}</TableCell>
                          <TableCell className="text-right text-slate-400 text-xs tabular-nums">{pct.toFixed(1)}%</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 按出品点销售 */}
        <Card className="bg-slate-800/80 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-amber-400" /> 按出品点销售
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full bg-slate-700/50" />
            ) : deptSales.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">暂无数据</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-transparent">
                    <TableHead className="text-slate-300 text-xs">出品点</TableHead>
                    <TableHead className="text-slate-300 text-xs text-right">销量</TableHead>
                    <TableHead className="text-slate-300 text-xs text-right">销售额</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deptSales.map((d) => (
                    <TableRow key={d.name} className="border-slate-700/60 odd:bg-slate-800/30 hover:bg-slate-700/40">
                      <TableCell className="text-slate-200 text-xs font-medium">{deptLabel(d.name)}</TableCell>
                      <TableCell className="text-right text-slate-300 text-xs tabular-nums">{d.qty}</TableCell>
                      <TableCell className="text-right text-emerald-300 text-xs tabular-nums font-medium">{yuan(d.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* 商品销量排行 */}
        <Card className="bg-slate-800/80 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <ListOrdered className="h-5 w-5 text-sky-400" /> 商品销量排行 Top 20
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-72 w-full bg-slate-700/50" />
            ) : prodSales.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">暂无数据</div>
            ) : (
              <div className="overflow-y-auto max-h-72">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-slate-800">
                    <TableRow className="border-slate-700 hover:bg-transparent">
                      <TableHead className="text-slate-300 text-xs w-8">#</TableHead>
                      <TableHead className="text-slate-300 text-xs">商品</TableHead>
                      <TableHead className="text-slate-300 text-xs">大类</TableHead>
                      <TableHead className="text-slate-300 text-xs text-right">销量</TableHead>
                      <TableHead className="text-slate-300 text-xs text-right">销售额</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prodSales.map((p, i) => (
                      <TableRow key={p.name} className="border-slate-700/60 odd:bg-slate-800/30 hover:bg-slate-700/40">
                        <TableCell className="text-slate-500 text-xs tabular-nums">{i + 1}</TableCell>
                        <TableCell className="text-slate-200 text-xs font-medium">{p.name}</TableCell>
                        <TableCell className="text-slate-400 text-xs">{p.category}</TableCell>
                        <TableCell className="text-right text-slate-300 text-xs tabular-nums">{p.qty}</TableCell>
                        <TableCell className="text-right text-emerald-300 text-xs tabular-nums font-medium">{yuan(p.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// =====================================================================
// 页签：出品明细查询
// =====================================================================
type ProductionDetailItem = {
  id: string;
  productName: string;
  categoryName: string;
  qty: number;
  price: number;
  amount: number;
  flavors: string | null;
  outputDept: string;
  status: string;
  isGift: boolean;
  roomNo: string | null;
  orderNo: string | null;
  customerName: string | null;
  bookingManagerName: string | null;
  createdAt: string;
  deliveredAt: string | null;
};

const PD_DEPT_COLORS: Record<string, string> = {
  bar: "#f59e0b", kitchen: "#ef4444", fruit: "#10b981", outside: "#3b82f6",
};

function ProductionDetailTab() {
  const { toast } = useToast();
  const [dept, setDept] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [categories, setCategories] = useState<ProductCategoryInfo[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState<{ items: ProductionDetailItem[]; total: number; totalAmount: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  const query = async () => {
    setLoading(true);
    try {
      const res = await api.getProductionDetail({
        dept: dept && dept !== "all" ? dept : undefined,
        category: category && category !== "all" ? category : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setData(res as { items: ProductionDetailItem[]; total: number; totalAmount: number });
    } catch (e) {
      toast({ title: "查询失败", description: String(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    query();
  }, []);

  const deptLabel = (d: string) =>
    ({ bar: "吧台", kitchen: "厨房", fruit: "水果房", outside: "外卖" } as Record<string, string>)[d] ?? d;

  const flavorText = (flavors: string | null) => {
    if (!flavors) return "";
    try {
      const parsed = JSON.parse(flavors);
      return Array.isArray(parsed) ? parsed.map((f: { flavor: string }) => f.flavor).join("/") : "";
    } catch {
      return "";
    }
  };

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalAmount = data?.totalAmount ?? 0;

  const handlePrint = () => {
    if (!data) return;
    printProductionDetail(items, total, totalAmount, { dept, category, startDate, endDate });
  };

  return (
    <div className="space-y-6">
      <RefreshBar refreshAt={null} onReload={query} loading={loading} hint="按需查询" />

      <Card className="bg-slate-800/80 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Filter className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-200">筛选条件</span>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400">出品点</label>
              <Select value={dept} onValueChange={setDept}>
                <SelectTrigger className="bg-slate-900/60 border-slate-700 text-slate-100 w-32 h-9">
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                  <SelectItem value="all">全部出品点</SelectItem>
                  <SelectItem value="bar">吧台</SelectItem>
                  <SelectItem value="kitchen">厨房</SelectItem>
                  <SelectItem value="fruit">水果房</SelectItem>
                  <SelectItem value="outside">外卖</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400">大类</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-slate-900/60 border-slate-700 text-slate-100 w-36 h-9">
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-slate-100 max-h-72">
                  <SelectItem value="all">全部大类</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400">开始日期</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-slate-900/60 border-slate-700 text-slate-100 w-40 h-9" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400">结束日期</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-slate-900/60 border-slate-700 text-slate-100 w-40 h-9" />
            </div>
            <Button size="sm" onClick={query} disabled={loading} className="gap-1 bg-emerald-600 hover:bg-emerald-700 h-9">
              <Search className="h-4 w-4" /> 查询
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setDept("all"); setCategory("all"); setStartDate(""); setEndDate(""); }} className="bg-slate-900/60 border-slate-700 text-slate-300 hover:bg-slate-700 h-9">
              重置
            </Button>
            <Button size="sm" variant="outline" onClick={handlePrint} disabled={!data || items.length === 0} className="gap-1 bg-slate-900/60 border-slate-700 text-slate-200 hover:bg-slate-700 h-9 ml-auto">
              <Printer className="h-4 w-4" /> 打印
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 grid-cols-2">
        <KpiCard title="总条数" value={total} icon={<Receipt className="h-4 w-4" />} accent="amber" loading={loading} />
        <KpiCard title="总金额" value={yuan(totalAmount)} icon={<DollarSign className="h-4 w-4" />} accent="emerald" loading={loading} />
      </div>

      <Card className="bg-slate-800/80 border-slate-700">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4"><Skeleton className="h-64 w-full bg-slate-700/50" /></div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-slate-400">暂无符合条件的记录</div>
          ) : (
            <div className="overflow-x-auto max-h-[640px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-slate-800 shadow-md">
                  <TableRow className="border-slate-700 hover:bg-transparent">
                    <TableHead className="text-slate-300 font-semibold text-xs">时间</TableHead>
                    <TableHead className="text-slate-300 font-semibold text-xs">包厢</TableHead>
                    <TableHead className="text-slate-300 font-semibold text-xs">客户</TableHead>
                    <TableHead className="text-slate-300 font-semibold text-xs">订房经理</TableHead>
                    <TableHead className="text-slate-300 font-semibold text-xs">商品</TableHead>
                    <TableHead className="text-slate-300 font-semibold text-xs">大类</TableHead>
                    <TableHead className="text-slate-300 font-semibold text-xs">出品点</TableHead>
                    <TableHead className="text-slate-300 font-semibold text-xs">口味</TableHead>
                    <TableHead className="text-slate-300 font-semibold text-xs text-right">数量</TableHead>
                    <TableHead className="text-slate-300 font-semibold text-xs text-right">单价</TableHead>
                    <TableHead className="text-slate-300 font-semibold text-xs text-right">金额</TableHead>
                    <TableHead className="text-slate-300 font-semibold text-xs">状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((it) => (
                    <TableRow key={it.id} className="border-slate-700/60 odd:bg-slate-800/30 hover:bg-slate-700/40">
                      <TableCell className="text-slate-400 text-xs whitespace-nowrap">
                        {new Date(it.createdAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </TableCell>
                      <TableCell className="text-slate-200 text-xs font-medium">{it.roomNo ?? "—"}</TableCell>
                      <TableCell className="text-slate-300 text-xs">{it.customerName ?? "—"}</TableCell>
                      <TableCell className="text-slate-300 text-xs">{it.bookingManagerName ?? "—"}</TableCell>
                      <TableCell className="text-slate-100 text-xs">
                        {it.isGift && <span className="text-pink-400 mr-1">[赠]</span>}
                        {it.productName}
                      </TableCell>
                      <TableCell className="text-slate-300 text-xs">{it.categoryName}</TableCell>
                      <TableCell className="text-xs">
                        <span className="px-1.5 py-0.5 rounded border" style={{ color: PD_DEPT_COLORS[it.outputDept] ?? "#94a3b8", borderColor: `${PD_DEPT_COLORS[it.outputDept] ?? "#94a3b8"}40` }}>
                          {deptLabel(it.outputDept)}
                        </span>
                      </TableCell>
                      <TableCell className="text-amber-300 text-xs">{flavorText(it.flavors) || "—"}</TableCell>
                      <TableCell className="text-right text-slate-200 text-xs tabular-nums">×{it.qty}</TableCell>
                      <TableCell className="text-right text-slate-400 text-xs tabular-nums">{yuan(it.price)}</TableCell>
                      <TableCell className="text-right text-emerald-300 text-xs font-medium tabular-nums">{yuan(it.amount)}</TableCell>
                      <TableCell className="text-xs">
                        <Badge
                          variant="outline"
                          className={
                            it.status === "delivered"
                              ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                              : it.status === "cancelled"
                              ? "bg-rose-500/10 text-rose-300 border-rose-500/30"
                              : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                          }
                        >
                          {it.status === "delivered" ? "已送达" : it.status === "cancelled" ? "已退" : it.status === "printed" ? "已打单" : "待出"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// =====================================================================
// 打印辅助函数
// =====================================================================
function printHistoryBills(orders: FOrder[]) {
  const w = window.open("", "_blank", "width=1024,height=720");
  if (!w) return;
  const esc = (v: unknown) => String(v ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));
  const rows = orders.map((o) => `
    <tr>
      <td>${esc(o.orderNo)}</td>
      <td>${esc(o.roomNo)}</td>
      <td>${esc(o.customerName || "散客")}</td>
      <td>${esc(o.bookingManagerName || "")}</td>
      <td>${new Date(o.openedAt).toLocaleString("zh-CN")}</td>
      <td class="num">${o.durationMinutes}</td>
      <td class="num">${o.roomFee.toFixed(2)}</td>
      <td class="num">${o.productFee.toFixed(2)}</td>
      <td class="num">${o.discount.toFixed(2)}</td>
      <td class="num">${o.totalAmount.toFixed(2)}</td>
      <td>${esc(payMethodLabel(o.payMethod ?? ""))}</td>
    </tr>`).join("");

  const total = orders.reduce((s, o) => s + o.totalAmount, 0);
  const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
    <title>历史账单 · ${new Date().toLocaleString("zh-CN")}</title>
    <style>
      * { font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif; box-sizing: border-box; }
      body { margin: 20px; color: #1e293b; }
      h1 { font-size: 20px; margin: 0 0 4px; }
      .meta { color: #64748b; font-size: 12px; margin-bottom: 8px; }
      .total { color: #059669; font-size: 14px; font-weight: bold; margin-bottom: 12px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th { background: #1e293b; color: #f1f5f9; padding: 8px; text-align: left; font-weight: 600; }
      td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
      tr:nth-child(even) td { background: #f8fafc; }
      .num { text-align: right; font-variant-numeric: tabular-nums; }
      @media print { body { margin: 0; } }
    </style></head><body>
    <h1>历史账单</h1>
    <div class="meta">生成时间：${new Date().toLocaleString("zh-CN")} · 共 ${orders.length} 条</div>
    <div class="total">实付合计：¥${total.toFixed(2)}</div>
    <table>
      <thead><tr>
        <th>订单号</th><th>包厢</th><th>客户</th><th>订房经理</th><th>开台时间</th>
        <th class="num">时长(分)</th><th class="num">包厢费</th><th class="num">商品费</th>
        <th class="num">折扣</th><th class="num">实付</th><th>支付</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <script>window.onload = () => { setTimeout(() => window.print(), 300); };<\/script>
    </body></html>`;
  w.document.open();
  w.document.write(html);
  w.document.close();
}

function printCategorySales(data: CategorySalesData, filters: { startDate: string; endDate: string }) {
  const w = window.open("", "_blank", "width=1024,height=720");
  if (!w) return;
  const esc = (v: unknown) => String(v ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));
  const deptLabel = (d: string) => ({ bar: "吧台", kitchen: "厨房", fruit: "水果房", outside: "外卖" } as Record<string, string>)[d] ?? d;
  const catRows = data.categorySales.map((c) => {
    const pct = data.totalAmount > 0 ? (c.amount / data.totalAmount) * 100 : 0;
    return `<tr><td>${esc(c.name)}</td><td class="num">${c.qty}</td><td class="num">${c.amount.toFixed(2)}</td><td class="num">${c.orderCount}</td><td class="num">${pct.toFixed(1)}%</td></tr>`;
  }).join("");
  const deptRows = data.deptSales.map((d) => `<tr><td>${deptLabel(d.name)}</td><td class="num">${d.qty}</td><td class="num">${d.amount.toFixed(2)}</td></tr>`).join("");
  const prodRows = data.productSales.slice(0, 20).map((p, i) => `<tr><td class="num">${i + 1}</td><td>${esc(p.name)}</td><td>${esc(p.category)}</td><td class="num">${p.qty}</td><td class="num">${p.amount.toFixed(2)}</td></tr>`).join("");

  const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
    <title>分类销售 · ${new Date().toLocaleString("zh-CN")}</title>
    <style>
      * { font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif; box-sizing: border-box; }
      body { margin: 20px; color: #1e293b; }
      h1 { font-size: 20px; margin: 0 0 4px; }
      h2 { font-size: 15px; margin: 18px 0 6px; color: #0f172a; border-left: 3px solid #059669; padding-left: 8px; }
      .meta { color: #64748b; font-size: 12px; margin-bottom: 8px; }
      .kpis { display: flex; gap: 16px; margin-bottom: 8px; padding: 10px 16px; background: #f1f5f9; border-radius: 6px; }
      .kpis div { font-size: 13px; }
      .kpis b { font-size: 16px; color: #0f172a; margin-left: 6px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th { background: #1e293b; color: #f1f5f9; padding: 6px 8px; text-align: left; font-weight: 600; }
      td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; }
      tr:nth-child(even) td { background: #f8fafc; }
      .num { text-align: right; font-variant-numeric: tabular-nums; }
      @media print { body { margin: 0; } }
    </style></head><body>
    <h1>分类销售报表</h1>
    <div class="meta">区间：${filters.startDate || "不限"} ~ ${filters.endDate || "至今"} · 生成时间：${new Date().toLocaleString("zh-CN")}</div>
    <div class="kpis">
      <div>总订单<b>${data.totalOrders}</b></div>
      <div>总销售额<b>¥${data.totalAmount.toFixed(2)}</b></div>
      <div>大类数<b>${data.categorySales.length}</b></div>
    </div>
    <h2>按大类销售</h2>
    <table><thead><tr><th>大类</th><th class="num">销量</th><th class="num">销售额</th><th class="num">订单数</th><th class="num">占比</th></tr></thead><tbody>${catRows}</tbody></table>
    <h2>按出品点销售</h2>
    <table><thead><tr><th>出品点</th><th class="num">销量</th><th class="num">销售额</th></tr></thead><tbody>${deptRows}</tbody></table>
    <h2>商品销量排行 Top 20</h2>
    <table><thead><tr><th class="num">#</th><th>商品</th><th>大类</th><th class="num">销量</th><th class="num">销售额</th></tr></thead><tbody>${prodRows}</tbody></table>
    <script>window.onload = () => { setTimeout(() => window.print(), 300); };<\/script>
    </body></html>`;
  w.document.open();
  w.document.write(html);
  w.document.close();
}

function printProductionDetail(
  items: ProductionDetailItem[],
  total: number,
  totalAmount: number,
  filters: { dept: string; category: string; startDate: string; endDate: string },
) {
  const w = window.open("", "_blank", "width=1024,height=720");
  if (!w) return;
  const esc = (v: unknown) => String(v ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));
  const deptLabel = (d: string) => ({ bar: "吧台", kitchen: "厨房", fruit: "水果房", outside: "外卖" } as Record<string, string>)[d] ?? d;
  const statusLabel = (s: string) => ({ pending: "待出", printed: "已打单", delivered: "已送达", cancelled: "已退" } as Record<string, string>)[s] ?? s;
  const flavorText = (flavors: string | null) => {
    if (!flavors) return "";
    try {
      const parsed = JSON.parse(flavors);
      return Array.isArray(parsed) ? parsed.map((f: { flavor: string }) => f.flavor).join("/") : "";
    } catch {
      return "";
    }
  };
  const rows = items.map((it) => `
    <tr>
      <td>${new Date(it.createdAt).toLocaleString("zh-CN")}</td>
      <td>${esc(it.roomNo)}</td>
      <td>${esc(it.customerName)}</td>
      <td>${esc(it.bookingManagerName)}</td>
      <td>${it.isGift ? "[赠] " : ""}${esc(it.productName)}</td>
      <td>${esc(it.categoryName)}</td>
      <td>${deptLabel(it.outputDept)}</td>
      <td>${esc(flavorText(it.flavors))}</td>
      <td class="num">${it.qty}</td>
      <td class="num">${it.price.toFixed(2)}</td>
      <td class="num">${it.amount.toFixed(2)}</td>
      <td>${statusLabel(it.status)}</td>
    </tr>`).join("");
  const filterDesc = [
    filters.dept === "all" ? "全部出品点" : deptLabel(filters.dept),
    filters.category === "all" ? "全部大类" : filters.category,
    filters.startDate || "不限",
    filters.endDate || "至今",
  ].join(" / ");

  const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
    <title>出品明细 · ${new Date().toLocaleString("zh-CN")}</title>
    <style>
      * { font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif; box-sizing: border-box; }
      body { margin: 20px; color: #1e293b; }
      h1 { font-size: 20px; margin: 0 0 4px; }
      .meta { color: #64748b; font-size: 12px; margin-bottom: 8px; }
      .kpis { display: flex; gap: 16px; margin-bottom: 12px; padding: 10px 16px; background: #f1f5f9; border-radius: 6px; }
      .kpis div { font-size: 13px; }
      .kpis b { font-size: 16px; color: #0f172a; margin-left: 6px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th { background: #1e293b; color: #f1f5f9; padding: 6px 8px; text-align: left; font-weight: 600; }
      td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; }
      tr:nth-child(even) td { background: #f8fafc; }
      .num { text-align: right; font-variant-numeric: tabular-nums; }
      @media print { body { margin: 0; } }
    </style></head><body>
    <h1>出品明细查询</h1>
    <div class="meta">筛选：${esc(filterDesc)} · 生成时间：${new Date().toLocaleString("zh-CN")}</div>
    <div class="kpis">
      <div>总条数<b>${total}</b></div>
      <div>总金额<b>¥${totalAmount.toFixed(2)}</b></div>
    </div>
    <table>
      <thead><tr>
        <th>时间</th><th>包厢</th><th>客户</th><th>订房经理</th><th>商品</th><th>大类</th>
        <th>出品点</th><th>口味</th><th class="num">数量</th><th class="num">单价</th><th class="num">金额</th><th>状态</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <script>window.onload = () => { setTimeout(() => window.print(), 300); };<\/script>
    </body></html>`;
  w.document.open();
  w.document.write(html);
  w.document.close();
}

// =====================================================================
// 页签5：本周趋势
// =====================================================================
function WeeklyTab() {
  const { orders, loading, refreshAt, reload } = useFinanceData();

  const { data, total, maxDay, minDay } = useMemo(() => {
    const today = startOfDay(new Date());
    const days: { date: Date; key: string; label: string; revenue: number; orders: number }[] =
      [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push({
        date: d,
        key: dateKey(d),
        label: `${dateKey(d)} ${weekdayShort(d)}`,
        revenue: 0,
        orders: 0,
      });
    }
    const idx = new Map(days.map((d) => [d.key, d]));
    for (const o of orders) {
      const od = new Date(o.closedAt ?? o.openedAt);
      const key = dateKey(od);
      const bucket = idx.get(key);
      if (bucket) {
        bucket.revenue += o.totalAmount;
        bucket.orders += 1;
      }
    }
    days.forEach(
      (d) => (d.revenue = Math.round(d.revenue * 100) / 100),
    );
    const totalRev = days.reduce((s, d) => s + d.revenue, 0);
    const totalOrd = days.reduce((s, d) => s + d.orders, 0);
    const maxDay = days.reduce((m, d) => (d.revenue > m.revenue ? d : m), days[0]);
    const minDay = days.reduce((m, d) => (d.revenue < m.revenue ? d : m), days[0]);
    return {
      data: days,
      total: {
        revenue: Math.round(totalRev * 100) / 100,
        orders: totalOrd,
        avg: Math.round((totalRev / 7) * 100) / 100,
      },
      maxDay,
      minDay,
    };
  }, [orders]);

  return (
    <div className="space-y-6">
      <RefreshBar refreshAt={refreshAt} onReload={reload} loading={loading} />

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <KpiCard
          title="本周总营收"
          icon={<DollarSign className="h-4 w-4" />}
          value={yuan(total.revenue)}
          accent="emerald"
          loading={loading}
        />
        <KpiCard
          title="本周总订单"
          icon={<Receipt className="h-4 w-4" />}
          value={total.orders}
          accent="amber"
          loading={loading}
        />
        <KpiCard
          title="日均营收"
          icon={<CalendarDays className="h-4 w-4" />}
          value={yuan(total.avg)}
          accent="sky"
          loading={loading}
        />
        <KpiCard
          title="最高日"
          icon={<TrendingUp className="h-4 w-4" />}
          value={yuan(maxDay.revenue)}
          accent="emerald"
          loading={loading}
          sub={maxDay.label}
        />
        <KpiCard
          title="最低日"
          icon={<TrendingDown className="h-4 w-4" />}
          value={yuan(minDay.revenue)}
          accent="rose"
          loading={loading}
          sub={minDay.label}
        />
      </div>

      <Card className="bg-slate-800/80 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-slate-100 flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-400" />
            本周 7 天营收趋势
          </CardTitle>
          <CardDescription className="text-slate-400">
            <span className="text-emerald-300">● 最高 {maxDay.label}</span>
            <span className="mx-2">·</span>
            <span className="text-rose-300">● 最低 {minDay.label}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-72 w-full bg-slate-700/50" />
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data}
                  margin={{ top: 24, right: 16, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="label"
                    stroke="#64748b"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickFormatter={(v) => `¥${v}`}
                  />
                  <Tooltip
                    {...DARK_TOOLTIP}
                    formatter={(value: number) => [yuan(value), "营收"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke={CHART_COLORS.emerald}
                    strokeWidth={3}
                    dot={{ r: 4, fill: CHART_COLORS.emerald, strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  >
                    <LabelList
                      dataKey="revenue"
                      position="top"
                      formatter={(v: number) => `¥${Math.round(v)}`}
                      style={{ fill: "#cbd5e1", fontSize: 10 }}
                    />
                  </Line>
                  <ReferenceDot
                    x={maxDay.label}
                    y={maxDay.revenue}
                    r={8}
                    fill={CHART_COLORS.emerald}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                  <ReferenceDot
                    x={minDay.label}
                    y={minDay.revenue}
                    r={8}
                    fill={CHART_COLORS.rose}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// =====================================================================
// 通用子组件
// =====================================================================
type Accent = "emerald" | "rose" | "amber" | "sky" | "slate";

const ACCENT_STYLES: Record<Accent, { iconBg: string; iconColor: string; valueColor: string; glow: string }> = {
  emerald: { iconBg: "bg-emerald-500/15", iconColor: "text-emerald-400", valueColor: "text-emerald-400", glow: "from-emerald-500/5" },
  rose: { iconBg: "bg-rose-500/15", iconColor: "text-rose-400", valueColor: "text-rose-400", glow: "from-rose-500/5" },
  amber: { iconBg: "bg-amber-500/15", iconColor: "text-amber-400", valueColor: "text-amber-400", glow: "from-amber-500/5" },
  sky: { iconBg: "bg-sky-500/15", iconColor: "text-sky-400", valueColor: "text-sky-400", glow: "from-sky-500/5" },
  slate: { iconBg: "bg-slate-500/15", iconColor: "text-slate-300", valueColor: "text-slate-100", glow: "from-slate-500/5" },
};

function KpiCard({
  title,
  value,
  icon,
  accent = "slate",
  loading,
  sub,
}: {
  title: string;
  value: number | string;
  icon?: ReactNode;
  accent?: Accent;
  loading?: boolean;
  sub?: string;
}) {
  const s = ACCENT_STYLES[accent];
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-5 border border-slate-700/50 bg-gradient-to-br ${s.glow} to-slate-800/60 shadow-lg shadow-black/20 transition-all hover:shadow-xl hover:shadow-black/30 hover:-translate-y-0.5 hover:border-slate-600/60`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs text-slate-400 font-medium tracking-wide">{title}</span>
        {icon && (
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.iconBg} ${s.iconColor}`}>
            {icon}
          </div>
        )}
      </div>
      {loading ? (
        <Skeleton className="h-8 w-24 bg-slate-700/60" />
      ) : (
        <div
          className={`text-2xl sm:text-3xl font-bold tabular-nums leading-none ${s.valueColor}`}
        >
          {value}
        </div>
      )}
      {sub && <div className="text-xs text-slate-500 mt-2">{sub}</div>}
    </div>
  );
}

function CompareCard({
  title,
  today,
  yesterday,
  trend,
  icon,
  loading,
}: {
  title: string;
  today: string;
  yesterday: string;
  trend: { pct: number; up: boolean | null };
  icon?: ReactNode;
  loading?: boolean;
}) {
  const up = trend.up;
  const arrow =
    up === null ? (
      <span className="text-slate-400">—</span>
    ) : up ? (
      <span className="flex items-center gap-0.5 text-emerald-400">
        <TrendingUp className="h-4 w-4" />▲ {trend.pct}%
      </span>
    ) : (
      <span className="flex items-center gap-0.5 text-rose-400">
        <TrendingDown className="h-4 w-4" />▼ {trend.pct}%
      </span>
    );
  return (
    <div className="relative overflow-hidden rounded-2xl p-5 border border-slate-700/50 bg-gradient-to-br from-slate-800/80 to-slate-800/40 shadow-lg shadow-black/20 transition-all hover:shadow-xl hover:shadow-black/30 hover:-translate-y-0.5 hover:border-slate-600/60">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-400 font-medium tracking-wide">{title}</span>
        {icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-500/15 text-slate-300">
            {icon}
          </div>
        )}
      </div>
      {loading ? (
        <Skeleton className="h-8 w-28 bg-slate-700/60" />
      ) : (
        <>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-400 tabular-nums leading-none">
            {today}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            昨日 <span className="text-slate-400 tabular-nums">{yesterday}</span>
          </div>
          <div className="mt-2.5 text-sm font-medium inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-900/40 border border-slate-700/50">
            {arrow}
          </div>
        </>
      )}
    </div>
  );
}
