// KTV 出品系统 — 4 部门出单看板 + 已出品查询 + 出品历史查询 + 打印
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  Wine,
  ChefHat,
  Cherry,
  ShoppingBag,
  CheckCircle2,
  Printer,
  Clock,
  Receipt,
  Eye,
  Gift,
  History,
  Filter,
  CalendarDays,
  BarChart3,
  Search,
  X,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RTooltip,
  Cell,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import type {
  KtvRoomInfoV2,
  KtvOrderInfoV2,
  KtvOrderItemInfoV2,
  ProductInfo,
  ProductCategoryInfo,
  SysConfigInfo,
  RoomStatusColors,
} from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { yuan, relTime, fullTime } from "@/components/common/format";

// 默认房态颜色（与 CashierModule 一致）
const DEFAULT_STATUS_COLORS: RoomStatusColors = {
  idle: "#10b981",
  reserved: "#3b82f6",
  seated: "#f59e0b",
  in_use: "#ef4444",
  cleaning: "#a855f7",
  maintenance: "#6b7280",
};

const STATUS_LABEL: Record<keyof RoomStatusColors, string> = {
  idle: "空闲",
  reserved: "预订",
  seated: "带位",
  in_use: "使用中",
  cleaning: "清扫",
  maintenance: "维修",
};

type Dept = "bar" | "kitchen" | "fruit" | "outside";

const DEPT_META: Record<Dept, { label: string; icon: React.ReactNode; color: string }> = {
  bar: { label: "吧台", icon: <Wine className="h-4 w-4" />, color: "#f59e0b" },
  kitchen: { label: "厨房", icon: <ChefHat className="h-4 w-4" />, color: "#ef4444" },
  fruit: { label: "水果房", icon: <Cherry className="h-4 w-4" />, color: "#10b981" },
  outside: { label: "外卖", icon: <ShoppingBag className="h-4 w-4" />, color: "#3b82f6" },
};

function parseFlavors(flavors: string | null): Array<{ category: string; flavor: string }> {
  if (!flavors) return [];
  try {
    const parsed = JSON.parse(flavors);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function flavorText(flavors: string | null): string {
  const list = parseFlavors(flavors);
  if (list.length === 0) return "";
  return list.map((f) => f.flavor).join("/");
}

// ============ 主组件 ============
export function ProductionModule() {
  const [rooms, setRooms] = useState<KtvRoomInfoV2[]>([]);
  const [orders, setOrders] = useState<KtvOrderInfoV2[]>([]);
  const [products, setProducts] = useState<ProductInfo[]>([]);
  const [colors, setColors] = useState<RoomStatusColors>(DEFAULT_STATUS_COLORS);
  const [loading, setLoading] = useState(true);
  const [dept, setDept] = useState<Dept>("bar");
  const [viewRoomOrder, setViewRoomOrder] = useState<KtvOrderInfoV2 | null>(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    try {
      const [r, o, cfgs] = await Promise.all([
        api.getKtvRooms(),
        api.getKtvOrders("open"),
        api.getSysConfigs(),
      ]);
      setRooms(r);
      setOrders(o);
      const colorCfg = cfgs.find((c) => c.configKey === "room_status_colors");
      if (colorCfg) {
        try {
          setColors({ ...DEFAULT_STATUS_COLORS, ...JSON.parse(colorCfg.configValue) });
        } catch { /* ignore */ }
      }
    } catch (e) {
      toast({ title: "加载失败", description: String(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // 商品图（仅在初次加载时拉取一次，用于出单卡缩略图）
  useEffect(() => {
    api.getProducts().then(setProducts).catch(() => {});
  }, []);

  // productId → imageUrl 映射
  const productImageMap = useMemo(() => {
    const m = new Map<string, string | null>();
    for (const p of products) m.set(p.id, p.imageUrl);
    return m;
  }, [products]);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  // 语音播报状态声明（useEffect 在 pendingItems 定义之后）
  const [lastPendingCount, setLastPendingCount] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // 从所有 open 订单中提取 items，关联 roomNo
  type ItemWithRoom = KtvOrderItemInfoV2 & { roomNo: string; roomType: string; customerName: string | null; openedAt: string };
  const allItems: ItemWithRoom[] = useMemo(() => {
    const list: ItemWithRoom[] = [];
    for (const o of orders) {
      for (const it of o.items ?? []) {
        list.push({
          ...it,
          roomNo: o.roomNo,
          roomType: o.roomType,
          customerName: o.customerName,
          openedAt: o.openedAt,
        });
      }
    }
    return list;
  }, [orders]);

  // 按部门 + 状态过滤
  const pendingItems = useMemo(() => {
    return allItems
      .filter((it) => it.outputDept === dept && (it.status === "pending" || it.status === "printed"))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [allItems, dept]);

  const deliveredItems = useMemo(() => {
    return allItems
      .filter((it) => it.outputDept === dept && it.status === "delivered")
      .sort((a, b) => new Date(b.deliveredAt ?? b.createdAt).getTime() - new Date(a.deliveredAt ?? a.createdAt).getTime());
  }, [allItems, dept]);

  // ============ 语音播报：新订单进来时自动播报（必须在 pendingItems 之后）============
  useEffect(() => {
    if (!voiceEnabled) return;
    const currentPending = pendingItems.length;
    if (currentPending > lastPendingCount && lastPendingCount > 0) {
      const newCount = currentPending - lastPendingCount;
      const msg = `${deptLabel(dept)}收到${newCount}个新订单`;
      try {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance(msg);
          utterance.lang = "zh-CN";
          utterance.rate = 1.2;
          utterance.volume = 1;
          window.speechSynthesis.speak(utterance);
        }
      } catch { /* 浏览器不支持语音 */ }
    }
    setLastPendingCount(currentPending);
  }, [pendingItems.length, voiceEnabled, lastPendingCount, dept]);

  // 统计
  const stats = useMemo(() => {
    const pending = allItems.filter((it) => it.status === "pending" || it.status === "printed").length;
    const delivered = allItems.filter((it) => it.status === "delivered").length;
    // 今日出品总数 = 所有 delivered 中 deliveredAt 是今天的
    const today = new Date().toDateString();
    const todayDelivered = allItems.filter(
      (it) => it.deliveredAt && new Date(it.deliveredAt).toDateString() === today,
    ).length;
    return { pending, delivered, todayDelivered };
  }, [allItems]);

  // 房态分组（按区域）
  const groupedRooms = useMemo(() => {
    const g: Record<string, KtvRoomInfoV2[]> = {};
    for (const r of rooms) {
      const key = r.area || "未分区";
      (g[key] ??= []).push(r);
    }
    return g;
  }, [rooms]);

  const handleDeliver = async (item: ItemWithRoom) => {
    // 找到所属订单
    const order = orders.find((o) => o.id === item.orderId);
    if (!order) return;
    try {
      await api.deliverItem(order.id, item.id);
      toast({
        title: "已出单送达",
        description: `${item.roomNo} · ${item.productName} x${item.qty}`,
      });
      load();
    } catch (e) {
      toast({ title: "出单失败", description: String(e), variant: "destructive" });
    }
  };

  const handleReprint = (item: ItemWithRoom) => {
    toast({
      title: "已重新打印小票",
      description: `${item.roomNo} · ${item.productName} x${item.qty} · ${flavorText(item.flavors) || "无口味"}`,
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 -m-4 sm:-m-6 p-4 sm:p-6">
      <Tabs defaultValue="board" className="w-full">
        <TabsList className="bg-slate-800 border border-slate-700/50 mb-4 grid grid-cols-2 w-full max-w-xs">
          <TabsTrigger value="board" className="data-[state=active]:bg-slate-700 data-[state=active]:text-emerald-300 gap-1.5">
            <Receipt className="h-4 w-4" /> 出单看板
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-slate-700 data-[state=active]:text-emerald-300 gap-1.5">
            <History className="h-4 w-4" /> 出品历史
          </TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="focus-visible:outline-none">
      {/* 顶部 KPI + 语音开关 */}
      <div className="flex items-center gap-3 mb-5">
        <div className="grid gap-3 grid-cols-3 flex-1">
          <KpiCard title="待出品" value={stats.pending} loading={loading} color="#f59e0b" icon={<Clock className="h-4 w-4" />} />
          <KpiCard title="已出品" value={stats.delivered} loading={loading} color="#10b981" icon={<CheckCircle2 className="h-4 w-4" />} />
          <KpiCard title="今日出品总数" value={stats.todayDelivered} loading={loading} color="#3b82f6" icon={<Receipt className="h-4 w-4" />} />
        </div>
        <Button
          size="sm"
          variant={voiceEnabled ? "default" : "outline"}
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          className={cn("gap-1.5 h-10 shrink-0", voiceEnabled && "bg-amber-600 hover:bg-amber-500")}
        >
          {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          {voiceEnabled ? "语音开" : "语音关"}
        </Button>
      </div>
      {/* 顶部装饰条 — 4 个部门彩色图标 */}
      <div className="flex flex-wrap items-center gap-2 mb-5 bg-slate-800/60 rounded-xl p-2 border border-slate-700/50">
        <span className="text-[10px] uppercase tracking-[0.15em] font-semibold text-slate-500 ml-1 mr-1">出品部门</span>
        {(Object.keys(DEPT_META) as Dept[]).map((d) => (
          <span
            key={d}
            className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-900/70 border border-slate-700/60"
          >
            <span
              className="flex h-5 w-5 items-center justify-center rounded-md"
              style={{ backgroundColor: `${DEPT_META[d].color}22`, color: DEPT_META[d].color }}
            >
              {DEPT_META[d].icon}
            </span>
            <span className="text-xs text-slate-300">{DEPT_META[d].label}</span>
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* 左：房态缩略 */}
        <div className="lg:col-span-1 bg-slate-800 rounded-xl p-3 border border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-emerald-400" /> 房态缩略
            </h3>
            <Button size="sm" variant="ghost" onClick={load} className="h-7 w-7 p-0 text-slate-300 hover:bg-slate-700">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
          <ScrollArea className="max-h-[70vh]">
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 bg-slate-700" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(groupedRooms).map(([area, list]) => (
                  <div key={area}>
                    <div className="text-[10px] text-slate-500 mb-1.5 px-0.5">{area}</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {list.map((r) => (
                        <MiniRoomBlock
                          key={r.id}
                          room={r}
                          colors={colors}
                          onClick={() => {
                            const o = orders.find((x) => x.id === r.currentOrderId);
                            if (o) setViewRoomOrder(o);
                            else toast({ title: `${r.roomNo} 当前无消费`, description: STATUS_LABEL[r.status] });
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* 右：出单看板 */}
        <div className="lg:col-span-3">
          {/* 部门切换 */}
          <div className="bg-slate-800 rounded-xl p-2 mb-4 border border-slate-700/50">
            <Tabs value={dept} onValueChange={(v) => setDept(v as Dept)}>
              <TabsList className="bg-slate-900 border border-slate-700 grid grid-cols-4 w-full">
                {(Object.keys(DEPT_META) as Dept[]).map((d) => {
                  const cnt = allItems.filter((it) => it.outputDept === d && (it.status === "pending" || it.status === "printed")).length;
                  return (
                    <TabsTrigger key={d} value={d} className="data-[state=active]:bg-slate-700 gap-1.5 relative">
                      <span style={{ color: DEPT_META[d].color }}>{DEPT_META[d].icon}</span>
                      <span>{DEPT_META[d].label}</span>
                      {cnt > 0 && (
                        <span className="ml-1 text-[10px] bg-rose-600 text-white rounded-full px-1.5 py-0.5 font-bold tabular-nums">
                          {cnt}
                        </span>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {(Object.keys(DEPT_META) as Dept[]).map((d) => (
                <TabsContent key={d} value={d} className="mt-4">
                  {d !== dept ? null : (
                    <div className="space-y-4">
                      {/* 待出品看板 */}
                      <div>
                        <div className="flex items-center gap-2 mb-2.5">
                          <Clock className="h-4 w-4 text-amber-400" />
                          <h3 className="text-sm font-semibold text-amber-300">
                            待出品 · {DEPT_META[dept].label}
                          </h3>
                          <Badge variant="outline" className="border-amber-700/50 text-amber-300 bg-amber-950/30">
                            {pendingItems.length} 单
                          </Badge>
                        </div>
                        {pendingItems.length === 0 ? (
                          <EmptyState text="暂无待出品订单" />
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
                            {pendingItems.map((it) => (
                              <ProductionCard
                                key={it.id}
                                item={it}
                                dept={dept}
                                deptColor={DEPT_META[dept].color}
                                imageUrl={productImageMap.get(it.productId) ?? null}
                                onDeliver={() => handleDeliver(it)}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 已出品 */}
                      <div>
                        <div className="flex items-center gap-2 mb-2.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          <h3 className="text-sm font-semibold text-emerald-300">
                            已出品查询
                          </h3>
                          <Badge variant="outline" className="border-emerald-700/50 text-emerald-300 bg-emerald-950/30">
                            {deliveredItems.length} 单
                          </Badge>
                        </div>
                        {deliveredItems.length === 0 ? (
                          <EmptyState text="暂无已出品记录" />
                        ) : (
                          <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
                            <ScrollArea className="max-h-72">
                              <table className="w-full text-xs">
                                <thead className="bg-slate-900/80 sticky top-0">
                                  <tr className="text-slate-400">
                                    <th className="text-left font-medium px-3 py-2">房号</th>
                                    <th className="text-left font-medium px-3 py-2">商品</th>
                                    <th className="text-left font-medium px-3 py-2">口味</th>
                                    <th className="text-right font-medium px-3 py-2">数量</th>
                                    <th className="text-left font-medium px-3 py-2">送达时间</th>
                                    <th className="text-right font-medium px-3 py-2">操作</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {deliveredItems.map((it) => (
                                    <tr key={it.id} className="border-t border-slate-700/50 hover:bg-slate-800">
                                      <td className="px-3 py-2 font-medium text-slate-100">{it.roomNo}</td>
                                      <td className="px-3 py-2 text-slate-200">
                                        <div className="flex items-center gap-2">
                                          <DeliveredThumb imageUrl={productImageMap.get(it.productId) ?? null} alt={it.productName} />
                                          <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                                          <span className="truncate">
                                            {it.productName}
                                            {it.isGift && <Gift className="inline h-3 w-3 ml-1 text-pink-400" />}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 text-amber-300">{flavorText(it.flavors) || "—"}</td>
                                      <td className="px-3 py-2 text-right text-slate-200 font-medium">x{it.qty}</td>
                                      <td className="px-3 py-2 text-slate-400">{relTime(it.deliveredAt)}</td>
                                      <td className="px-3 py-2 text-right">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-7 text-slate-300 hover:bg-slate-700 hover:text-slate-100"
                                          onClick={() => handleReprint(it)}
                                        >
                                          <Printer className="h-3.5 w-3.5 mr-1" /> 重打
                                        </Button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </ScrollArea>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      </div>

      {/* 房间消费明细弹窗 */}
      <RoomOrderDialog
        order={viewRoomOrder}
        colors={colors}
        onClose={() => setViewRoomOrder(null)}
      />
        </TabsContent>

        <TabsContent value="history" className="focus-visible:outline-none">
          <ProductionHistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============ KPI 卡 ============
function KpiCard({
  title, value, loading, color, icon,
}: {
  title: string;
  value: number | string;
  loading?: boolean;
  color?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-xl p-4 border border-slate-700/50 bg-slate-800"
      style={color ? { boxShadow: `inset 0 0 0 1px ${color}22` } : undefined}
    >
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-400">{title}</div>
        {icon && color && (
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${color}22`, color }}
          >
            {icon}
          </div>
        )}
      </div>
      {loading ? (
        <Skeleton className="h-8 w-16 mt-1.5 bg-slate-700" />
      ) : (
        <div
          className="text-3xl font-extrabold mt-1 tabular-nums"
          style={color ? { color } : undefined}
        >
          {value}
        </div>
      )}
    </div>
  );
}

// ============ 迷你房态块 ============
function MiniRoomBlock({
  room, colors, onClick,
}: {
  room: KtvRoomInfoV2;
  colors: RoomStatusColors;
  onClick: () => void;
}) {
  const color = colors[room.status] ?? "#6b7280";
  const elapsed = room.openedAt
    ? Math.floor((Date.now() - new Date(room.openedAt).getTime()) / 60000)
    : 0;
  return (
    <button
      onClick={onClick}
      className="text-left rounded-lg p-1.5 min-h-[56px] h-full flex flex-col transition-all hover:scale-[1.04] focus:outline-none focus:ring-2 focus:ring-white/40"
      style={{ backgroundColor: color, boxShadow: `0 2px 6px ${color}40` }}
      title={`${room.roomNo} · ${room.roomName} · ${STATUS_LABEL[room.status]}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-white font-bold text-sm drop-shadow">{room.roomNo}</span>
        {room.status === "in_use" && (
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        )}
      </div>
      {room.status === "in_use" && (
        <div className="text-[9px] text-white/90 mt-0.5">{elapsed}分</div>
      )}
      {room.currentOrder && room.currentOrder.productFee > 0 && (
        <div className="text-[9px] text-white/95 font-medium leading-none mt-0.5">
          {yuan(room.currentOrder.productFee)}
        </div>
      )}
    </button>
  );
}

// ============ 出单品卡片（外卖接单屏样式） ============
function ProductionCard({
  item, dept, deptColor, imageUrl, onDeliver,
}: {
  item: KtvOrderItemInfoV2 & { roomNo: string; customerName: string | null };
  dept: Dept;
  deptColor: string;
  imageUrl: string | null;
  onDeliver: () => void;
}) {
  const flavors = flavorText(item.flavors);
  const elapsed = Math.floor((Date.now() - new Date(item.createdAt).getTime()) / 60000);
  const isUrgent = elapsed > 10;
  const isPrinted = item.status === "printed";
  const deptMeta = DEPT_META[dept];

  return (
    <div
      className="relative bg-slate-800 rounded-lg overflow-hidden border border-slate-700 hover:border-slate-500 transition-colors"
      style={{ borderLeft: `4px solid ${deptColor}` }}
    >
      <div className="p-3">
        <div className="flex items-start justify-between mb-1.5">
          <div className="flex items-start gap-2 min-w-0">
            {/* 部门图标色块 */}
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${deptColor}22`, color: deptColor }}
            >
              {deptMeta.icon}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-extrabold text-slate-100">{item.roomNo}</span>
                {item.customerName && (
                  <span className="text-[11px] text-slate-400 truncate max-w-20">{item.customerName}</span>
                )}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" />
                {new Date(item.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                <span className={isUrgent ? "text-rose-400 font-bold ml-1" : "text-slate-500 ml-1"}>
                  · {elapsed}分前
                </span>
              </div>
            </div>
          </div>
          {isPrinted ? (
            <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[10px] gap-0.5">
              <CheckCircle2 className="h-2.5 w-2.5" /> 已打单
            </Badge>
          ) : (
            <Badge className="bg-amber-600 hover:bg-amber-600 text-white text-[10px] gap-0.5">
              <Clock className="h-2.5 w-2.5" /> 待出
            </Badge>
          )}
        </div>

        <div className="bg-slate-900 rounded p-2 mb-2">
          <div className="flex items-center justify-between gap-2">
            <div className="text-slate-100 font-medium text-sm flex items-center gap-2 min-w-0">
              {/* 商品缩略图 40x40 */}
              <CardThumb imageUrl={imageUrl} alt={item.productName} />
              <span className="flex items-center gap-1 truncate">
                {item.isGift && <Gift className="h-3.5 w-3.5 text-pink-400 shrink-0" />}
                <span className="truncate">{item.productName}</span>
              </span>
            </div>
            <div className="flex items-baseline gap-1 shrink-0">
              <span className="text-[10px] text-slate-500">x</span>
              <span className="text-2xl font-extrabold text-emerald-400 leading-none">{item.qty}</span>
            </div>
          </div>
          {flavors && (
            <div className="mt-1 flex flex-wrap gap-1">
              {flavors.split("/").map((f, i) => (
                <span key={i} className="text-[10px] bg-amber-950/40 text-amber-300 border border-amber-700/40 rounded px-1.5 py-0.5">
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>

        <Button
          onClick={onDeliver}
          className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <CheckCircle2 className="h-4 w-4 mr-1" />
          出单送达
        </Button>
      </div>
      {isUrgent && (
        <div className="absolute top-0 right-0 w-0 h-0 border-t-[20px] border-l-[20px] border-t-rose-500 border-l-transparent" />
      )}
    </div>
  );
}

// ============ 商品缩略图（40x40 圆角，无图隐藏） ============
function CardThumb({ imageUrl, alt }: { imageUrl: string | null; alt: string }) {
  const [err, setErr] = useState(false);
  if (!imageUrl || err) return null;
  return (
    <img
      src={imageUrl}
      alt={alt}
      loading="lazy"
      onError={() => setErr(true)}
      className="h-10 w-10 rounded-md object-cover ring-1 ring-white/10 shrink-0"
    />
  );
}

// ============ 已出品表行缩略图（28x28，无图隐藏） ============
function DeliveredThumb({ imageUrl, alt }: { imageUrl: string | null; alt: string }) {
  const [err, setErr] = useState(false);
  if (!imageUrl || err) return null;
  return (
    <img
      src={imageUrl}
      alt={alt}
      loading="lazy"
      onError={() => setErr(true)}
      className="h-7 w-7 rounded-md object-cover ring-1 ring-white/10 shrink-0"
    />
  );
}

// ============ 空状态 ============
function EmptyState({ text }: { text: string }) {
  return (
    <div className="bg-slate-800/30 border border-dashed border-slate-700 rounded-lg p-8 text-center">
      <ShoppingBag className="h-8 w-8 text-slate-600 mx-auto mb-2" />
      <div className="text-sm text-slate-500">{text}</div>
    </div>
  );
}

// ============ 房间消费明细弹窗 ============
function RoomOrderDialog({
  order, colors, onClose,
}: {
  order: KtvOrderInfoV2 | null;
  colors: RoomStatusColors;
  onClose: () => void;
}) {
  if (!order) return null;
  const elapsed = Math.max(1, Math.ceil((Date.now() - new Date(order.openedAt).getTime()) / 60000));
  const roomFee = Math.round(order.hourlyRate * (elapsed / 60) * 100) / 100;

  return (
    <Dialog open={!!order} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg bg-slate-800 border-slate-700 text-slate-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: colors.in_use }} />
            {order.roomNo} · {order.orderNo}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {order.customerName || "散客"} · {order.customerCount} 人 · {relTime(order.openedAt)} 开台
            {order.bookingManagerName ? ` · 经理 ${order.bookingManagerName}` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <Stat label="已用时" value={`${elapsed} 分`} />
            <Stat label="包厢费" value={yuan(roomFee)} />
            <Stat label="商品费" value={yuan(order.productFee)} />
          </div>
          <div className="bg-slate-900 rounded-lg p-2 max-h-80 overflow-y-auto">
            <div className="text-xs text-slate-400 mb-1.5 flex items-center gap-1">
              <Receipt className="h-3.5 w-3.5" /> 消费明细（{order.items?.length ?? 0} 项）
            </div>
            {order.items && order.items.length > 0 ? (
              <div className="space-y-1">
                {order.items.map((it) => (
                  <div key={it.id} className="flex items-center gap-2 text-xs py-1 border-b border-slate-700/50">
                    <div className="flex-1 min-w-0">
                      <div className="text-slate-100 truncate">
                        {it.productName}
                        {it.isGift && <Gift className="inline h-3 w-3 ml-1 text-pink-400" />}
                      </div>
                      {it.flavors && (
                        <div className="text-[10px] text-amber-300">{flavorText(it.flavors)}</div>
                      )}
                      <div className="text-[10px] text-slate-500">
                        {relTime(it.createdAt)} · {deptLabel(it.outputDept)}
                      </div>
                    </div>
                    <span className="text-slate-300 text-[11px]">x{it.qty}</span>
                    <span className="text-emerald-400 font-medium w-14 text-right">{yuan(it.price * it.qty)}</span>
                    <ItemStatusBadge status={it.status} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 text-center py-3">暂无明细</div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-900 rounded p-2 text-center">
      <div className="text-[10px] text-slate-500">{label}</div>
      <div className="text-sm font-bold text-slate-100 mt-0.5">{value}</div>
    </div>
  );
}

function ItemStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: "待出", cls: "bg-rose-950/50 text-rose-300 border-rose-700/40" },
    printed: { label: "已打单", cls: "bg-amber-950/50 text-amber-300 border-amber-700/40" },
    delivered: { label: "已送达", cls: "bg-emerald-950/50 text-emerald-300 border-emerald-700/40" },
    cancelled: { label: "已退", cls: "bg-slate-700 text-slate-400 border-slate-600" },
  };
  const m = map[status] ?? { label: status, cls: "bg-slate-700 text-slate-400" };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${m.cls}`}>{m.label}</span>
  );
}

function deptLabel(dept: string): string {
  const m: Record<string, string> = { bar: "吧台", kitchen: "厨房", fruit: "水果房", outside: "外卖" };
  return m[dept] ?? dept;
}

// ============ 出品历史查询 Tab ============

type HistoryItem = {
  id: string;
  productName: string;
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
  categoryName: string | null;
  createdAt: string;
  deliveredAt: string | null;
};

type HistoryStats = {
  total: number;
  delivered: number;
  cancelled: number;
  totalAmount: number;
  byDept: Array<{ name: string; count: number }>;
  byCategory: Array<{ name: string; count: number }>;
};

const DEPT_OPTS: Array<{ value: string; label: string; color: string }> = [
  { value: "bar", label: "吧台", color: "#f59e0b" },
  { value: "kitchen", label: "厨房", color: "#ef4444" },
  { value: "fruit", label: "水果房", color: "#10b981" },
  { value: "outside", label: "外卖", color: "#3b82f6" },
];

const DEPT_COLORS: Record<string, string> = {
  bar: "#f59e0b",
  kitchen: "#ef4444",
  fruit: "#10b981",
  outside: "#3b82f6",
};

const CAT_COLORS = ["#10b981", "#f59e0b", "#0284c7", "#e11d48", "#a855f7", "#14b8a6", "#f97316", "#6366f1"];

function ProductionHistoryTab() {
  const { toast } = useToast();
  const [dept, setDept] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [categories, setCategories] = useState<ProductCategoryInfo[]>([]);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [data, setData] = useState<{ items: HistoryItem[]; stats: HistoryStats } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  const query = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getProductionHistory({
        dept: dept && dept !== "all" ? dept : undefined,
        category: category && category !== "all" ? category : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit: 1000,
      });
      setData(res);
    } catch (e) {
      toast({ title: "查询失败", description: String(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [dept, category, startDate, endDate, toast]);

  useEffect(() => {
    query();
  }, [query]);

  const stats: HistoryStats = data?.stats ?? {
    total: 0, delivered: 0, cancelled: 0, totalAmount: 0, byDept: [], byCategory: [],
  };
  const items: HistoryItem[] = data?.items ?? [];

  const deptDist = stats.byDept.length > 0
    ? stats.byDept.map((d) => ({ ...d, label: deptLabel(d.name) }))
    : [];
  const catDist = stats.byCategory;

  const resetFilters = () => {
    setDept("all");
    setCategory("all");
    setStartDate("");
    setEndDate("");
  };

  const handlePrint = () => {
    if (!data) return;
    printHistoryHtml(items, stats, { dept, category, startDate, endDate });
  };

  return (
    <div className="space-y-4">
      {/* 筛选栏 */}
      <div className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-4">
        <div className="flex items-center gap-1.5 mb-3">
          <Filter className="h-4 w-4 text-emerald-400" />
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
                {DEPT_OPTS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
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
          <Button size="sm" variant="outline" onClick={resetFilters} className="bg-slate-900/60 border-slate-700 text-slate-300 hover:bg-slate-700 h-9">
            <X className="h-3.5 w-3.5" /> 重置
          </Button>
          <Button size="sm" variant="outline" onClick={handlePrint} disabled={!data || items.length === 0} className="bg-slate-900/60 border-slate-700 text-slate-200 hover:bg-slate-700 h-9 ml-auto">
            <Printer className="h-4 w-4" /> 打印
          </Button>
        </div>
      </div>

      {/* 顶部 KPI 统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="总出品数" value={stats.total} color="#0284c7" icon={<Receipt className="h-4 w-4" />} loading={loading} />
        <StatCard label="已送达" value={stats.delivered} color="#10b981" icon={<CheckCircle2 className="h-4 w-4" />} loading={loading} />
        <StatCard label="已退" value={stats.cancelled} color="#ef4444" icon={<X className="h-4 w-4" />} loading={loading} />
        <StatCard label="总金额" value={yuan(stats.totalAmount)} color="#f59e0b" icon={<BarChart3 className="h-4 w-4" />} loading={loading} />
      </div>

      {/* 出品点分布 + 大类分布 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <BarChart3 className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-200">出品点分布</h3>
          </div>
          {deptDist.length === 0 ? (
            <div className="text-xs text-slate-500 py-6 text-center">暂无数据</div>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptDist} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                  <XAxis type="number" stroke="#475569" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis type="category" dataKey="label" stroke="#475569" tick={{ fontSize: 11, fill: "#cbd5e1" }} width={56} />
                  <RTooltip
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9", fontSize: 12 }}
                    cursor={{ fill: "#33415540" }}
                    formatter={(v: number) => [`${v} 单`, "数量"]}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {deptDist.map((d) => (
                      <Cell key={d.name} fill={DEPT_COLORS[d.name] ?? "#64748b"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <BarChart3 className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-slate-200">大类分布</h3>
          </div>
          {catDist.length === 0 ? (
            <div className="text-xs text-slate-500 py-6 text-center">暂无数据</div>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {catDist.map((c, i) => {
                const max = catDist[0]?.count ?? 1;
                const pct = Math.round((c.count / max) * 100);
                return (
                  <div key={c.name} className="flex items-center gap-2">
                    <div className="text-xs text-slate-300 w-20 truncate">{c.name}</div>
                    <div className="flex-1 h-3 bg-slate-900/80 rounded overflow-hidden">
                      <div
                        className="h-full rounded transition-all"
                        style={{ width: `${pct}%`, backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }}
                      />
                    </div>
                    <div className="text-xs text-slate-400 w-10 text-right tabular-nums">{c.count}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 明细表格 */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <History className="h-4 w-4 text-sky-400" />
            <h3 className="text-sm font-semibold text-slate-200">出品明细</h3>
            <Badge variant="outline" className="border-slate-600 text-slate-300 bg-slate-900/40">
              {items.length} 条
            </Badge>
          </div>
          <div className="text-xs text-slate-400">
            金额合计：<span className="text-emerald-300 font-semibold tabular-nums">{yuan(stats.totalAmount)}</span>
          </div>
        </div>
        <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full bg-slate-700/50" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">暂无符合条件的出品记录</div>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-slate-900/80 sticky top-0 z-10">
                <tr className="text-slate-300">
                  <th className="text-left font-medium px-3 py-2">时间</th>
                  <th className="text-left font-medium px-3 py-2">包厢</th>
                  <th className="text-left font-medium px-3 py-2">商品</th>
                  <th className="text-left font-medium px-3 py-2">大类</th>
                  <th className="text-left font-medium px-3 py-2">出品点</th>
                  <th className="text-left font-medium px-3 py-2">口味</th>
                  <th className="text-right font-medium px-3 py-2">数量</th>
                  <th className="text-right font-medium px-3 py-2">单价</th>
                  <th className="text-right font-medium px-3 py-2">金额</th>
                  <th className="text-left font-medium px-3 py-2">状态</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-t border-slate-700/50 odd:bg-slate-800/30 hover:bg-slate-700/40">
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">
                      {new Date(it.createdAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-3 py-2 text-slate-200 font-medium">{it.roomNo ?? "—"}</td>
                    <td className="px-3 py-2 text-slate-100">
                      {it.isGift && <Gift className="inline h-3 w-3 text-pink-400 mr-1" />}
                      {it.productName}
                    </td>
                    <td className="px-3 py-2 text-slate-300">{it.categoryName ?? "—"}</td>
                    <td className="px-3 py-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded border" style={{ color: DEPT_COLORS[it.outputDept] ?? "#94a3b8", borderColor: `${DEPT_COLORS[it.outputDept] ?? "#94a3b8"}40` }}>
                        {deptLabel(it.outputDept)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-amber-300">{flavorText(it.flavors) || "—"}</td>
                    <td className="px-3 py-2 text-right text-slate-200 tabular-nums">×{it.qty}</td>
                    <td className="px-3 py-2 text-right text-slate-400 tabular-nums">{yuan(it.price)}</td>
                    <td className="px-3 py-2 text-right text-emerald-300 font-medium tabular-nums">{yuan(it.amount)}</td>
                    <td className="px-3 py-2"><ItemStatusBadge status={it.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// 简单统计卡片（出品历史用）
function StatCard({
  label, value, color, icon, loading,
}: {
  label: string;
  value: number | string;
  color: string;
  icon?: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <div
      className="rounded-xl p-4 border border-slate-700/50 bg-slate-800"
      style={{ boxShadow: `inset 0 0 0 1px ${color}22` }}
    >
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-400">{label}</div>
        {icon && (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}22`, color }}>
            {icon}
          </div>
        )}
      </div>
      {loading ? (
        <Skeleton className="h-7 w-20 mt-1.5 bg-slate-700" />
      ) : (
        <div className="text-2xl font-bold mt-1 tabular-nums" style={{ color }}>{value}</div>
      )}
    </div>
  );
}

// ============ 打印：新窗口写入 HTML 表格 ============
function printHistoryHtml(
  items: HistoryItem[],
  stats: HistoryStats,
  filters: { dept: string; category: string; startDate: string; endDate: string },
) {
  const w = window.open("", "_blank", "width=1024,height=720");
  if (!w) return;
  const deptLabel = (d: string) => ({ bar: "吧台", kitchen: "厨房", fruit: "水果房", outside: "外卖" } as Record<string, string>)[d] ?? d;
  const statusLabel = (s: string) => ({ pending: "待出品", printed: "已打单", delivered: "已送达", cancelled: "已退" } as Record<string, string>)[s] ?? s;
  const esc = (v: unknown) => String(v ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));
  const filterDesc = [
    filters.dept === "all" ? "全部出品点" : deptLabel(filters.dept),
    filters.category === "all" ? "全部大类" : filters.category,
    filters.startDate || "不限",
    filters.endDate || "至今",
  ].join(" / ");

  const rows = items.map((it) => `
    <tr>
      <td>${new Date(it.createdAt).toLocaleString("zh-CN")}</td>
      <td>${esc(it.roomNo)}</td>
      <td>${it.isGift ? "[赠] " : ""}${esc(it.productName)}</td>
      <td>${esc(it.categoryName)}</td>
      <td>${deptLabel(it.outputDept)}</td>
      <td>${esc(it.flavors ? flavorText(it.flavors) : "")}</td>
      <td class="num">${it.qty}</td>
      <td class="num">${it.price.toFixed(2)}</td>
      <td class="num">${it.amount.toFixed(2)}</td>
      <td>${statusLabel(it.status)}</td>
    </tr>`).join("");

  const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
    <title>出品历史 · ${new Date().toLocaleString("zh-CN")}</title>
    <style>
      * { font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif; box-sizing: border-box; }
      body { margin: 20px; color: #1e293b; }
      h1 { font-size: 20px; margin: 0 0 4px; }
      .meta { color: #64748b; font-size: 12px; margin-bottom: 12px; }
      .kpis { display: flex; gap: 16px; margin-bottom: 16px; padding: 12px 16px; background: #f1f5f9; border-radius: 6px; }
      .kpis div { font-size: 13px; }
      .kpis b { font-size: 18px; color: #0f172a; margin-left: 6px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th { background: #1e293b; color: #f1f5f9; padding: 8px; text-align: left; font-weight: 600; }
      td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
      tr:nth-child(even) td { background: #f8fafc; }
      .num { text-align: right; font-variant-numeric: tabular-nums; }
      @media print { body { margin: 0; } .no-print { display: none; } }
    </style></head><body>
    <h1>出品历史明细</h1>
    <div class="meta">筛选：${esc(filterDesc)} · 生成时间：${new Date().toLocaleString("zh-CN")}</div>
    <div class="kpis">
      <div>总出品<b>${stats.total}</b></div>
      <div>已送达<b>${stats.delivered}</b></div>
      <div>已退<b>${stats.cancelled}</b></div>
      <div>总金额<b>¥${stats.totalAmount.toFixed(2)}</b></div>
    </div>
    <table>
      <thead><tr>
        <th>时间</th><th>包厢</th><th>商品</th><th>大类</th><th>出品点</th>
        <th>口味</th><th class="num">数量</th><th class="num">单价</th><th class="num">金额</th><th>状态</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <script>window.onload = () => { setTimeout(() => window.print(), 300); };<\/script>
    </body></html>`;
  w.document.open();
  w.document.write(html);
  w.document.close();
}
