// 模块5：连锁报表

"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Trophy,
  TrendingUp,
  Map,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import type { ReportSummary } from "@/lib/types";
import { yuan, num } from "@/components/common/format";

export function ReportsModule() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setData(await api.getReport(days));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [days]);

  const maxRevenue = data
    ? Math.max(...data.dailyTrend.map((t) => t.revenue), 1)
    : 1;
  const maxStoreRevenue = data
    ? Math.max(...data.storeRanking.map((s) => s.totalRevenue), 1)
    : 1;

  return (
    <div className="space-y-6">
      {/* 顶部控制 */}
      <div className="flex items-center gap-3">
        <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">近 7 天</SelectItem>
            <SelectItem value="14">近 14 天</SelectItem>
            <SelectItem value="30">近 30 天</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={load} className="gap-1 ml-auto">
          <RefreshCw className="h-4 w-4" /> 刷新
        </Button>
      </div>

      {/* 总览卡片 */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              总营收
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold text-emerald-600">
                {yuan(data?.totalRevenue ?? 0)}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              总订单数
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{num(data?.totalOrders ?? 0)}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              客单价
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{yuan(data?.avgOrderValue ?? 0)}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trend">
        <TabsList>
          <TabsTrigger value="trend">营收趋势</TabsTrigger>
          <TabsTrigger value="ranking">门店排行</TabsTrigger>
          <TabsTrigger value="region">区域汇总</TabsTrigger>
        </TabsList>

        {/* 营收趋势 */}
        <TabsContent value="trend">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">每日营收趋势</CardTitle>
              <CardDescription>所有门店合计</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <div className="flex items-end gap-2 h-64 pt-4">
                  {data?.dailyTrend.map((t, i) => (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center gap-2 group"
                    >
                      <div className="text-xs font-medium opacity-0 group-hover:opacity-100 transition">
                        {yuan(t.revenue)}
                      </div>
                      <div className="w-full bg-muted rounded-t-md overflow-hidden flex-1 flex items-end">
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
        </TabsContent>

        {/* 门店排行 */}
        <TabsContent value="ranking">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                门店营收排行
              </CardTitle>
              <CardDescription>按总营收降序</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))
              ) : (
                data?.storeRanking.map((s, i) => (
                  <div
                    key={s.storeId}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm shrink-0 ${
                        i === 0
                          ? "bg-amber-100 text-amber-700"
                          : i === 1
                          ? "bg-slate-100 text-slate-600"
                          : i === 2
                          ? "bg-orange-100 text-orange-700"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium truncate">{s.storeName}</span>
                        <span className="font-semibold text-emerald-600">
                          {yuan(s.totalRevenue)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{
                              width: `${(s.totalRevenue / maxStoreRevenue) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {s.totalOrders} 单 · 客单 {yuan(s.avgOrderValue)}
                        </span>
                      </div>
                    </div>
                    {i === 0 && (
                      <Badge className="bg-amber-500 hover:bg-amber-500 shrink-0">
                        🏆
                      </Badge>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 区域汇总 */}
        <TabsContent value="region">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Map className="h-5 w-5 text-emerald-600" />
                区域营收汇总
              </CardTitle>
              <CardDescription>按区域聚合</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {data?.regionSummary.map((r) => {
                    const max = Math.max(...(data?.regionSummary.map((x) => x.totalRevenue) ?? [1]), 1);
                    return (
                      <div key={r.region} className="rounded-lg border p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{r.region}</span>
                          <span className="text-lg font-bold text-emerald-600">
                            {yuan(r.totalRevenue)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">
                          {r.totalOrders} 单 · 客单{" "}
                          {yuan(
                            r.totalOrders > 0 ? r.totalRevenue / r.totalOrders : 0,
                          )}
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full"
                            style={{ width: `${(r.totalRevenue / max) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
