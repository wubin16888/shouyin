// 模块2：门店与连接监控

"use client";

import { useEffect, useState } from "react";
import {
  RefreshCw,
  Power,
  PowerOff,
  Wifi,
  WifiOff,
  Settings2,
  Clock,
  CheckCircle,
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/lib/api";
import type { StoreInfo, WebsocketEventInfo, RateLimitInfo } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { relTime, fullTime, WsBadge, duration } from "@/components/common/format";

export function StoresModule() {
  const [stores, setStores] = useState<StoreInfo[]>([]);
  const [events, setEvents] = useState<WebsocketEventInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [rateLimitStore, setRateLimitStore] = useState<StoreInfo | null>(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [s, e] = await Promise.all([api.getStores(), api.getWsEvents()]);
      setStores(s);
      setEvents(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  const toggleWs = async (store: StoreInfo) => {
    const next = store.wsStatus === "online" ? "offline" : "online";
    try {
      await api.toggleWs(store.storeId, next);
      toast({
        title: `${store.storeName} 已${next === "online" ? "重连" : "断开"}`,
        description: next === "online" ? "WebSocket 连接已恢复" : "连接已断开",
      });
      load();
    } catch (e) {
      toast({ title: "操作失败", description: String(e), variant: "destructive" });
    }
  };

  const toggleStatus = async (store: StoreInfo) => {
    const next = store.status === 1 ? 0 : 1;
    try {
      await api.toggleStore(store.storeId, next);
      toast({
        title: `${store.storeName} 已${next === 1 ? "启用" : "停用"}`,
      });
      load();
    } catch (e) {
      toast({ title: "操作失败", description: String(e), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="stores">
        <TabsList>
          <TabsTrigger value="stores">门店列表</TabsTrigger>
          <TabsTrigger value="events">连接事件</TabsTrigger>
          <TabsTrigger value="approvals">门店审批</TabsTrigger>
        </TabsList>

        {/* 门店列表 */}
        <TabsContent value="stores" className="space-y-3">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : (
            stores.map((s) => (
              <Card key={s.storeId} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* 左：基本信息 */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <WsBadge status={s.wsStatus} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold truncate">{s.storeName}</span>
                          <Badge variant="outline" className="text-xs">
                            {s.region}
                          </Badge>
                          {s.status === 0 && (
                            <Badge variant="secondary" className="text-xs">
                              已停用
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          ID: {s.storeId} · Token: {s.storeToken.slice(0, 16)}... ·
                          最后连接 {relTime(s.lastConnectedAt)}
                        </div>
                      </div>
                    </div>

                    {/* 中：指标 */}
                    <div className="flex gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-muted-foreground text-xs">今日营收</div>
                        <div className="font-semibold text-emerald-600">
                          {/* 门店今日营收从 dashboard 数据看板已有，这里简化 */}
                          —
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-muted-foreground text-xs">待处理冲突</div>
                        <div
                          className={`font-semibold ${
                            (s.pendingConflicts ?? 0) > 0
                              ? "text-red-500"
                              : "text-foreground"
                          }`}
                        >
                          {s.pendingConflicts ?? 0}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-muted-foreground text-xs">限流</div>
                        <div className="font-semibold">
                          {s.rateLimit?.enabled ? "已启用" : "未启用"}
                        </div>
                      </div>
                    </div>

                    {/* 右：操作 */}
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleWs(s)}
                        className="gap-1"
                      >
                        {s.wsStatus === "online" ? (
                          <>
                            <WifiOff className="h-3.5 w-3.5" /> 断开
                          </>
                        ) : (
                          <>
                            <Wifi className="h-3.5 w-3.5" /> 重连
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleStatus(s)}
                        className="gap-1"
                      >
                        {s.status === 1 ? (
                          <>
                            <PowerOff className="h-3.5 w-3.5" /> 停用
                          </>
                        ) : (
                          <>
                            <Power className="h-3.5 w-3.5" /> 启用
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRateLimitStore(s)}
                        className="gap-1"
                      >
                        <Settings2 className="h-3.5 w-3.5" /> 限流
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* 连接事件 */}
        <TabsContent value="events">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">WebSocket 连接事件日志</CardTitle>
              <CardDescription>最近的连接/断开/重连事件</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-2">
                    {events.map((e) => (
                      <div
                        key={e.id}
                        className="flex items-center gap-3 rounded-lg border p-3 text-sm"
                      >
                        {e.eventType === "connect" && (
                          <Wifi className="h-4 w-4 text-emerald-500 shrink-0" />
                        )}
                        {e.eventType === "disconnect" && (
                          <WifiOff className="h-4 w-4 text-red-500 shrink-0" />
                        )}
                        {e.eventType === "reconnect" && (
                          <RefreshCw className="h-4 w-4 text-amber-500 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {e.store?.storeName ?? `门店 ${e.storeId}`}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {e.eventType === "connect"
                                ? "连接"
                                : e.eventType === "disconnect"
                                ? "断开"
                                : "重连"}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {e.reason ? `原因: ${e.reason} · ` : ""}
                            IP: {e.clientIp ?? "—"} · 会话时长{" "}
                            {duration(e.sessionDuration ?? undefined)}
                            {e.pendingMessages > 0 && ` · 待发消息 ${e.pendingMessages}`}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {relTime(e.createdAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 门店审批 */}
        <TabsContent value="approvals">
          <StoreApprovalsTab />
        </TabsContent>
      </Tabs>

      {/* 限流配置弹窗 */}
      <RateLimitDialog
        store={rateLimitStore}
        onClose={() => setRateLimitStore(null)}
        onSaved={() => {
          setRateLimitStore(null);
          load();
        }}
      />
    </div>
  );
}

function RateLimitDialog({
  store,
  onClose,
  onSaved,
}: {
  store: StoreInfo | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [rl, setRl] = useState<RateLimitInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!store) return;
    setLoading(true);
    setRl(null);
    api
      .getRateLimit(store.storeId)
      .then(setRl)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [store]);

  const save = async () => {
    if (!store || !rl) return;
    setSaving(true);
    try {
      await api.updateRateLimit(store.storeId, rl);
      toast({ title: "限流配置已保存", description: `${store.storeName}` });
      onSaved();
    } catch (e) {
      toast({ title: "保存失败", description: String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!store} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>限流配置 · {store?.storeName}</DialogTitle>
          <DialogDescription>
            为门店配置不同类别接口的速率上限，防止边缘端突发流量冲击云端
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : rl ? (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="font-medium">启用限流</Label>
                <p className="text-xs text-muted-foreground">关闭后该门店不受限制</p>
              </div>
              <Switch
                checked={rl.enabled}
                onCheckedChange={(v) => setRl({ ...rl, enabled: v })}
              />
            </div>

            {(
              [
                ["readPerSec", "读接口 (req/s)"],
                ["writePerSec", "写接口 (req/s)"],
                ["syncPerSec", "同步接口 (req/s)"],
                ["authPerSec", "鉴权接口 (req/s)"],
                ["burstAllowance", "突发倍数"],
              ] as const
            ).map(([k, label]) => (
              <div key={k} className="grid grid-cols-2 items-center gap-3">
                <Label htmlFor={k}>{label}</Label>
                <Input
                  id={k}
                  type="number"
                  min={1}
                  value={rl[k]}
                  onChange={(e) =>
                    setRl({ ...rl, [k]: Number(e.target.value) })
                  }
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground py-4">加载中...</div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={save} disabled={saving || !rl}>
            {saving ? "保存中..." : "保存配置"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ 门店审批 Tab ============
function StoreApprovalsTab() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/store-applications");
      const body = await res.json();
      setList(body.data ?? []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const audit = async (id: string, status: "approved" | "rejected") => {
    if (status === "approved") {
      if (!confirm("确认通过此门店申请？将自动创建门店和管理员账号。")) return;
    }
    try {
      const res = await fetch(`/api/store-applications/${id}/audit`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, auditedBy: "admin" }),
      });
      const body = await res.json();
      if (body.code === 200) {
        if (status === "approved" && body.data?.adminUsername) {
          toast({
            title: "审批通过，门店已创建",
            description: `管理员账号：${body.data.adminUsername} 密码：${body.data.adminPassword}（手机后6位）`,
          });
        } else {
          toast({ title: "已驳回" });
        }
        load();
      } else {
        toast({ title: "操作失败", description: body.msg, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "网络错误", description: String(e), variant: "destructive" });
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-400">加载中...</div>;
  }

  if (list.length === 0) {
    return (
      <Card className="bg-slate-800/80 border-slate-700">
        <CardContent className="py-12 text-center text-slate-400">
          暂无门店申请记录
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {list.map((a) => (
        <Card key={a.id} className="bg-slate-800/80 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="font-semibold text-slate-100">{a.storeName}</span>
                  <Badge variant="outline" className="text-xs">{a.businessType === "ktv" ? "KTV" : "超市"}</Badge>
                  <Badge variant={a.status === "pending" ? "secondary" : a.status === "approved" ? "default" : "destructive"}
                    className={a.status === "approved" ? "bg-emerald-600" : ""}>
                    {a.status === "pending" ? "待审核" : a.status === "approved" ? "已通过" : "已驳回"}
                  </Badge>
                </div>
                <div className="text-sm text-slate-400 space-y-1">
                  <div>联系人：{a.contactName} · {a.phone} · {a.region ?? "未填"}</div>
                  <div>地址：{a.address ?? "未填"} · 执照：{a.licenseNo ?? "未填"}</div>
                  {a.remark && <div className="text-slate-500">备注：{a.remark}</div>}
                  {a.auditedAt && (
                    <div className="text-xs text-emerald-400">
                      审批时间：{new Date(a.auditedAt).toLocaleString("zh-CN")}
                      {a.createdStoreId && ` · 门店ID：${a.createdStoreId}`}
                    </div>
                  )}
                </div>
              </div>
              {a.status === "pending" && (
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" onClick={() => audit(a.id, "approved")}
                    className="bg-emerald-600 hover:bg-emerald-700 gap-1">
                    <CheckCircle className="h-3.5 w-3.5" /> 通过
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => audit(a.id, "rejected")}
                    className="border-red-700 text-red-400 hover:bg-red-950/40 gap-1">
                    <XCircle className="h-3.5 w-3.5" /> 驳回
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
