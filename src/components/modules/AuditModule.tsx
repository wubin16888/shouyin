// 模块6：审计日志

"use client";

import { useEffect, useState } from "react";
import {
  ScrollText,
  Filter,
  RefreshCw,
  ChevronRight,
  CheckCircle2,
  XCircle,
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
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import type { AuditSummary, AuditLogInfo, StoreInfo } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { fullTime, opTypeLabel } from "@/components/common/format";

export function AuditModule() {
  const [stores, setStores] = useState<StoreInfo[]>([]);
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState<string>("all");
  const [opType, setOpType] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [detail, setDetail] = useState<AuditLogInfo | null>(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const s = await api.getStores();
      setStores(s);
      const data = await api.getAuditLogs({
        storeId: storeId !== "all" ? Number(storeId) : undefined,
        operationType: opType !== "all" ? opType : undefined,
        status: status !== "all" ? status : undefined,
        limit: 200,
      });
      setSummary(data);
    } catch (e) {
      toast({ title: "加载失败", description: String(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [storeId, opType, status]);

  const opTypes = [
    "config.update",
    "order.create",
    "order.refund",
    "store.toggle",
    "user.login",
    "user.logout",
    "member.recharge",
    "dish.update",
    "sync.resolve",
  ];

  return (
    <div className="space-y-4">
      {/* 概览卡片 */}
      <div className="grid gap-4 grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">日志总数</div>
            {loading ? (
              <Skeleton className="h-7 w-16 mt-1" />
            ) : (
              <div className="text-xl font-bold mt-1">{summary?.total ?? 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">成功操作</div>
            {loading ? (
              <Skeleton className="h-7 w-16 mt-1" />
            ) : (
              <div className="text-xl font-bold mt-1 text-emerald-600">
                {summary?.successCount ?? 0}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">失败操作</div>
            {loading ? (
              <Skeleton className="h-7 w-16 mt-1" />
            ) : (
              <div className="text-xl font-bold mt-1 text-red-500">
                {summary?.failedCount ?? 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 筛选 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={storeId} onValueChange={setStoreId}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="所有门店" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有门店</SelectItem>
                {stores.map((s) => (
                  <SelectItem key={s.storeId} value={String(s.storeId)}>
                    {s.storeName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={opType} onValueChange={setOpType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="所有操作" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有操作</SelectItem>
                {opTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {opTypeLabel(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="所有状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有状态</SelectItem>
                <SelectItem value="success">成功</SelectItem>
                <SelectItem value="failed">失败</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={load} className="gap-1 ml-auto">
              <RefreshCw className="h-4 w-4" /> 刷新
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 日志列表 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ScrollText className="h-5 w-5" />
            操作日志
          </CardTitle>
          <CardDescription>共 {summary?.logs.length ?? 0} 条</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            {loading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : (
              <div className="divide-y">
                {summary?.logs.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setDetail(l)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 text-left transition-colors"
                  >
                    {l.status === "success" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {opTypeLabel(l.operationType)}
                        </Badge>
                        <span className="font-medium text-sm">
                          {l.userName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          @ {l.store?.storeName ?? `门店 ${l.storeId}`}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {l.resourceType && `${l.resourceType}: `}
                        {l.resourceId} · {l.ipAddress}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0">
                      {fullTime(l.createdAt)}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                ))}
                {summary && summary.logs.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    暂无日志
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* 详情弹窗 */}
      <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {detail?.status === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              {opTypeLabel(detail?.operationType ?? "")}
            </DialogTitle>
            <DialogDescription>
              {detail?.store?.storeName} · {fullTime(detail?.createdAt ?? null)}
            </DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">操作人</div>
                  <div className="font-medium">{detail.userName}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">IP 地址</div>
                  <div className="font-mono">{detail.ipAddress ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">资源类型</div>
                  <div>{detail.resourceType ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">资源 ID</div>
                  <div className="font-mono">{detail.resourceId ?? "—"}</div>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">变更内容</div>
                <pre className="font-mono text-xs bg-muted rounded p-3 whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
                  {detail.changes
                    ? JSON.stringify(JSON.parse(detail.changes), null, 2)
                    : "（无）"}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
