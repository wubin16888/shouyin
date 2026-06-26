// 模块4：数据同步（概览 + 日志 + 冲突）

"use client";

import { useEffect, useState } from "react";
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RotateCcw,
  GitMerge,
  TrendingUp,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import type {
  SyncOverview,
  SyncLogInfo,
  SyncConflictInfo,
} from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import {
  relTime,
  fullTime,
  SyncStatusBadge,
  ConflictBadge,
} from "@/components/common/format";

export function SyncModule() {
  const [overview, setOverview] = useState<SyncOverview | null>(null);
  const [logs, setLogs] = useState<SyncLogInfo[]>([]);
  const [conflicts, setConflicts] = useState<SyncConflictInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [logFilter, setLogFilter] = useState<string>("all");
  const [conflictFilter, setConflictFilter] = useState<string>("pending");
  const [resolving, setResolving] = useState<SyncConflictInfo | null>(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [o, l, c] = await Promise.all([
        api.getSyncOverview(),
        api.getSyncLogs(),
        api.getConflicts(),
      ]);
      setOverview(o);
      setLogs(l);
      setConflicts(c);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  const retry = async (log: SyncLogInfo) => {
    try {
      await api.retrySync(log.id);
      toast({ title: "已重新发起同步", description: `${log.store?.storeName} · ${log.syncType}` });
      load();
    } catch (e) {
      toast({ title: "重试失败", description: String(e), variant: "destructive" });
    }
  };

  const doResolve = async (method: "local_wins" | "cloud_wins" | "merge") => {
    if (!resolving) return;
    try {
      await api.resolveConflict(resolving.id, method);
      toast({
        title: "冲突已解决",
        description: `订单 #${resolving.orderId} · ${method === "local_wins" ? "采用边缘端数据" : method === "cloud_wins" ? "采用云端数据" : "合并"}`,
      });
      setResolving(null);
      load();
    } catch (e) {
      toast({ title: "解决失败", description: String(e), variant: "destructive" });
    }
  };

  const filteredLogs = logFilter === "all" ? logs : logs.filter((l) => l.status === logFilter);
  const filteredConflicts =
    conflictFilter === "all" ? conflicts : conflicts.filter((c) => c.resolveStatus === conflictFilter);

  return (
    <div className="space-y-6">
      {/* 概览卡片 */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="同步总次数"
          value={overview?.totalSyncs ?? 0}
          icon={RefreshCw}
          loading={loading}
        />
        <StatCard
          title="成功率"
          value={(overview?.successRate ?? 0) + "%"}
          icon={CheckCircle2}
          loading={loading}
          accent="emerald"
        />
        <StatCard
          title="失败次数"
          value={overview?.failedCount ?? 0}
          icon={XCircle}
          loading={loading}
          accent={overview && overview.failedCount > 0 ? "red" : undefined}
        />
        <StatCard
          title="待处理冲突"
          value={overview?.pendingConflicts ?? 0}
          icon={AlertTriangle}
          loading={loading}
          accent={overview && overview.pendingConflicts > 0 ? "amber" : undefined}
        />
      </div>

      <Tabs defaultValue="logs">
        <TabsList>
          <TabsTrigger value="logs">同步日志</TabsTrigger>
          <TabsTrigger value="conflicts">
            冲突处理
            {overview && overview.pendingConflicts > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 px-1.5">
                {overview.pendingConflicts}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="stats">同步分布</TabsTrigger>
        </TabsList>

        {/* 同步日志 */}
        <TabsContent value="logs" className="space-y-3">
          <div className="flex items-center gap-2">
            <Select value={logFilter} onValueChange={setLogFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="success">成功</SelectItem>
                <SelectItem value="failed">失败</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={load} className="gap-1 ml-auto">
              <RefreshCw className="h-4 w-4" /> 刷新
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                {loading ? (
                  <div className="space-y-2 p-4">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredLogs.map((l) => (
                      <div key={l.id} className="flex items-center gap-3 p-3 hover:bg-muted/50">
                        <SyncStatusBadge status={l.status} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">
                              {l.store?.storeName ?? `门店 ${l.storeId}`}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {l.syncType}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {l.recordCount} 条记录 · {l.durationMs}ms
                            </span>
                          </div>
                          {l.errorMessage && (
                            <div className="text-xs text-red-500 mt-0.5">
                              {l.errorMessage}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {relTime(l.startedAt)}
                        </div>
                        {l.status === "failed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => retry(l)}
                            className="gap-1 shrink-0"
                          >
                            <RotateCcw className="h-3.5 w-3.5" /> 重试
                          </Button>
                        )}
                      </div>
                    ))}
                    {filteredLogs.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground text-sm">
                        暂无日志
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 冲突处理 */}
        <TabsContent value="conflicts" className="space-y-3">
          <div className="flex items-center gap-2">
            <Select value={conflictFilter} onValueChange={setConflictFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">待处理</SelectItem>
                <SelectItem value="resolved">已解决</SelectItem>
                <SelectItem value="all">全部</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={load} className="gap-1 ml-auto">
              <RefreshCw className="h-4 w-4" /> 刷新
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))
            ) : (
              filteredConflicts.map((c) => (
                <Card key={c.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <ConflictBadge status={c.resolveStatus} />
                        <span className="font-medium text-sm">
                          {c.store?.storeName ?? `门店 ${c.storeId}`}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {relTime(c.createdAt)}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">订单 ID</span>
                        <span className="font-mono">#{c.orderId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">版本</span>
                        <span className="font-mono">
                          本地 v{c.localVersion} ↔ 云端 v{c.cloudVersion}
                        </span>
                      </div>
                      {c.conflictReason && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">原因</span>
                          <span className="text-red-500">{c.conflictReason}</span>
                        </div>
                      )}
                      {c.resolveMethod && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">解决方式</span>
                          <span className="text-emerald-600">
                            {c.resolveMethod === "local_wins"
                              ? "本地胜"
                              : c.resolveMethod === "cloud_wins"
                              ? "云端胜"
                              : "合并"}
                          </span>
                        </div>
                      )}
                      {c.retryCount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">重试次数</span>
                          <span>{c.retryCount}</span>
                        </div>
                      )}
                    </div>

                    {c.resolveStatus === "pending" && (
                      <Button
                        size="sm"
                        className="w-full mt-3 gap-1"
                        onClick={() => setResolving(c)}
                      >
                        <GitMerge className="h-3.5 w-3.5" /> 解决冲突
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
            {!loading && filteredConflicts.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground text-sm">
                暂无冲突记录 🎉
              </div>
            )}
          </div>
        </TabsContent>

        {/* 同步分布 */}
        <TabsContent value="stats">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">按同步类型分布</CardTitle>
                <CardDescription>各类型同步任务次数</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {overview?.typeDistribution.map((t) => {
                  const max = Math.max(...overview.typeDistribution.map((x) => x.count), 1);
                  const pct = (t.count / max) * 100;
                  return (
                    <div key={t.syncType}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{t.syncType}</span>
                        <span className="text-muted-foreground">{t.count} 次</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">同步性能</CardTitle>
                <CardDescription>关键指标</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm">平均耗时</span>
                  </div>
                  <span className="font-semibold">{overview?.avgDurationMs ?? 0} ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm">已解决冲突</span>
                  </div>
                  <span className="font-semibold">{overview?.resolvedConflicts ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span className="text-sm">待处理冲突</span>
                  </div>
                  <span className="font-semibold">{overview?.pendingConflicts ?? 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* 解决冲突弹窗 */}
      <Dialog open={!!resolving} onOpenChange={(v) => !v && setResolving(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>解决同步冲突</DialogTitle>
            <DialogDescription>
              订单 #{resolving?.orderId} · {resolving?.store?.storeName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground mb-1">边缘端数据 (v{resolving?.localVersion})</div>
                <pre className="font-mono text-xs whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
                  {resolving ? JSON.stringify(JSON.parse(resolving.localData), null, 2) : ""}
                </pre>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground mb-1">云端数据 (v{resolving?.cloudVersion})</div>
                <pre className="font-mono text-xs whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
                  {resolving && resolving.cloudData
                    ? JSON.stringify(JSON.parse(resolving.cloudData), null, 2)
                    : "（无）"}
                </pre>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="gap-1 flex-1"
              onClick={() => doResolve("local_wins")}
            >
              采用边缘端
            </Button>
            <Button
              variant="outline"
              className="gap-1 flex-1"
              onClick={() => doResolve("cloud_wins")}
            >
              采用云端
            </Button>
            <Button className="gap-1 flex-1" onClick={() => doResolve("merge")}>
              <GitMerge className="h-4 w-4" /> 智能合并
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  loading,
  accent,
}: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
  accent?: "emerald" | "amber" | "red";
}) {
  const cls =
    accent === "emerald"
      ? "text-emerald-600"
      : accent === "amber"
      ? "text-amber-600"
      : accent === "red"
      ? "text-red-500"
      : "text-foreground";
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className={`text-2xl font-bold ${cls}`}>{value}</div>
        )}
      </CardContent>
    </Card>
  );
}
