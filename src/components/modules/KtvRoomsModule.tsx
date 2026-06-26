// KTV 模块1：包厢看板

"use client";

import { useEffect, useState } from "react";
import {
  RefreshCw,
  Music2,
  Users,
  Clock,
  DollarSign,
  Sparkles,
  PlayCircle,
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
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import type { KtvRoomInfo, KtvDashboardSummary } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { yuan, duration, relTime } from "@/components/common/format";

const STATUS_META: Record<
  KtvRoomInfo["status"],
  { label: string; color: string; bg: string; ring: string }
> = {
  idle: {
    label: "空闲",
    color: "text-emerald-700",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    ring: "ring-emerald-200 dark:ring-emerald-800",
  },
  in_use: {
    label: "使用中",
    color: "text-rose-700",
    bg: "bg-rose-50 dark:bg-rose-950/30",
    ring: "ring-rose-200 dark:ring-rose-800",
  },
  cleaning: {
    label: "清扫中",
    color: "text-amber-700",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    ring: "ring-amber-200 dark:ring-amber-800",
  },
  reserved: {
    label: "已预订",
    color: "text-blue-700",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    ring: "ring-blue-200 dark:ring-blue-800",
  },
};

export function KtvRoomsModule() {
  const [rooms, setRooms] = useState<KtvRoomInfo[]>([]);
  const [summary, setSummary] = useState<KtvDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [openRoom, setOpenRoom] = useState<KtvRoomInfo | null>(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [r, s] = await Promise.all([api.getKtvRooms(), api.getKtvDashboard()]);
      setRooms(r);
      setSummary(s);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  const handleOpen = async (data: {
    customerName: string;
    customerCount: number;
    phone: string;
  }) => {
    if (!openRoom) return;
    try {
      await api.openRoom(openRoom.id, data);
      toast({
        title: `${openRoom.roomNo} 已开台`,
        description: `${data.customerName || "散客"} · ${data.customerCount} 人`,
      });
      setOpenRoom(null);
      load();
    } catch (e) {
      toast({ title: "开台失败", description: String(e), variant: "destructive" });
    }
  };

  const handleClean = async (room: KtvRoomInfo) => {
    try {
      await api.cleanRoom(room.id);
      toast({ title: `${room.roomNo} 清扫完成`, description: "已恢复空闲" });
      load();
    } catch (e) {
      toast({ title: "操作失败", description: String(e), variant: "destructive" });
    }
  };

  const grouped = rooms.reduce(
    (acc, r) => {
      (acc[r.roomType] ??= []).push(r);
      return acc;
    },
    {} as Record<string, KtvRoomInfo[]>,
  );

  return (
    <div className="space-y-6">
      {/* 顶部 KPI */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
        <KpiCard title="包厢总数" value={summary?.totalRooms ?? 0} loading={loading} />
        <KpiCard title="空闲" value={summary?.idleRooms ?? 0} loading={loading} accent="emerald" />
        <KpiCard title="使用中" value={summary?.inUseRooms ?? 0} loading={loading} accent="rose" />
        <KpiCard title="清扫中" value={summary?.cleaningRooms ?? 0} loading={loading} accent="amber" />
        <KpiCard
          title="今日营收"
          value={summary ? yuan(summary.todayRevenue) : "—"}
          loading={loading}
          accent="emerald"
          isText
        />
        <KpiCard
          title="今日开台"
          value={summary?.todayOrders ?? 0}
          loading={loading}
          extra={summary ? `已结 ${summary.todayCheckouts}` : undefined}
        />
      </div>

      {/* 操作栏 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          每 15 秒自动刷新 · 点击包厢可开台
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-1">
          <RefreshCw className="h-4 w-4" /> 刷新
        </Button>
      </div>

      {/* 包厢网格（按类型分组） */}
      {loading ? (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([type, list]) => (
            <div key={type}>
              <div className="flex items-center gap-2 mb-3">
                <Music2 className="h-4 w-4 text-emerald-600" />
                <h3 className="font-semibold">{type}</h3>
                <Badge variant="outline">{list.length} 间</Badge>
                <Badge variant="outline" className="text-rose-600">
                  使用中 {list.filter((r) => r.status === "in_use").length}
                </Badge>
              </div>
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {list.map((room) => {
                  const meta = STATUS_META[room.status];
                  const elapsed = room.openedAt
                    ? Math.floor((Date.now() - new Date(room.openedAt).getTime()) / 60000)
                    : 0;
                  return (
                    <Card
                      key={room.id}
                      className={`ring-1 ${meta.ring} ${meta.bg} hover:shadow-md transition-all cursor-pointer`}
                      onClick={() => {
                        if (room.status === "idle" || room.status === "reserved") {
                          setOpenRoom(room);
                        }
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-bold text-lg">{room.roomNo}</div>
                            <div className="text-xs text-muted-foreground">
                              {room.roomName}
                            </div>
                          </div>
                          <Badge variant="outline" className={`${meta.color} bg-background`}>
                            {meta.label}
                          </Badge>
                        </div>

                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {room.capacity} 人
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {yuan(room.hourlyRate)}/小时
                            {room.minSpend > 0 && ` · 最低${yuan(room.minSpend)}`}
                          </div>
                        </div>

                        {room.status === "in_use" && room.currentOrder && (
                          <div className="mt-3 pt-3 border-t border-rose-200 dark:border-rose-800 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="flex items-center gap-1 text-rose-600 font-medium">
                                <Clock className="h-3 w-3" />
                                {elapsed} 分钟
                              </span>
                              <span className="font-semibold text-rose-700">
                                {yuan(room.currentOrder.productFee)}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {room.currentOrder.customerName || "散客"} ·{" "}
                              {room.currentOrder.customerCount} 人 ·{" "}
                              {room.currentOrder.itemsCount} 件商品
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full h-7 mt-1 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                // 跳转到结账模块（通过 location hash 通知）
                                window.dispatchEvent(
                                  new CustomEvent("ktv-checkout", {
                                    detail: room.currentOrder!.id,
                                  }),
                                );
                              }}
                            >
                              去结账
                            </Button>
                          </div>
                        )}

                        {room.status === "cleaning" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full h-7 mt-3 text-xs gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClean(room);
                            }}
                          >
                            <Sparkles className="h-3 w-3" />
                            标记清扫完成
                          </Button>
                        )}

                        {(room.status === "idle" || room.status === "reserved") && (
                          <Button
                            size="sm"
                            className="w-full h-7 mt-3 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenRoom(room);
                            }}
                          >
                            <PlayCircle className="h-3 w-3" />
                            开台
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 开台弹窗 */}
      <OpenRoomDialog
        room={openRoom}
        onClose={() => setOpenRoom(null)}
        onConfirm={handleOpen}
      />
    </div>
  );
}

function KpiCard({
  title,
  value,
  loading,
  accent,
  extra,
  isText,
}: {
  title: string;
  value: number | string;
  loading?: boolean;
  accent?: "emerald" | "rose" | "amber";
  extra?: string;
  isText?: boolean;
}) {
  const cls =
    accent === "emerald"
      ? "text-emerald-600"
      : accent === "rose"
      ? "text-rose-600"
      : accent === "amber"
      ? "text-amber-600"
      : "text-foreground";
  return (
    <Card>
      <CardContent className="p-3">
        <div className="text-xs text-muted-foreground">{title}</div>
        {loading ? (
          <Skeleton className="h-6 w-16 mt-1" />
        ) : (
          <div className={`${isText ? "text-lg" : "text-2xl"} font-bold mt-0.5 ${cls}`}>
            {value}
          </div>
        )}
        {extra && <div className="text-xs text-muted-foreground mt-0.5">{extra}</div>}
      </CardContent>
    </Card>
  );
}

function OpenRoomDialog({
  room,
  onClose,
  onConfirm,
}: {
  room: KtvRoomInfo | null;
  onClose: () => void;
  onConfirm: (data: {
    customerName: string;
    customerCount: number;
    phone: string;
  }) => void;
}) {
  const [customerName, setCustomerName] = useState("");
  const [customerCount, setCustomerCount] = useState("4");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (room) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCustomerName("");
       
      setCustomerCount("4");
       
      setPhone("");
    }
  }, [room]);

  return (
    <Dialog open={!!room} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            开台 · {room?.roomNo} {room?.roomName}
          </DialogTitle>
          <DialogDescription>
            {room?.roomType} · {room?.capacity} 人 · {room ? yuan(room.hourlyRate) : ""}/小时
            {room && room.minSpend > 0 ? ` · 最低消费 ${yuan(room.minSpend)}` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label htmlFor="cust-name">客户姓名（可选）</Label>
            <Input
              id="cust-name"
              placeholder="留空为散客"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="cust-count">人数</Label>
              <Input
                id="cust-count"
                type="number"
                min={1}
                value={customerCount}
                onChange={(e) => setCustomerCount(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="cust-phone">联系电话（可选）</Label>
              <Input
                id="cust-phone"
                placeholder="手机号"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() =>
              onConfirm({
                customerName,
                customerCount: Number(customerCount) || 1,
                phone,
              })
            }
          >
            确认开台
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
