// 模块1：总览仪表盘

"use client";

import { useEffect, useState } from "react";
import {
  Store,
  Wifi,
  WifiOff,
  TrendingUp,
  ShoppingCart,
  AlertTriangle,
  RefreshCw,
  Settings2,
  Activity,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import type { DashboardSummary } from "@/lib/types";
import {
  yuan,
  num,
  relTime,
  WsBadge,
} from "@/components/common/format";

export function DashboardModule() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const d = await api.getDashboard();
      setData(d);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, []);

  const maxRevenue = data
    ? Math.max(...data.revenueTrend.map((t) => t.revenue), 1)
    : 1;

  return (
    <div className="space-y-6">
      {/* KPI 卡片 */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="门店总数"
          value={data ? String(data.totalStores) : "—"}
          icon={Store}
          loading={loading}
          extra={
            data ? (
              <div className="flex gap-3 text-xs">
                <span className="text-emerald-600 flex items-center gap-1">
                  <Wifi className="h-3 w-3" />
                  {data.onlineStores} 在线
                </span>
                <span className="text-red-500 flex items-center gap-1">
                  <WifiOff className="h-3 w-3" />
                  {data.offlineStores} 离线
                </span>
              </div>
            ) : null
          }
        />
        <KpiCard
          title="今日营收"
          value={data ? yuan(data.todayRevenue) : "—"}
          icon={TrendingUp}
          loading={loading}
          accent="emerald"
          extra={
            data ? (
              <span className="text-xs text-muted-foreground">
                {data.todayOrders} 笔订单
              </span>
            ) : null
          }
        />
        <KpiCard
          title="待处理冲突"
          value={data ? String(data.pendingConflicts) : "—"}
          icon={AlertTriangle}
          loading={loading}
          accent={data && data.pendingConflicts > 0 ? "amber" : undefined}
          extra={
            data ? (
              <span className="text-xs text-muted-foreground">
                24h 失败同步 {data.failedSyncsLast24h} 次
              </span>
            ) : null
          }
        />
        <KpiCard
          title="配置项总数"
          value={data ? String(data.totalConfigs) : "—"}
          icon={Settings2}
          loading={loading}
          extra={
            <span className="text-xs text-muted-foreground">
              覆盖 {data?.totalStores ?? 0} 家门店
            </span>
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* 营收趋势 */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base">近 7 天营收趋势</CardTitle>
              <CardDescription>已支付订单汇总</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={load} className="h-8 w-8">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <div className="flex items-end gap-2 h-48 pt-4">
                {data?.revenueTrend.map((t, i) => (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-2 group"
                  >
                    <div className="text-xs font-medium text-muted-foreground opacity-0 group-hover:opacity-100 transition">
                      {yuan(t.revenue)}
                    </div>
                    <div className="w-full bg-muted rounded-t-md overflow-hidden flex-1 flex items-end relative">
                      <div
                        className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md transition-all hover:from-emerald-700 hover:to-emerald-500"
                        style={{
                          height: `${Math.max((t.revenue / maxRevenue) * 100, 2)}%`,
                        }}
                        title={`${t.date}: ${yuan(t.revenue)} / ${t.orders} 单`}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {t.date}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {t.orders}单
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 区域分布 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">门店区域分布</CardTitle>
            <CardDescription>按区域聚合</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <>
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </>
            ) : (
              data?.regionDistribution.map((r) => {
                const pct = data.totalStores > 0 ? (r.count / data.totalStores) * 100 : 0;
                return (
                  <div key={r.region}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{r.region}</span>
                      <span className="text-muted-foreground">{r.count} 家</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* 门店状态列表 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div>
            <CardTitle className="text-base">门店实时状态</CardTitle>
            <CardDescription>含今日营收与待处理冲突</CardDescription>
          </div>
          <Badge variant="outline" className="gap-1">
            <Activity className="h-3 w-3" />
            每 20 秒自动刷新
          </Badge>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {data?.storeStatusList.map((s) => (
                <div
                  key={s.storeId}
                  className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <WsBadge status={s.wsStatus as "online" | "offline"} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{s.storeName}</span>
                      <Badge variant="outline" className="text-xs">
                        {s.region}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      ID: {s.storeId} · 最后同步 {relTime(s.lastSyncAt)} · 最后连接{" "}
                      {relTime(s.lastConnectedAt)}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold text-emerald-600">
                      {yuan(s.todayRevenue)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {s.todayOrders} 单
                    </div>
                  </div>
                  {s.pendingConflicts > 0 && (
                    <Badge variant="destructive" className="shrink-0">
                      {s.pendingConflicts} 冲突
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon: Icon,
  loading,
  extra,
  accent,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
  extra?: React.ReactNode;
  accent?: "emerald" | "amber";
}) {
  const accentClass =
    accent === "emerald"
      ? "text-emerald-600"
      : accent === "amber"
      ? "text-amber-600"
      : "text-foreground";
  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className={`text-2xl font-bold ${accentClass}`}>{value}</div>
        )}
        {extra && <div className="mt-1">{extra}</div>}
      </CardContent>
    </Card>
  );
}
