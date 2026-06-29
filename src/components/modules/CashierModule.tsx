// KTV 收银系统 — 房态图 + 开台 + 点单 + 买单 + 赠送 + 转房
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  Clock,
  Sparkles,
  X,
  Search,
  Phone,
  User,
  CreditCard,
  Wallet,
  Plus,
  Minus,
  ShoppingBag,
  Receipt,
  ChefHat,
  Banknote,
  QrCode,
  Smartphone,
  Gift,
  Printer,
  ArrowRightLeft,
  Package,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Settings2,
  DoorOpen,
  Activity,
  Music2,
  TrendingUp,
  Wine,
  Cherry,
  CalendarClock,
  Wrench,
  LogIn,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { AiChatWidget } from "@/components/common/AiChatWidget";
import type {
  KtvRoomInfoV2,
  KtvOrderInfoV2,
  KtvOrderItemInfoV2,
  KtvDashboardSummary,
  ProductInfo,
  BookingManagerInfo,
  MemberInfo,
  RoomStatusColors,
  RoomDisplayFields,
} from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { yuan, relTime, fullTime } from "@/components/common/format";

// ============ 局部类型 ============
interface EmployeeInfo {
  id: string;
  name: string;
  phone: string | null;
  position: string;
  department: string | null;
  role: string;
  discount: number;
  monthlyGiftLimit: number;
  usedGiftAmount: number;
  resetMonth: number;
  status: number;
  entryDate: string;
}

interface BillItem {
  id: string;
  productName: string;
  price: number;
  qty: number;
  amount: number;
  flavors: Array<{ category: string; flavor: string }> | null;
  outputDept: string;
  status: string;
  isGift: boolean;
  giftRemark: string | null;
  createdAt: string;
}

interface OrderBill {
  orderId: string;
  orderNo: string;
  roomNo: string;
  roomName: string;
  roomType: string;
  billingMode: string;
  hourlyRate: number;
  minSpend: number;
  openedAt: string;
  closedAt: string | null;
  elapsedMinutes: number;
  customerName: string | null;
  customerCount: number;
  bookingManagerName: string | null;
  items: BillItem[];
  roomFee: number;
  productFee: number;
  discount: number;
  totalAmount: number;
  payMethod: string | null;
  status: string;
  member: { name: string; cardNo: string; discount: number; balance: number } | null;
}

// ============ 常量 ============
// 视觉升级：降低饱和度的专业配色（emerald-600/sky-600/amber-500/rose-600/violet-500/slate-600）
const DEFAULT_STATUS_COLORS: RoomStatusColors = {
  idle: "#059669",
  reserved: "#0284c7",
  seated: "#f59e0b",
  in_use: "#e11d48",
  cleaning: "#8b5cf6",
  maintenance: "#475569",
  checkout: "#eab308",
};

const DEFAULT_DISPLAY_FIELDS: RoomDisplayFields = {
  roomNo: true,
  roomName: true,
  roomType: true,
  area: false,
  bookingManager: true,
  customerName: true,
  customerCount: true,
  consume: true,
  openedAt: true,
  duration: true,
};

const STATUS_LABEL: Record<keyof RoomStatusColors, string> = {
  idle: "空闲",
  reserved: "预订",
  seated: "带位",
  in_use: "使用中",
  cleaning: "清扫",
  maintenance: "维修",
  checkout: "打单中",
};

// ============ 辅助函数 ============
function shade(hex: string, percent: number): string {
  const m = hex.replace("#", "");
  if (m.length !== 6) return hex;
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  const f = (c: number) =>
    Math.max(0, Math.min(255, Math.round(c + (percent / 100) * 255)));
  const toHex = (c: number) => f(c).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

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

function flavorTextFromObj(flavors: BillItem["flavors"]): string {
  if (!flavors || flavors.length === 0) return "";
  return flavors.map((f) => f.flavor).join("/");
}

function deptLabel(dept: string): string {
  const m: Record<string, string> = { bar: "吧台", kitchen: "厨房", fruit: "水果房", outside: "外卖" };
  return m[dept] ?? dept;
}

function deptColor(dept: string): string {
  const m: Record<string, string> = {
    bar: "border-amber-500/50 text-amber-300 bg-amber-950/30",
    kitchen: "border-rose-500/50 text-rose-300 bg-rose-950/30",
    fruit: "border-emerald-500/50 text-emerald-300 bg-emerald-950/30",
    outside: "border-sky-500/50 text-sky-300 bg-sky-950/30",
  };
  return m[dept] ?? "border-slate-500/50 text-slate-300 bg-slate-800";
}

interface ItemStatusMeta {
  label: string;
  className: string;
}

function itemStatusMeta(status: string): ItemStatusMeta {
  const m: Record<string, ItemStatusMeta> = {
    pending: { label: "待出品", className: "border-amber-500/50 text-amber-300 bg-amber-950/30" },
    printed: { label: "已打单", className: "border-sky-500/50 text-sky-300 bg-sky-950/30" },
    delivered: { label: "已送达", className: "border-emerald-500/50 text-emerald-300 bg-emerald-950/30" },
    cancelled: { label: "已退", className: "border-rose-500/50 text-rose-300 bg-rose-950/30" },
  };
  return m[status] ?? { label: status, className: "border-slate-500/50 text-slate-300" };
}

function billingModeLabel(mode: string): string {
  const m: Record<string, string> = {
    hourly: "计时",
    minspend: "最低消费",
    package: "开房套餐",
    free: "免费",
  };
  return m[mode] ?? mode;
}

function billingModeDesc(bill: OrderBill): string {
  switch (bill.billingMode) {
    case "hourly":
      return `${bill.elapsedMinutes} 分钟 × ${yuan(bill.hourlyRate)}/小时`;
    case "minspend":
      return `最低消费 ${yuan(bill.minSpend)}`;
    case "package":
      return "开房套餐价";
    case "free":
      return "免费时段";
    default:
      return "";
  }
}

function payMethodLabel(m: string | null): string {
  const map: Record<string, string> = {
    cash: "现金",
    wechat: "微信",
    alipay: "支付宝",
    member: "会员卡",
    card: "银行卡",
  };
  return m ? (map[m] ?? m) : "—";
}

/** 套餐的实际售价（兼容 seed 中 packagePrice=0 的情况） */
function effectivePrice(p: ProductInfo): number {
  if (p.isPackage) return p.packagePrice > 0 ? p.packagePrice : p.price;
  return p.price;
}

/** 解析套餐子项 */
function parsePackageItems(p: ProductInfo): Array<{ productId: string; name?: string; qty: number }> {
  if (!p.packageItems) return [];
  try {
    const parsed = JSON.parse(p.packageItems);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ============ 主组件 ============
export function CashierModule() {
  const [rooms, setRooms] = useState<KtvRoomInfoV2[]>([]);
  const [summary, setSummary] = useState<KtvDashboardSummary | null>(null);
  const [orders, setOrders] = useState<KtvOrderInfoV2[]>([]);
  const [colors, setColors] = useState<RoomStatusColors>(DEFAULT_STATUS_COLORS);
  const [fields, setFields] = useState<RoomDisplayFields>(DEFAULT_DISPLAY_FIELDS);
  const [loading, setLoading] = useState(true);
  const [openRoom, setOpenRoom] = useState<KtvRoomInfoV2 | null>(null);
  const [orderRoom, setOrderRoom] = useState<KtvRoomInfoV2 | null>(null);
  const [successBill, setSuccessBill] = useState<OrderBill | null>(null);
  const [reserveOpen, setReserveOpen] = useState(false);
  const [maintainOpen, setMaintainOpen] = useState(false);
  const [shiftOpen, setShiftOpen] = useState(false);
  const { toast } = useToast();

  const load = useCallback(async () => {
    try {
      const [r, s, o, cfgs] = await Promise.all([
        api.getKtvRooms(),
        api.getKtvDashboard(),
        api.getKtvOrders("open"),
        api.getSysConfigs(),
      ]);
      setRooms(r);
      setSummary(s);
      setOrders(o);
      const colorCfg = cfgs.find((c) => c.configKey === "room_status_colors");
      if (colorCfg) {
        try {
          setColors({ ...DEFAULT_STATUS_COLORS, ...JSON.parse(colorCfg.configValue) });
        } catch { /* ignore */ }
      }
      const fieldCfg = cfgs.find((c) => c.configKey === "room_display_fields");
      if (fieldCfg) {
        try {
          setFields({ ...DEFAULT_DISPLAY_FIELDS, ...JSON.parse(fieldCfg.configValue) });
        } catch { /* ignore */ }
      }
    } catch (e) {
      toast({ title: "加载失败", description: String(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [load]);

  const groupedByArea = useMemo(() => {
    const g: Record<string, KtvRoomInfoV2[]> = {};
    for (const r of rooms) {
      const key = r.area || "未分区";
      (g[key] ??= []).push(r);
    }
    return g;
  }, [rooms]);

  // 区域筛选
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const areas = Object.keys(groupedByArea);
  const filteredRooms = areaFilter === "all" ? rooms : (groupedByArea[areaFilter] ?? []);

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = {
      idle: 0, reserved: 0, seated: 0, in_use: 0, cleaning: 0, maintenance: 0, checkout: 0,
    };
    for (const r of rooms) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [rooms]);

  const handleRoomClick = (room: KtvRoomInfoV2) => {
    if (room.status === "idle" || room.status === "reserved") {
      setOpenRoom(room);
    } else if (room.status === "in_use" || room.status === "checkout") {
      // 使用中 / 打单中 → 打开点单+买单弹窗（checkout 已打单，待支付）
      setOrderRoom(room);
    } else if (room.status === "cleaning") {
      api.cleanRoom(room.id).then(() => {
        toast({ title: `${room.roomNo} 已恢复空闲` });
        load();
      }).catch((e) => toast({ title: "操作失败", description: String(e), variant: "destructive" }));
    } else if (room.status === "maintenance") {
      toast({ title: `${room.roomNo} 维修中`, description: "请在「维修」菜单解除维修后使用" });
    } else {
      toast({ title: `${room.roomNo} 当前状态：${STATUS_LABEL[room.status as keyof RoomStatusColors] ?? room.status}`, description: "该状态不可操作" });
    }
  };

  const handleCheckoutSuccess = useCallback(async (orderId: string) => {
    // 买单成功 → 立即刷新 KPI（今日营收/今日开台）
    load();
    try {
      const bill = (await api.getOrderBill(orderId)) as OrderBill;
      setSuccessBill(bill);
    } catch (e) {
      toast({ title: "账单加载失败", description: String(e), variant: "destructive" });
    }
  }, [load, toast]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 -m-4 md:-m-6 lg:-m-8 p-4 md:p-6 lg:p-8 rounded-none">
      {/* 顶部 KPI — 大数字 + 图标色块 + 渐变背景 */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-5 mb-5">
        <KpiCard title="总包厢" value={summary?.totalRooms ?? 0} loading={loading} icon={Music2} accent="slate" />
        <KpiCard title="使用中" value={summary?.inUseRooms ?? 0} loading={loading} icon={Activity} accent="rose" />
        <KpiCard title="空闲" value={summary?.idleRooms ?? 0} loading={loading} icon={CheckCircle2} accent="emerald" />
        <KpiCard title="今日营收" value={summary ? yuan(summary.todayRevenue) : "—"} loading={loading} icon={TrendingUp} accent="emerald" isText />
        <KpiCard title="今日开台" value={summary?.todayOrders ?? 0} loading={loading} icon={DoorOpen} accent="amber" />
      </div>

      {/* 图例栏 — 横向胶囊条：色点+文字+数字 */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800/60 rounded-2xl p-4 mb-6 border border-slate-700/50 shadow-lg shadow-black/20 flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-[0.15em] font-semibold text-slate-500 mr-2">房态图例</span>
        {(Object.keys(STATUS_LABEL) as Array<keyof RoomStatusColors>).map((k) => (
          <button
            key={k}
            onClick={() => toast({ title: STATUS_LABEL[k], description: `${statusCounts[k] ?? 0} 间` })}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 hover:bg-slate-700/70 hover:border-slate-600 transition-all hover:scale-[1.02]"
          >
            <span
              className="w-2.5 h-2.5 rounded-full shadow-inner ring-2 ring-black/20"
              style={{ backgroundColor: colors[k] }}
            />
            <span className="text-xs font-medium text-slate-200">{STATUS_LABEL[k]}</span>
            <span
              className="text-xs font-bold tabular-nums px-1.5 py-0.5 rounded-md min-w-[24px] text-center"
              style={{ backgroundColor: `${colors[k]}25`, color: colors[k] }}
            >
              {statusCounts[k] ?? 0}
            </span>
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 pl-3 border-l border-slate-700/60">
          <span className="text-xs text-slate-500 hidden sm:inline">每 20s 自动刷新</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setReserveOpen(true)}
            className="gap-1.5 bg-sky-950/40 border-sky-700/50 text-sky-300 hover:bg-sky-900/40 hover:border-sky-600 rounded-lg h-8"
          >
            <CalendarClock className="h-3.5 w-3.5" /> 订房
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setMaintainOpen(true)}
            className="gap-1.5 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-600 rounded-lg h-8"
          >
            <Wrench className="h-3.5 w-3.5" /> 维修
          </Button>
          <Button size="sm" variant="outline" onClick={load} className="gap-1.5 bg-slate-800 border-slate-700 text-slate-100 hover:bg-slate-700 hover:border-slate-600 rounded-lg h-8">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> 刷新
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShiftOpen(true)}
            className="gap-1.5 bg-emerald-950/40 border-emerald-700/50 text-emerald-300 hover:bg-emerald-900/40 hover:border-emerald-600 rounded-lg h-8"
          >
            <LogIn className="h-3.5 w-3.5" /> 交接班
          </Button>
        </div>
      </div>

      {/* 房态网格 */}
      {loading ? (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl bg-slate-800/60" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {/* 区域筛选条 — 横排，全部在最前 */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setAreaFilter("all")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                areaFilter === "all"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                  : "bg-slate-800/80 text-slate-300 border border-slate-700/60 hover:bg-slate-700/70",
              )}
            >
              全部 <span className="ml-1 text-xs opacity-70">{rooms.length}</span>
            </button>
            {areas.map((area) => {
              const list = groupedByArea[area];
              const inUse = list.filter((r) => r.status === "in_use").length;
              return (
                <button
                  key={area}
                  onClick={() => setAreaFilter(area)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                    areaFilter === area
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                      : "bg-slate-800/80 text-slate-300 border border-slate-700/60 hover:bg-slate-700/70",
                  )}
                >
                  {area}
                  <span className="text-xs opacity-70">{list.length}</span>
                  {inUse > 0 && (
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                      areaFilter === area ? "bg-white/20 text-white" : "bg-rose-950/60 text-rose-300",
                    )}>
                      {inUse}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 房台网格 — 紧凑排列 */}
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
            {filteredRooms.map((room) => (
              <RoomBlock
                key={room.id}
                room={room}
                colors={colors}
                fields={fields}
                onClick={() => handleRoomClick(room)}
              />
            ))}
          </div>
          {filteredRooms.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-sm">
              该区域暂无房台
            </div>
          )}
        </div>
      )}

      <OpenRoomDialog
        room={openRoom}
        onClose={() => setOpenRoom(null)}
        onSuccess={() => {
          setOpenRoom(null);
          load();
        }}
      />

      <OrderDialog
        room={orderRoom}
        orders={orders}
        rooms={rooms}
        colors={colors}
        onClose={() => setOrderRoom(null)}
        onChanged={load}
        onCheckoutSuccess={handleCheckoutSuccess}
      />

      {/* 买单成功后的完整账单（可打印） */}
      <SuccessBillDialog
        bill={successBill}
        onClose={() => setSuccessBill(null)}
      />

      {/* 订房 / 维修 弹窗 — 顶部操作栏触发 */}
      <ReserveRoomDialog
        open={reserveOpen}
        rooms={rooms}
        onClose={() => setReserveOpen(false)}
        onSuccess={() => {
          setReserveOpen(false);
          load();
        }}
      />
      <MaintainRoomDialog
        open={maintainOpen}
        rooms={rooms}
        onClose={() => setMaintainOpen(false)}
        onSuccess={() => {
          setMaintainOpen(false);
          load();
        }}
      />

      <ShiftDialog open={shiftOpen} onClose={() => setShiftOpen(false)} />

      <AiChatWidget title="收银助手" buttonColor="bg-emerald-600 hover:bg-emerald-500" />
    </div>
  );
}

// ============ KPI 卡 — 大数字 + 小标签 + 图标色块 ============
type Accent = "emerald" | "rose" | "amber" | "sky" | "violet" | "slate";

const ACCENT_STYLES: Record<Accent, { iconBg: string; iconColor: string; valueColor: string; glow: string }> = {
  emerald: { iconBg: "bg-emerald-500/15", iconColor: "text-emerald-400", valueColor: "text-emerald-400", glow: "from-emerald-500/5" },
  rose: { iconBg: "bg-rose-500/15", iconColor: "text-rose-400", valueColor: "text-rose-400", glow: "from-rose-500/5" },
  amber: { iconBg: "bg-amber-500/15", iconColor: "text-amber-400", valueColor: "text-amber-400", glow: "from-amber-500/5" },
  sky: { iconBg: "bg-sky-500/15", iconColor: "text-sky-400", valueColor: "text-sky-400", glow: "from-sky-500/5" },
  violet: { iconBg: "bg-violet-500/15", iconColor: "text-violet-400", valueColor: "text-violet-400", glow: "from-violet-500/5" },
  slate: { iconBg: "bg-slate-500/15", iconColor: "text-slate-300", valueColor: "text-slate-100", glow: "from-slate-500/5" },
};

function KpiCard({
  title, value, loading, icon: Icon, accent = "slate", isText,
}: {
  title: string;
  value: number | string;
  loading?: boolean;
  icon?: LucideIcon;
  accent?: Accent;
  isText?: boolean;
}) {
  const s = ACCENT_STYLES[accent];
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-5 border border-slate-700/50 bg-gradient-to-br ${s.glow} to-slate-800/60 shadow-lg shadow-black/20 transition-all hover:shadow-xl hover:shadow-black/30 hover:-translate-y-0.5 hover:border-slate-600/60`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs text-slate-400 font-medium tracking-wide">{title}</span>
        {Icon && (
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.iconBg} ${s.iconColor}`}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      {loading ? (
        <Skeleton className="h-8 w-20 bg-slate-700/60" />
      ) : (
        <div
          className={`${isText ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl"} font-bold tabular-nums leading-none ${s.valueColor}`}
        >
          {value}
        </div>
      )}
    </div>
  );
}

// ============ 房态色块 — rounded-2xl + 内阴影 + 状态胶囊 + 大房号 ============
function RoomBlock({
  room, colors, fields, onClick,
}: {
  room: KtvRoomInfoV2;
  colors: RoomStatusColors;
  fields: RoomDisplayFields;
  onClick: () => void;
}) {
  const color = colors[room.status] ?? "#475569";
  const elapsed = room.openedAt
    ? Math.floor((Date.now() - new Date(room.openedAt).getTime()) / 60000)
    : 0;
  const order = room.currentOrder;

  return (
    <button
      onClick={onClick}
      className="group relative text-left rounded-2xl p-4 min-h-[180px] h-full flex flex-col overflow-hidden transition-all hover:scale-[1.03] hover:shadow-2xl hover:shadow-black/40 focus:outline-none focus:ring-2 focus:ring-white/40 border border-black/20"
      style={{
        backgroundColor: color,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -2px 8px rgba(0,0,0,0.25), 0 6px 18px ${color}40`,
      }}
    >
      {/* 顶部高光渐变 */}
      <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

      <div className="relative flex items-start justify-between mb-2">
        <div className="text-white">
          {fields.roomNo && (
            <div className="text-3xl font-black leading-none drop-shadow-lg tracking-tight">{room.roomNo}</div>
          )}
          {fields.roomName && (
            <div className="text-[11px] opacity-90 mt-1 truncate font-medium">{room.roomName}</div>
          )}
        </div>
        {/* 状态胶囊：半透明黑底白字 */}
        <div className="text-[10px] font-semibold text-white bg-black/40 rounded-full px-2.5 py-1 backdrop-blur-sm ring-1 ring-white/10">
          {STATUS_LABEL[room.status]}
        </div>
      </div>

      <div className="relative space-y-0.5 text-[11px] text-white/95 mt-1 flex-1">
        {fields.roomType && (
          <div className="opacity-90">{room.roomType} · 容{room.capacity}人</div>
        )}
        {fields.area && room.area && (
          <div className="opacity-80">{room.area}</div>
        )}
        {fields.bookingManager && room.bookingManagerName && (
          <div className="opacity-90 truncate">经理: {room.bookingManagerName}</div>
        )}
        {fields.customerName && order?.customerName && (
          <div className="opacity-90 truncate">客: {order.customerName}</div>
        )}
        {fields.customerCount && order && (
          <div className="opacity-80">{order.customerCount} 人</div>
        )}
        {fields.openedAt && room.openedAt && (
          <div className="opacity-80">{new Date(room.openedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })} 开台</div>
        )}
        {fields.duration && room.openedAt && (
          <div className="opacity-95 font-semibold">已 {elapsed} 分钟</div>
        )}
      </div>

      {fields.consume && order && order.productFee > 0 && (
        <div className="relative mt-2 pt-2 border-t border-white/20">
          <div className="text-[10px] opacity-80">消费</div>
          <div className="text-white font-black text-xl leading-none drop-shadow-lg">
            {yuan(order.productFee)}
          </div>
        </div>
      )}

      {(room.status === "in_use" || room.status === "checkout") && (
        <span className="absolute top-2.5 right-2.5 flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
        </span>
      )}
    </button>
  );
}

// ============ 开台弹窗 ============
function OpenRoomDialog({
  room, onClose, onSuccess,
}: {
  room: KtvRoomInfoV2 | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [customerName, setCustomerName] = useState("");
  const [customerCount, setCustomerCount] = useState("4");
  const [phone, setPhone] = useState("");
  const [managerId, setManagerId] = useState<string>("none");
  const [managers, setManagers] = useState<BookingManagerInfo[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (room) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCustomerName("");
      setCustomerCount("4");
      setPhone("");
      setManagerId("none");
      setSubmitting(false);
    }
  }, [room]);

  useEffect(() => {
    api.getBookingManagers().then(setManagers).catch(() => {});
  }, []);

  const handleConfirm = async () => {
    if (!room) return;
    setSubmitting(true);
    try {
      const mgr = managers.find((m) => m.id === managerId);
      await api.openRoom(room.id, {
        customerName: customerName || undefined,
        customerCount: Number(customerCount) || 1,
        phone: phone || undefined,
        bookingManagerId: mgr?.id ?? null,
        bookingManagerName: mgr?.name ?? null,
      });
      toast({
        title: `${room.roomNo} 已开台`,
        description: `${customerName || "散客"} · ${customerCount} 人${mgr ? ` · 经理: ${mgr.name}` : ""}`,
      });
      onSuccess();
    } catch (e) {
      toast({ title: "开台失败", description: String(e), variant: "destructive" });
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!room} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md bg-slate-800 border-slate-700 text-slate-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            开台 · {room?.roomNo} {room?.roomName}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {room?.roomType} · {room?.capacity} 人 · {room ? yuan(room.hourlyRate) : ""}/小时
            {room && room.minSpend > 0 ? ` · 最低 ${yuan(room.minSpend)}` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label htmlFor="cust-name" className="text-slate-300">客户姓名</Label>
            <Input
              id="cust-name"
              placeholder="留空为散客"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="cust-count" className="text-slate-300">人数</Label>
              <Input
                id="cust-count"
                type="number"
                min={1}
                value={customerCount}
                onChange={(e) => setCustomerCount(e.target.value)}
                className="bg-slate-900 border-slate-700 text-slate-100"
              />
            </div>
            <div>
              <Label htmlFor="cust-phone" className="text-slate-300">电话</Label>
              <Input
                id="cust-phone"
                placeholder="可选"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500"
              />
            </div>
          </div>
          <div>
            <Label className="text-slate-300">订房经理</Label>
            <Select value={managerId} onValueChange={setManagerId}>
              <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-100">
                <SelectValue placeholder="选择经理（可选）" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                <SelectItem value="none">无</SelectItem>
                {managers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}（提成 {m.commissionRate}%）
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="bg-slate-700 border-slate-600 text-slate-100 hover:bg-slate-600">
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={submitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {submitting ? "开台中..." : "确认开台"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ 订房弹窗 — 顶部"订房"按钮触发 ============
function ReserveRoomDialog({
  open, rooms, onClose, onSuccess,
}: {
  open: boolean;
  rooms: KtvRoomInfoV2[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const idleRooms = useMemo(() => rooms.filter((r) => r.status === "idle"), [rooms]);
  const [roomId, setRoomId] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [remark, setRemark] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRoomId(idleRooms[0]?.id ?? "");
      setCustomerName("");
      setPhone("");
      setRemark("");
      setSubmitting(false);
    }
  }, [open, idleRooms]);

  const selected = idleRooms.find((r) => r.id === roomId);

  const handleConfirm = async () => {
    if (!roomId) {
      toast({ title: "请选择空闲房台", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await api.reserveRoom(roomId, {
        customerName: customerName.trim() || undefined,
        phone: phone.trim() || undefined,
        remark: remark.trim() || undefined,
      });
      const r = rooms.find((x) => x.id === roomId);
      toast({
        title: `${r?.roomNo ?? ""} 已订房`,
        description: customerName ? `客户：${customerName}` : "已标记为预订状态",
      });
      onSuccess();
    } catch (e) {
      toast({ title: "订房失败", description: String(e), variant: "destructive" });
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md bg-slate-800 border-slate-700 text-slate-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-sky-400" /> 订房
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            将空闲房台标记为「预订」状态，客人到店后点击该房台直接开台
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {idleRooms.length === 0 ? (
            <div className="text-sm text-slate-400 text-center py-6 bg-slate-900/60 rounded-lg border border-slate-700/50">
              当前无空闲房台可预订
            </div>
          ) : (
            <>
              <div>
                <Label className="text-slate-300">选择房台</Label>
                <Select value={roomId} onValueChange={setRoomId}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-100 mt-1">
                    <SelectValue placeholder="选择空闲房台" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-slate-100 max-h-72">
                    {idleRooms.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.roomNo} · {r.roomName}（{r.roomType}）
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selected && (
                  <div className="text-[11px] text-slate-500 mt-1">
                    容纳 {selected.capacity} 人 · {yuan(selected.hourlyRate)}/小时
                    {selected.minSpend > 0 ? ` · 最低 ${yuan(selected.minSpend)}` : ""}
                  </div>
                )}
              </div>
              <div>
                <Label className="text-slate-300">客户姓名（可选）</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="留空为预留"
                  className="bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 mt-1"
                />
              </div>
              <div>
                <Label className="text-slate-300">联系电话（可选）</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="可选"
                  className="bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 mt-1"
                />
              </div>
              <div>
                <Label className="text-slate-300">备注（可选）</Label>
                <Textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  rows={2}
                  placeholder="如：8点到店、3男2女"
                  className="bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 mt-1"
                />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="bg-slate-700 border-slate-600 text-slate-100 hover:bg-slate-600">
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={submitting || idleRooms.length === 0}
            className="bg-sky-600 hover:bg-sky-700 text-white"
          >
            {submitting ? "订房中..." : "确认订房"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ 维修弹窗 — 顶部"维修"按钮触发 ============
function MaintainRoomDialog({
  open, rooms, onClose, onSuccess,
}: {
  open: boolean;
  rooms: KtvRoomInfoV2[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  // 可置维修：空闲 / 预订 / 打单中 / 清扫；可解除维修：维修中
  const targetRooms = useMemo(
    () => rooms.filter((r) => r.status === "idle" || r.status === "reserved" || r.status === "checkout" || r.status === "cleaning"),
    [rooms],
  );
  const maintenanceRooms = useMemo(() => rooms.filter((r) => r.status === "maintenance"), [rooms]);
  const [mode, setMode] = useState<"set" | "unset">("set");
  const [roomId, setRoomId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMode("set");
      setRoomId(targetRooms[0]?.id ?? "");
      setSubmitting(false);
    }
  }, [open, targetRooms]);

  const list = mode === "set" ? targetRooms : maintenanceRooms;
  const selected = list.find((r) => r.id === roomId);

  const handleConfirm = async () => {
    if (!roomId) {
      toast({ title: mode === "set" ? "请选择要维修的房台" : "请选择要解除维修的房台", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await api.maintainRoom(roomId, mode);
      const r = rooms.find((x) => x.id === roomId);
      toast({
        title: mode === "set" ? `${r?.roomNo ?? ""} 已置维修` : `${r?.roomNo ?? ""} 已恢复空闲`,
        description: mode === "set" ? "该房台暂时无法使用，客人无法开台" : "可重新开台使用",
      });
      onSuccess();
    } catch (e) {
      toast({ title: "操作失败", description: String(e), variant: "destructive" });
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md bg-slate-800 border-slate-700 text-slate-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-slate-300" /> 维修房管理
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            将房台置为维修状态（设备故障/保洁维护），或解除维修恢复使用
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { setMode("set"); setRoomId(targetRooms[0]?.id ?? ""); }}
              className={cn(
                "rounded-lg border-2 p-2.5 text-center transition-all",
                mode === "set"
                  ? "border-amber-500 bg-amber-500/15 text-amber-300"
                  : "border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-600",
              )}
            >
              <div className="text-sm font-semibold">置维修</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{targetRooms.length} 个可选</div>
            </button>
            <button
              onClick={() => { setMode("unset"); setRoomId(maintenanceRooms[0]?.id ?? ""); }}
              className={cn(
                "rounded-lg border-2 p-2.5 text-center transition-all",
                mode === "unset"
                  ? "border-emerald-500 bg-emerald-500/15 text-emerald-300"
                  : "border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-600",
              )}
            >
              <div className="text-sm font-semibold">解除维修</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{maintenanceRooms.length} 个维修中</div>
            </button>
          </div>

          {list.length === 0 ? (
            <div className="text-sm text-slate-400 text-center py-6 bg-slate-900/60 rounded-lg border border-slate-700/50">
              {mode === "set" ? "无可置维修的房台" : "当前无维修中的房台"}
            </div>
          ) : (
            <div>
              <Label className="text-slate-300">
                {mode === "set" ? "选择要置维修的房台" : "选择要解除维修的房台"}
              </Label>
              <Select value={roomId} onValueChange={setRoomId}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-100 mt-1">
                  <SelectValue placeholder="选择房台" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-slate-100 max-h-72">
                  {list.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.roomNo} · {r.roomName}（{STATUS_LABEL[r.status as keyof RoomStatusColors] ?? r.status}）
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selected && (
                <div className="text-[11px] text-slate-500 mt-1">
                  类型：{selected.roomType} · 容纳 {selected.capacity} 人
                </div>
              )}
            </div>
          )}

          {mode === "set" && (
            <div className="text-[11px] text-amber-300/80 leading-relaxed bg-amber-950/20 border border-amber-700/30 rounded p-2 flex items-start gap-1.5">
              <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
              <span>置维修后该房台将无法开台/订房；如房台正在使用，请先结账。</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="bg-slate-700 border-slate-600 text-slate-100 hover:bg-slate-600">
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={submitting || list.length === 0}
            className={cn(
              mode === "set"
                ? "bg-amber-600 hover:bg-amber-500 text-white"
                : "bg-emerald-600 hover:bg-emerald-700 text-white",
            )}
          >
            {submitting ? "处理中..." : mode === "set" ? "确认置维修" : "解除维修"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ 商品缩略图：有图显图，无图用部门图标占位 ============
function DeptFallbackIcon({ dept, className }: { dept: string; className?: string }) {
  switch (dept) {
    case "bar": return <Wine className={className} />;
    case "kitchen": return <ChefHat className={className} />;
    case "fruit": return <Cherry className={className} />;
    case "outside": return <ShoppingBag className={className} />;
    default: return <Package className={className} />;
  }
}

function ProductThumb({
  product,
  className,
  iconClassName,
}: {
  product: ProductInfo;
  className?: string;
  iconClassName?: string;
}) {
  const [err, setErr] = useState(false);
  const showImg = !!product.imageUrl && !err;

  if (showImg) {
    return (
      <img
        src={product.imageUrl!}
        alt={product.name}
        loading="lazy"
        onError={() => setErr(true)}
        className={cn("object-cover ring-1 ring-white/10", className)}
      />
    );
  }
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-slate-800/80 ring-1 ring-white/10",
        className,
      )}
    >
      <DeptFallbackIcon
        dept={product.outputDept}
        className={cn("text-slate-500", iconClassName)}
      />
    </div>
  );
}

// ============ 点单 + 账单 + 更多 弹窗（3 个 Tab）============
function OrderDialog({
  room, orders, rooms, colors, onClose, onChanged, onCheckoutSuccess,
}: {
  room: KtvRoomInfoV2 | null;
  orders: KtvOrderInfoV2[];
  rooms: KtvRoomInfoV2[];
  colors: RoomStatusColors;
  onClose: () => void;
  onChanged: () => void;
  onCheckoutSuccess: (orderId: string) => void;
}) {
  // 当前进行中订单
  const order = useMemo(() => {
    if (!room) return null;
    return orders.find((o) => o.id === room.currentOrderId) ?? null;
  }, [room, orders]);

  const [products, setProducts] = useState<ProductInfo[]>([]);
  const [tab, setTab] = useState<"order" | "bill" | "more">("order");
  const [category, setCategory] = useState<string>("all");
  const [keyword, setKeyword] = useState("");
  const [cart, setCart] = useState<Array<{ product: ProductInfo; qty: number; flavors: string | null }>>([]);
  const [flavorPickerFor, setFlavorPickerFor] = useState<ProductInfo | null>(null);
  const [pendingFlavorQty, setPendingFlavorQty] = useState(1);
  const [selectedFlavors, setSelectedFlavors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // 买单相关
  const [phoneSearch, setPhoneSearch] = useState("");
  const [member, setMember] = useState<MemberInfo | null>(null);
  const [payMethod, setPayMethod] = useState("cash");
  const [searching, setSearching] = useState(false);

  // 账单相关
  const [bill, setBill] = useState<OrderBill | null>(null);
  const [billLoading, setBillLoading] = useState(false);
  const [billTick, setBillTick] = useState(0);
  // 打单流程：打印账单后才显示"买单"按钮，且房台状态置为"打单中"(checkout)
  const [billPrinted, setBillPrinted] = useState(false);
  const [printing, setPrinting] = useState(false);

  // 弹窗
  const [giftOpen, setGiftOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  useEffect(() => {
    api.getProducts().then(setProducts).catch(() => {});
  }, []);

  useEffect(() => {
    if (room) {
      setTab("order");
      setCart([]);
      setCategory("all");
      setKeyword("");
      setPhoneSearch("");
      setMember(null);
      setPayMethod("cash");
      setBill(null);
      setBillTick(0);
      // 已是 checkout 状态视为已打单
      setBillPrinted(room.status === "checkout");
      setPrinting(false);
    }
  }, [room]);

  // 切到账单 Tab 或订单变化时拉取账单
  useEffect(() => {
    if (tab === "bill" && order) {
      setBillLoading(true);
      api.getOrderBill(order.id)
        .then((b) => setBill(b as OrderBill))
        .catch((e) => {
          toast({ title: "账单加载失败", description: String(e), variant: "destructive" });
          setBill(null);
        })
        .finally(() => setBillLoading(false));
    }
  }, [tab, order, billTick, toast]);

  const categories = useMemo(() => {
    const s = new Map<string, string>();
    for (const p of products) s.set(p.categoryId, p.categoryName);
    return Array.from(s.entries()).map(([id, name]) => ({ id, name }));
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.status !== 1) return false;
      if (category !== "all" && p.categoryId !== category) return false;
      if (keyword && !p.name.includes(keyword) && !(p.pinyin ?? "").toLowerCase().includes(keyword.toLowerCase())) return false;
      return true;
    });
  }, [products, category, keyword]);

  const handleProductClick = (p: ProductInfo) => {
    if (p.stock <= 0) {
      toast({ title: `${p.name} 已售罄`, variant: "destructive" });
      return;
    }
    // 套餐直接下单（不选口味）
    if (p.isPackage) {
      addToCart(p, 1, null);
      return;
    }
    if (p.flavors && p.flavors.length > 0) {
      setSelectedFlavors({});
      setPendingFlavorQty(1);
      setFlavorPickerFor(p);
    } else {
      addToCart(p, 1, null);
    }
  };

  const addToCart = (p: ProductInfo, qty: number, flavors: string | null) => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.product.id === p.id && c.flavors === flavors);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + qty };
        return next;
      }
      return [...prev, { product: p, qty, flavors }];
    });
  };

  const updateCartQty = (idx: number, delta: number) => {
    setCart((prev) => {
      const next = [...prev];
      const newQty = next[idx].qty + delta;
      if (newQty <= 0) return next.filter((_, i) => i !== idx);
      next[idx] = { ...next[idx], qty: newQty };
      return next;
    });
  };

  const cartTotal = cart.reduce((s, c) => s + effectivePrice(c.product) * c.qty, 0);

  const refreshBill = () => setBillTick((t) => t + 1);

  const handleSubmitItems = async () => {
    if (!order || cart.length === 0) return;
    setSubmitting(true);
    try {
      await api.addOrderItems(order.id, cart.map((c) => ({
        productId: c.product.id,
        qty: c.qty,
        flavors: c.flavors,
      })));
      toast({
        title: "点单成功",
        description: `${cart.length} 种商品已加单 · ${yuan(cartTotal)}（按出品部门自动分流）`,
      });
      setCart([]);
      onChanged();
      refreshBill();
    } catch (e) {
      toast({ title: "点单失败", description: String(e), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelItem = async (item: KtvOrderItemInfoV2) => {
    if (!order) return;
    if (item.status === "delivered") {
      toast({ title: "无法退单", description: "已送达商品不允许退单", variant: "destructive" });
      return;
    }
    try {
      await api.cancelOrderItem(order.id, item.id);
      toast({ title: `已退：${item.productName} ×${item.qty}` });
      onChanged();
      refreshBill();
    } catch (e) {
      toast({ title: "退单失败", description: String(e), variant: "destructive" });
    }
  };

  const handleSearchMember = async () => {
    if (!phoneSearch) return;
    setSearching(true);
    try {
      const m = await api.getMemberByPhone(phoneSearch);
      if (m) {
        setMember(m);
        toast({ title: `会员：${m.name}`, description: `${m.level} · 折扣 ${Math.round(m.discount * 10)} 折 · 余额 ${yuan(m.balance)}` });
      } else {
        setMember(null);
        toast({ title: "未找到会员", description: `电话 ${phoneSearch} 无记录` });
      }
    } catch (e) {
      toast({ title: "查询失败", description: String(e), variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  const handleCheckout = async () => {
    if (!order) return;
    setSubmitting(true);
    try {
      const res = await api.checkoutOrder(order.id, {
        payMethod,
        memberId: member?.id,
      });
      toast({
        title: "买单成功",
        description: `${res.orderNo} · ${yuan(res.totalAmount)} · ${payMethodLabel(payMethod)}`,
      });
      onChanged();
      onClose();
      onCheckoutSuccess(order.id);
    } catch (e) {
      toast({ title: "买单失败", description: String(e), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGiftSuccess = () => {
    onChanged();
    refreshBill();
  };

  const handleTransferSuccess = () => {
    onChanged();
    onClose();
  };

  // 打印账单 — 拉取账单 → 渲染 HTML → window.print
  // 打印成功后：房台状态置为 "checkout"（打单中），并解锁"买单"按钮
  const handlePrintBill = async () => {
    if (!order || !room) return;
    setPrinting(true);
    try {
      // 拉取最新账单
      const b = (await api.getOrderBill(order.id)) as OrderBill;
      setBill(b);
      // 渲染并打印
      const html = renderBillPrintHtml(b);
      const w = window.open("", "_blank", "width=480,height=720");
      if (!w) {
        toast({ title: "打印失败", description: "浏览器拦截了弹窗，请允许", variant: "destructive" });
        return;
      }
      w.document.write(html);
      w.document.close();
      w.focus();
      setTimeout(() => {
        try { w.print(); } catch { /* ignore */ }
        try { w.close(); } catch { /* ignore */ }
      }, 250);

      // 标记已打单 + 切房台状态为 checkout
      setBillPrinted(true);
      if (room.status !== "checkout") {
        try {
          await api.setRoomStatus(room.id, "checkout");
        } catch (e) {
          // 状态更新失败不阻断流程，仅提示
          toast({ title: "房台状态更新失败", description: String(e), variant: "destructive" });
        }
      }
      toast({
        title: "账单已打印",
        description: `${b.orderNo} · 房台进入「打单中」状态，可点击下方买单按钮完成结算`,
      });
      onChanged();
    } catch (e) {
      toast({ title: "账单打印失败", description: String(e), variant: "destructive" });
    } finally {
      setPrinting(false);
    }
  };

  if (!room) return null;

  return (
    <Dialog open={!!room} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl bg-slate-800 border-slate-700 text-slate-100 max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: colors.in_use }} />
            {room.roomNo} {room.roomName}
            <Badge variant="outline" className="border-slate-600 text-slate-300 ml-2">
              {order?.orderNo ?? "—"}
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {order?.customerName || "散客"} · {order?.customerCount} 人 · {order ? yuan(order.hourlyRate) : ""}/小时
            {order?.bookingManagerName ? ` · 经理 ${order.bookingManagerName}` : ""}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "order" | "bill" | "more")} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="bg-slate-900 border border-slate-700">
            <TabsTrigger value="order" className="data-[state=active]:bg-slate-700">
              <ShoppingBag className="h-4 w-4 mr-1" /> 点单
            </TabsTrigger>
            <TabsTrigger value="bill" className="data-[state=active]:bg-slate-700">
              <Receipt className="h-4 w-4 mr-1" /> 账单
            </TabsTrigger>
            <TabsTrigger value="more" className="data-[state=active]:bg-slate-700">
              <Settings2 className="h-4 w-4 mr-1" /> 更多
            </TabsTrigger>
          </TabsList>

          {/* ========== 点单 Tab ========== */}
          <TabsContent value="order" className="flex-1 overflow-hidden mt-2">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 h-full">
              {/* 商品列表 */}
              <div className="md:col-span-3 flex flex-col">
                <div className="flex gap-2 mb-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      placeholder="搜索商品名/拼音"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      className="pl-8 bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <CategoryChip active={category === "all"} onClick={() => setCategory("all")}>全部</CategoryChip>
                  {categories.map((c) => (
                    <CategoryChip key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>
                      {c.name}
                    </CategoryChip>
                  ))}
                </div>
                <ScrollArea className="flex-1 max-h-[50vh] pr-2">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {filteredProducts.map((p) => {
                      const price = effectivePrice(p);
                      const children = p.isPackage ? parsePackageItems(p) : [];
                      return (
                        <button
                          key={p.id}
                          onClick={() => handleProductClick(p)}
                          disabled={p.stock <= 0}
                          className={cn(
                            "group relative text-left border rounded-lg p-2 transition-all disabled:opacity-40 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30",
                            p.isPackage
                              ? "bg-gradient-to-br from-amber-950/40 to-slate-900 border-amber-600/50 hover:border-amber-500"
                              : "bg-slate-900 hover:bg-slate-800 border-slate-700 hover:border-slate-600",
                          )}
                        >
                          {/* 商品图（上方正方形圆角）+ 套餐角标 */}
                          <div className="relative mb-1.5">
                            <ProductThumb
                              product={p}
                              className="w-full h-16 sm:h-18 rounded-lg"
                              iconClassName="h-7 w-7"
                            />
                            {p.isPackage && (
                              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-slate-900 shadow ring-2 ring-slate-900">
                                <Gift className="h-3 w-3" />
                              </span>
                            )}
                            {p.stock <= 0 && (
                              <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-slate-950/70 text-[10px] font-bold text-rose-300">
                                售罄
                              </span>
                            )}
                          </div>
                          {/* 商品名 + 口味数 */}
                          <div className="flex items-start justify-between gap-1">
                            <div className="font-medium text-xs text-slate-100 truncate flex-1 leading-tight">{p.name}</div>
                            {!p.isPackage && p.flavors.length > 0 && (
                              <Badge variant="outline" className="text-[9px] py-0 h-3.5 border-amber-500/50 text-amber-300 shrink-0">
                                {p.flavors.length}口味
                              </Badge>
                            )}
                          </div>
                          {/* 价格 emerald 加粗 + 库存 */}
                          <div className="flex items-center justify-between mt-0.5">
                            <span className="text-emerald-400 font-bold text-sm tabular-nums">{yuan(price)}</span>
                            <span className={cn("text-[10px]", p.isPackage ? "text-amber-300/70" : "text-slate-500")}>
                              {p.isPackage ? `剩 ${p.stock}` : `库 ${p.stock}`}
                            </span>
                          </div>
                          {p.isPackage && children.length > 0 && (
                            <div className="text-[10px] text-amber-200/60 mt-1 line-clamp-2">
                              含：{children.map((c) => `${c.name ?? ""}×${c.qty}`).join("、")}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>

              {/* 购物车 + 已点明细 */}
              <div className="md:col-span-2 flex flex-col bg-slate-900 rounded-lg p-3 border border-slate-700">
                <div className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-1">
                  <ShoppingBag className="h-4 w-4 text-emerald-400" /> 本次加单
                </div>
                <ScrollArea className="flex-1 max-h-32 mb-2">
                  {cart.length === 0 ? (
                    <div className="text-xs text-slate-500 text-center py-4">点击左侧商品加单（套餐整体下单）</div>
                  ) : (
                    <div className="space-y-1.5">
                      {cart.map((c, i) => {
                        const price = effectivePrice(c.product);
                        return (
                          <div key={i} className="flex items-center gap-2 bg-slate-800 rounded p-1.5 text-xs">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-slate-100 truncate flex items-center gap-1">
                                {c.product.isPackage && <Package className="h-3 w-3 text-amber-400 shrink-0" />}
                                {c.product.name}
                              </div>
                              {c.flavors && (
                                <div className="text-[10px] text-amber-300">{flavorText(c.flavors)}</div>
                              )}
                            </div>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-slate-300 hover:bg-slate-700" onClick={() => updateCartQty(i, -1)}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-slate-100 font-bold w-5 text-center">{c.qty}</span>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-slate-300 hover:bg-slate-700" onClick={() => updateCartQty(i, 1)}>
                              <Plus className="h-3 w-3" />
                            </Button>
                            <span className="text-emerald-400 font-bold w-14 text-right">{yuan(price * c.qty)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className="text-slate-400">小计</span>
                  <span className="text-emerald-400 font-bold">{yuan(cartTotal)}</span>
                </div>
                <Button
                  onClick={handleSubmitItems}
                  disabled={cart.length === 0 || submitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {submitting ? "提交中..." : "提交加单（按部门分流）"}
                </Button>

                {/* 已点明细 — 显示出品状态/部门/退单按钮 */}
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <div className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-1">
                    <Receipt className="h-4 w-4 text-rose-400" /> 已点明细
                  </div>
                  <ScrollArea className="max-h-44">
                    {order?.items && order.items.length > 0 ? (
                      <div className="space-y-1">
                        {order.items.map((it) => {
                          const sm = itemStatusMeta(it.status);
                          const canRefund = it.status === "pending" || it.status === "printed";
                          return (
                            <div
                              key={it.id}
                              className={`flex items-center gap-2 text-xs py-1.5 border-b border-slate-700/50 ${
                                it.isGift ? "bg-emerald-950/20 -mx-1 px-1 rounded" : ""
                              } ${it.status === "cancelled" ? "opacity-50" : ""}`}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="text-slate-100 truncate flex items-center gap-1 flex-wrap">
                                  <span>{it.productName} ×{it.qty}</span>
                                  {it.isGift && (
                                    <Badge variant="outline" className="text-[9px] py-0 h-3.5 border-emerald-500/60 text-emerald-300 bg-emerald-950/40">
                                      <Gift className="h-2.5 w-2.5 mr-0.5" />赠送
                                    </Badge>
                                  )}
                                  {it.status === "cancelled" && (
                                    <Badge variant="outline" className="text-[9px] py-0 h-3.5 border-rose-500/60 text-rose-300 bg-rose-950/40">已退</Badge>
                                  )}
                                </div>
                                {it.flavors && (
                                  <div className="text-[10px] text-amber-300">{flavorText(it.flavors)}</div>
                                )}
                                <div className="text-[10px] text-slate-500 flex items-center gap-1.5 flex-wrap mt-0.5">
                                  <Badge variant="outline" className={`text-[9px] py-0 h-3.5 ${deptColor(it.outputDept)}`}>
                                    {deptLabel(it.outputDept)}
                                  </Badge>
                                  <Badge variant="outline" className={`text-[9px] py-0 h-3.5 ${sm.className}`}>
                                    {sm.label}
                                  </Badge>
                                  <span>{relTime(it.createdAt)}</span>
                                  {it.isGift && it.giftRemark && (
                                    <span className="text-emerald-400/70">· {it.giftRemark}</span>
                                  )}
                                </div>
                              </div>
                              <span className={`text-right w-16 tabular-nums ${it.isGift ? "text-emerald-400 font-bold" : "text-slate-300"}`}>
                                {it.price === 0 ? "—" : yuan(it.price * it.qty)}
                              </span>
                              {canRefund && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-1.5 text-rose-400 hover:bg-rose-950/40 shrink-0"
                                  onClick={() => handleCancelItem(it)}
                                  title="退单"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 text-center py-3">暂无明细</div>
                    )}
                  </ScrollArea>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ========== 账单 Tab — 完整账单 + 支付 ========== */}
          <TabsContent value="bill" className="flex-1 overflow-auto mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 完整账单 */}
              <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-1">
                    <Receipt className="h-4 w-4 text-rose-400" /> 完整账单
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={refreshBill}
                      className="h-7 text-slate-400 hover:text-slate-100"
                      title="刷新账单"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${billLoading ? "animate-spin" : ""}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handlePrintBill}
                      disabled={printing || !order || !bill}
                      className="h-7 gap-1 text-amber-300 hover:text-amber-200 hover:bg-amber-950/40"
                      title="打印账单（打印后房台进入打单中状态，并解锁买单按钮）"
                    >
                      {printing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />}
                      <span className="text-xs">打印账单</span>
                    </Button>
                  </div>
                </div>
                {billLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full bg-slate-700" />
                    <Skeleton className="h-4 w-3/4 bg-slate-700" />
                    <Skeleton className="h-20 w-full bg-slate-700" />
                  </div>
                ) : bill ? (
                  <BillView bill={bill} member={member} />
                ) : (
                  <div className="text-xs text-slate-500 text-center py-4">点击右上角刷新</div>
                )}
              </div>

              {/* 支付 */}
              <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-1">
                  <CreditCard className="h-4 w-4 text-emerald-400" /> 会员与支付
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-slate-300 text-xs">会员查找（可选，享折扣）</Label>
                    <div className="flex gap-2 mt-1">
                      <div className="relative flex-1">
                        <Phone className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input
                          placeholder="输入手机号"
                          value={phoneSearch}
                          onChange={(e) => setPhoneSearch(e.target.value)}
                          className="pl-8 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
                        />
                      </div>
                      <Button onClick={handleSearchMember} disabled={searching} variant="outline" className="bg-slate-700 border-slate-600 text-slate-100 hover:bg-slate-600">
                        {searching ? "..." : "查找"}
                      </Button>
                    </div>
                    {member && (
                      <div className="mt-2 bg-emerald-950/30 border border-emerald-700/40 rounded p-2 text-xs">
                        <div className="flex items-center gap-1 text-emerald-300 font-medium">
                          <User className="h-3 w-3" /> {member.name} · {member.level}
                        </div>
                        <div className="text-slate-400 mt-0.5">
                          卡号 {member.cardNo} · 余额 {yuan(member.balance)} · 折扣 {Math.round(member.discount * 10)} 折
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-slate-300 text-xs">支付方式</Label>
                    <div className="grid grid-cols-5 gap-1.5 mt-1">
                      <PayBtn active={payMethod === "cash"} onClick={() => setPayMethod("cash")} icon={<Banknote className="h-4 w-4" />} label="现金" />
                      <PayBtn active={payMethod === "wechat"} onClick={() => setPayMethod("wechat")} icon={<QrCode className="h-4 w-4" />} label="微信" />
                      <PayBtn active={payMethod === "alipay"} onClick={() => setPayMethod("alipay")} icon={<Smartphone className="h-4 w-4" />} label="支付宝" />
                      <PayBtn active={payMethod === "member"} onClick={() => setPayMethod("member")} icon={<Wallet className="h-4 w-4" />} label="会员卡" disabled={!member} />
                      <PayBtn active={payMethod === "card"} onClick={() => setPayMethod("card")} icon={<CreditCard className="h-4 w-4" />} label="银行卡" />
                    </div>
                  </div>

                  {billPrinted ? (
                    <Button
                      onClick={handleCheckout}
                      disabled={submitting || !bill}
                      className="w-full h-12 text-base bg-rose-600 hover:bg-rose-700 text-white"
                    >
                      {submitting ? "结账中..." : `确认买单 ${bill ? yuan(bill.totalAmount) : "—"}`}
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <div className="rounded-lg border-2 border-dashed border-amber-600/40 bg-amber-950/20 p-3 text-center">
                        <Printer className="h-5 w-5 text-amber-400 mx-auto mb-1" />
                        <div className="text-xs text-amber-300 font-medium">先打印账单后才能买单</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          点击左上方「打印账单」按钮打印预结单，房台将进入「打单中」状态
                        </div>
                      </div>
                      <Button
                        onClick={handlePrintBill}
                        disabled={printing || !order || !bill}
                        className="w-full h-11 bg-amber-600 hover:bg-amber-500 text-white gap-1.5"
                      >
                        {printing ? (
                          <><RefreshCw className="h-4 w-4 animate-spin" /> 打印中...</>
                        ) : (
                          <><Printer className="h-4 w-4" /> 打印账单解锁买单</>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ========== 更多 Tab — 赠送 / 转房 / 退单管理 ========== */}
          <TabsContent value="more" className="flex-1 overflow-auto mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 操作区 */}
              <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-1">
                  <Settings2 className="h-4 w-4 text-emerald-400" /> 经理操作
                </h3>
                <div className="space-y-2">
                  <Button
                    onClick={() => setGiftOpen(true)}
                    disabled={!order}
                    className="w-full justify-start bg-emerald-700 hover:bg-emerald-600 text-white h-11"
                  >
                    <Gift className="h-4 w-4 mr-2" /> 经理赠送
                    <span className="ml-auto text-xs opacity-80">选择商品 + 经理 + 备注</span>
                  </Button>
                  <Button
                    onClick={() => setTransferOpen(true)}
                    disabled={!order}
                    className="w-full justify-start bg-sky-700 hover:bg-sky-600 text-white h-11"
                  >
                    <ArrowRightLeft className="h-4 w-4 mr-2" /> 转房
                    <span className="ml-auto text-xs opacity-80">换到空闲包厢</span>
                  </Button>
                  <div className="text-[11px] text-slate-500 mt-2 leading-relaxed bg-slate-800/50 rounded p-2 border border-slate-700/50">
                    <AlertTriangle className="h-3 w-3 inline mr-1 text-amber-400" />
                    退单请在右侧"已点商品"列表中点击对应商品的垃圾桶按钮（仅 pending / printed 状态可退）。
                  </div>
                </div>
              </div>

              {/* 退单管理 — 全量商品列表 */}
              <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-1">
                  <Trash2 className="h-4 w-4 text-rose-400" /> 退单管理
                </h3>
                <ScrollArea className="max-h-72">
                  {order?.items && order.items.length > 0 ? (
                    <div className="space-y-1">
                      {order.items.map((it) => {
                        const sm = itemStatusMeta(it.status);
                        const canRefund = it.status === "pending" || it.status === "printed";
                        return (
                          <div
                            key={it.id}
                            className={`flex items-center gap-2 text-xs p-2 rounded border ${
                              it.status === "cancelled"
                                ? "border-rose-900/40 bg-rose-950/10 opacity-60"
                                : it.isGift
                                ? "border-emerald-800/50 bg-emerald-950/20"
                                : "border-slate-700 bg-slate-800/50"
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="text-slate-100 truncate flex items-center gap-1">
                                {it.productName} ×{it.qty}
                                {it.isGift && (
                                  <Badge variant="outline" className="text-[9px] py-0 h-3.5 border-emerald-500/60 text-emerald-300">赠送</Badge>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                <Badge variant="outline" className={`text-[9px] py-0 h-3.5 ${deptColor(it.outputDept)}`}>
                                  {deptLabel(it.outputDept)}
                                </Badge>
                                <Badge variant="outline" className={`text-[9px] py-0 h-3.5 ${sm.className}`}>
                                  {sm.label}
                                </Badge>
                              </div>
                            </div>
                            <span className="text-slate-300 w-16 text-right tabular-nums">
                              {it.price === 0 ? "—" : yuan(it.price * it.qty)}
                            </span>
                            {canRefund ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 border-rose-600/50 text-rose-300 hover:bg-rose-950/40 shrink-0"
                                onClick={() => handleCancelItem(it)}
                              >
                                <Trash2 className="h-3 w-3 mr-1" /> 退单
                              </Button>
                            ) : (
                              <span className="text-[10px] text-slate-500 w-12 text-center">不可退</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 text-center py-6">暂无商品明细</div>
                  )}
                </ScrollArea>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>

      {/* 口味选择弹窗 */}
      <FlavorPickerDialog
        product={flavorPickerFor}
        onClose={() => setFlavorPickerFor(null)}
        onConfirm={(flavors) => {
          if (flavorPickerFor) addToCart(flavorPickerFor, pendingFlavorQty, flavors);
          setFlavorPickerFor(null);
        }}
        selectedFlavors={selectedFlavors}
        setSelectedFlavors={setSelectedFlavors}
        qty={pendingFlavorQty}
        setQty={setPendingFlavorQty}
      />

      {/* 经理赠送弹窗 */}
      <GiftDialog
        open={giftOpen}
        orderId={order?.id ?? null}
        products={products}
        onClose={() => setGiftOpen(false)}
        onSuccess={() => {
          setGiftOpen(false);
          handleGiftSuccess();
        }}
      />

      {/* 转房弹窗 */}
      <TransferDialog
        open={transferOpen}
        orderId={order?.id ?? null}
        fromRoomNo={room.roomNo}
        rooms={rooms}
        onClose={() => setTransferOpen(false)}
        onSuccess={() => {
          setTransferOpen(false);
          handleTransferSuccess();
        }}
      />
    </Dialog>
  );
}

// ============ 口味选择弹窗 ============
function FlavorPickerDialog({
  product, onClose, onConfirm, selectedFlavors, setSelectedFlavors, qty, setQty,
}: {
  product: ProductInfo | null;
  onClose: () => void;
  onConfirm: (flavors: string | null) => void;
  selectedFlavors: Record<string, string>;
  setSelectedFlavors: (v: Record<string, string>) => void;
  qty: number;
  setQty: (n: number) => void;
}) {
  if (!product) return null;
  const grouped: Record<string, typeof product.flavors> = {};
  for (const f of product.flavors) {
    (grouped[f.categoryName] ??= []).push(f);
  }

  const handleConfirm = () => {
    const list = Object.entries(selectedFlavors).map(([category, flavor]) => ({ category, flavor }));
    onConfirm(list.length > 0 ? JSON.stringify(list) : null);
  };

  return (
    <Dialog open={!!product} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md bg-slate-800 border-slate-700 text-slate-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChefHat className="h-4 w-4 text-amber-400" />
            {product.name} · 选口味
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {yuan(effectivePrice(product))} · 仅显示该商品绑定的口味
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
          {Object.entries(grouped).map(([catName, opts]) => (
            <div key={catName}>
              <Label className="text-slate-300 text-xs mb-1.5 block">{catName}</Label>
              <div className="flex flex-wrap gap-1.5">
                {opts.map((f) => {
                  const selected = selectedFlavors[catName] === f.name;
                  return (
                    <button
                      key={f.id}
                      onClick={() => {
                        setSelectedFlavors({
                          ...selectedFlavors,
                          [catName]: selected ? "" : f.name,
                        });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                        selected
                          ? "bg-amber-500 border-amber-400 text-slate-900 font-semibold"
                          : "bg-slate-900 border-slate-700 text-slate-200 hover:border-amber-500/50"
                      }`}
                    >
                      {f.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <div>
            <Label className="text-slate-300 text-xs mb-1.5 block">数量</Label>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setQty(Math.max(1, qty - 1))} className="bg-slate-900 border-slate-700 text-slate-100">-</Button>
              <span className="text-lg font-bold w-8 text-center">{qty}</span>
              <Button size="sm" variant="outline" onClick={() => setQty(qty + 1)} className="bg-slate-900 border-slate-700 text-slate-100">+</Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="bg-slate-700 border-slate-600 text-slate-100 hover:bg-slate-600">取消</Button>
          <Button onClick={handleConfirm} className="bg-amber-500 hover:bg-amber-600 text-slate-900">
            加入订单 · {yuan(effectivePrice(product) * qty)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ 经理赠送弹窗 ============
function GiftDialog({
  open, orderId, products, onClose, onSuccess,
}: {
  open: boolean;
  orderId: string | null;
  products: ProductInfo[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [employees, setEmployees] = useState<EmployeeInfo[]>([]);
  const [managers, setManagers] = useState<EmployeeInfo[]>([]);
  const [productId, setProductId] = useState<string>("");
  const [qty, setQty] = useState(1);
  const [managerId, setManagerId] = useState<string>("none");
  const [remark, setRemark] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingEmps, setLoadingEmps] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setLoadingEmps(true);
      setProductId("");
      setQty(1);
      setManagerId("none");
      setRemark("");
      api.getEmployees()
        .then((list) => {
          setEmployees(list as EmployeeInfo[]);
          setManagers((list as EmployeeInfo[]).filter((e) => e.position === "manager" && e.status === 1));
        })
        .catch((e) => toast({ title: "员工加载失败", description: String(e), variant: "destructive" }))
        .finally(() => setLoadingEmps(false));
    }
  }, [open, toast]);

  const selectedProduct = products.find((p) => p.id === productId);
  const selectedManager = managers.find((m) => m.id === managerId);

  // 经理本月赠送额度使用情况
  const giftValue = selectedProduct ? effectivePrice(selectedProduct) * qty : 0;
  const limitUsed = selectedManager?.usedGiftAmount ?? 0;
  const limitTotal = selectedManager?.monthlyGiftLimit ?? 0;
  const limitRemaining = Math.max(0, limitTotal - limitUsed);
  const wouldExceed = selectedManager && limitTotal > 0 && limitUsed + giftValue > limitTotal;

  const availableProducts = useMemo(() => {
    return products.filter((p) => p.status === 1 && p.stock > 0 && !p.isPackage);
  }, [products]);

  const handleConfirm = async () => {
    if (!orderId) return;
    if (!productId) {
      toast({ title: "请选择商品", variant: "destructive" });
      return;
    }
    if (qty < 1) {
      toast({ title: "数量必须≥1", variant: "destructive" });
      return;
    }
    if (wouldExceed) {
      toast({
        title: "超出赠送额度",
        description: `本次 ${yuan(giftValue)} > 剩余 ${yuan(limitRemaining)}`,
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      await api.giftOrder(orderId, {
        productId,
        qty,
        managerId: managerId === "none" ? undefined : managerId,
        remark: remark || undefined,
      });
      toast({
        title: "赠送成功",
        description: `${selectedProduct?.name} ×${qty}${selectedManager ? ` · ${selectedManager.name}` : ""}`,
      });
      onSuccess();
    } catch (e) {
      toast({ title: "赠送失败", description: String(e), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg bg-slate-800 border-slate-700 text-slate-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-emerald-400" /> 经理赠送
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            赠送商品价格置 0，明细中显示"赠送"标签
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-slate-300 text-xs">选择商品</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-100 mt-1">
                <SelectValue placeholder="选择要赠送的商品" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-slate-100 max-h-72">
                {availableProducts.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} · {yuan(effectivePrice(p))}（剩 {p.stock}）
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300 text-xs">数量</Label>
              <Input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                className="bg-slate-900 border-slate-700 text-slate-100 mt-1"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-xs">赠送金额</Label>
              <div className="h-9 flex items-center px-3 mt-1 rounded-md bg-emerald-950/30 border border-emerald-700/40 text-emerald-300 font-bold">
                {selectedProduct ? yuan(effectivePrice(selectedProduct) * qty) : "—"}
              </div>
            </div>
          </div>

          <div>
            <Label className="text-slate-300 text-xs">授权经理</Label>
            <Select value={managerId} onValueChange={setManagerId} disabled={loadingEmps}>
              <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-100 mt-1">
                <SelectValue placeholder={loadingEmps ? "加载中..." : "选择经理（可选）"} />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-slate-100 max-h-60">
                <SelectItem value="none">无经理</SelectItem>
                {managers.map((m) => {
                  const used = m.usedGiftAmount;
                  const total = m.monthlyGiftLimit;
                  const remain = Math.max(0, total - used);
                  return (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                      {total > 0 ? `（剩余 ${yuan(remain)} / ${yuan(total)}）` : "（无额度限制）"}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* 经理本月赠送额度使用情况 */}
          {selectedManager && (
            <div className="bg-slate-900 rounded-lg p-3 border border-slate-700">
              <div className="text-xs text-slate-400 mb-1.5 flex items-center gap-1">
                <User className="h-3 w-3" /> {selectedManager.name} · 本月赠送额度使用情况
              </div>
              {limitTotal > 0 ? (
                <>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-300">已用 {yuan(limitUsed)} / {yuan(limitTotal)}</span>
                    <span className={wouldExceed ? "text-rose-400 font-bold" : "text-emerald-400"}>
                      剩余 {yuan(limitRemaining)}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${wouldExceed ? "bg-rose-500" : "bg-emerald-500"}`}
                      style={{ width: `${Math.min(100, ((limitUsed + (wouldExceed ? 0 : giftValue)) / limitTotal) * 100)}%` }}
                    />
                  </div>
                  {wouldExceed && (
                    <div className="text-[11px] text-rose-400 mt-1.5 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> 本次赠送将超出额度 {yuan(limitUsed + giftValue - limitTotal)}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-xs text-slate-400">无额度限制（已用 {yuan(limitUsed)}）</div>
              )}
            </div>
          )}

          <div>
            <Label className="text-slate-300 text-xs">备注</Label>
            <Textarea
              placeholder="例如：客户生日赠送 / 老客户回馈"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className="bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 min-h-[60px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="bg-slate-700 border-slate-600 text-slate-100 hover:bg-slate-600">取消</Button>
          <Button
            onClick={handleConfirm}
            disabled={submitting || !productId || wouldExceed}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {submitting ? "赠送中..." : "确认赠送"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ 转房弹窗 ============
function TransferDialog({
  open, orderId, fromRoomNo, rooms, onClose, onSuccess,
}: {
  open: boolean;
  orderId: string | null;
  fromRoomNo: string;
  rooms: KtvRoomInfoV2[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [toRoomId, setToRoomId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [transferRule, setTransferRule] = useState<string>("new");
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setToRoomId("");
      setSubmitting(false);
      api.getSysConfigs("system").then((configs) => {
        const cfg = configs.find((c) => c.configKey === "transfer_rule");
        if (cfg?.configValue) {
          try { setTransferRule(JSON.parse(cfg.configValue).mode ?? "new"); } catch {}
        }
      }).catch(() => {});
    }
  }, [open]);

  const ruleText = transferRule === "old"
    ? "按原房价计费（全程按原房费率）"
    : transferRule === "both"
    ? "两房价分别结算（原房费 + 新房费，请人工核算原房费）"
    : "按新房价计费（原房按原价，之后按新房费率）";

  const idleRooms = useMemo(() => rooms.filter((r) => r.status === "idle"), [rooms]);
  const selectedRoom = idleRooms.find((r) => r.id === toRoomId);

  const handleConfirm = async () => {
    if (!orderId || !toRoomId) return;
    setSubmitting(true);
    try {
      const res = await api.transferOrder(orderId, toRoomId);
      toast({
        title: "转房成功",
        description: `${res.fromRoomNo} → ${res.toRoomNo}（原包厢进入清扫）`,
      });
      onSuccess();
    } catch (e) {
      toast({ title: "转房失败", description: String(e), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg bg-slate-800 border-slate-700 text-slate-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-sky-400" /> 转房
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            将订单从 <span className="text-sky-300 font-medium">{fromRoomNo}</span> 转到空闲包厢（原包厢进入清扫）
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-slate-300 text-xs">选择空闲包厢</Label>
            {idleRooms.length === 0 ? (
              <div className="mt-1 text-xs text-amber-300 bg-amber-950/30 border border-amber-700/40 rounded p-3">
                <AlertTriangle className="h-3.5 w-3.5 inline mr-1" />
                暂无空闲包厢可转入
              </div>
            ) : (
              <Select value={toRoomId} onValueChange={setToRoomId}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-100 mt-1">
                  <SelectValue placeholder={`选择目标包厢（${idleRooms.length} 间空闲）`} />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-slate-100 max-h-72">
                  {idleRooms.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.roomNo} {r.roomName} · {r.roomType} · 容{r.capacity}人 · {yuan(r.hourlyRate)}/h
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedRoom && (
            <div className="bg-slate-900 rounded-lg p-3 border border-slate-700 text-xs">
              <div className="text-slate-400 mb-1">转入包厢信息</div>
              <div className="grid grid-cols-2 gap-2 text-slate-200">
                <div>房号: <span className="font-bold text-sky-300">{selectedRoom.roomNo}</span></div>
                <div>类型: {selectedRoom.roomType}</div>
                <div>容量: {selectedRoom.capacity} 人</div>
                <div>计费: {yuan(selectedRoom.hourlyRate)}/小时{selectedRoom.minSpend > 0 ? ` · 低消 ${yuan(selectedRoom.minSpend)}` : ""}</div>
                <div className="col-span-2">区域: {selectedRoom.area ?? "未分区"}</div>
              </div>
              <div className="text-[11px] text-amber-300/80 mt-2 flex items-start gap-1">
                <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                <span>当前转房规则：{ruleText}</span>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="bg-slate-700 border-slate-600 text-slate-100 hover:bg-slate-600">取消</Button>
          <Button
            onClick={handleConfirm}
            disabled={submitting || !toRoomId}
            className="bg-sky-600 hover:bg-sky-700 text-white"
          >
            {submitting ? "转房中..." : "确认转房"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ 买单成功后的账单弹窗（可打印）============
function SuccessBillDialog({
  bill, onClose,
}: {
  bill: OrderBill | null;
  onClose: () => void;
}) {
  const { toast } = useToast();

  const handlePrint = () => {
    if (!bill) return;
    const html = renderBillPrintHtml(bill);
    const w = window.open("", "_blank", "width=480,height=720");
    if (!w) {
      toast({ title: "打印失败", description: "浏览器拦截了弹窗，请允许", variant: "destructive" });
      return;
    }
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => {
      w.print();
      w.close();
    }, 250);
  };

  return (
    <Dialog open={!!bill} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl bg-slate-800 border-slate-700 text-slate-100 max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            买单成功
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            订单 {bill?.orderNo} · 房间 {bill?.roomNo} · 实付 <span className="text-emerald-400 font-bold">{bill ? yuan(bill.totalAmount) : ""}</span>
          </DialogDescription>
        </DialogHeader>

        {bill && (
          <ScrollArea className="flex-1 max-h-[68vh] pr-2">
            <BillView bill={bill} showHeader />
          </ScrollArea>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="bg-slate-700 border-slate-600 text-slate-100 hover:bg-slate-600">
            关闭
          </Button>
          <Button onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Printer className="h-4 w-4 mr-1" /> 打印账单
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ 账单视图（共用：账单 Tab + 成功弹窗）============
function BillView({
  bill, member, showHeader,
}: {
  bill: OrderBill;
  member?: MemberInfo | null;
  showHeader?: boolean;
}) {
  const activeItems = bill.items.filter((i) => i.status !== "cancelled");
  return (
    <div className="space-y-3">
      {showHeader && (
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><span className="text-slate-500">订单号：</span><span className="text-slate-200">{bill.orderNo}</span></div>
            <div><span className="text-slate-500">状态：</span>
              <Badge variant="outline" className="text-[10px] py-0 h-4 border-emerald-500/60 text-emerald-300">
                {bill.status === "paid" ? "已结账" : "进行中"}
              </Badge>
            </div>
            <div><span className="text-slate-500">开台：</span><span className="text-slate-200">{fullTime(bill.openedAt)}</span></div>
            {bill.closedAt && <div><span className="text-slate-500">结账：</span><span className="text-slate-200">{fullTime(bill.closedAt)}</span></div>}
            {bill.bookingManagerName && <div><span className="text-slate-500">订房经理：</span><span className="text-slate-200">{bill.bookingManagerName}</span></div>}
          </div>
        </div>
      )}

      {/* 包厢信息 */}
      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
        <div className="text-xs text-slate-400 mb-1.5">包厢信息</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div><span className="text-slate-500">房号：</span><span className="text-slate-100 font-medium">{bill.roomNo} {bill.roomName}</span></div>
          <div><span className="text-slate-500">类型：</span><span className="text-slate-200">{bill.roomType}</span></div>
          <div><span className="text-slate-500">计费模式：</span>
            <Badge variant="outline" className="text-[10px] py-0 h-4 border-sky-500/50 text-sky-300 bg-sky-950/30">
              {billingModeLabel(bill.billingMode)}
            </Badge>
          </div>
          <div><span className="text-slate-500">客户：</span><span className="text-slate-200">{bill.customerName || "散客"} · {bill.customerCount}人</span></div>
          <div><span className="text-slate-500">开台时间：</span><span className="text-slate-200">{fullTime(bill.openedAt)}</span></div>
          <div><span className="text-slate-500">时长：</span><span className="text-slate-200">{bill.elapsedMinutes} 分钟</span></div>
        </div>
      </div>

      {/* 商品明细列表 */}
      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
        <div className="text-xs text-slate-400 mb-2 flex items-center justify-between">
          <span>商品明细（{activeItems.length} 项）</span>
          <span className="text-slate-500">按出品部门自动分流</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700">
                <th className="text-left font-normal py-1.5">商品 / 口味</th>
                <th className="text-center font-normal py-1.5 w-10">数量</th>
                <th className="text-right font-normal py-1.5 w-16">单价</th>
                <th className="text-right font-normal py-1.5 w-20">金额</th>
              </tr>
            </thead>
            <tbody>
              {activeItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-slate-500 py-4">暂无商品</td>
                </tr>
              ) : (
                activeItems.map((it) => {
                  const isPkgChild = !it.isGift && it.price === 0;
                  const fv = it.flavors ? flavorTextFromObj(it.flavors) : "";
                  return (
                    <tr
                      key={it.id}
                      className={`border-b border-slate-700/40 ${
                        it.isGift ? "bg-emerald-950/20" : isPkgChild ? "opacity-70" : ""
                      }`}
                    >
                      <td className="py-1.5">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className={it.isGift ? "text-emerald-300 font-medium" : "text-slate-100"}>
                            {it.productName}
                          </span>
                          {it.isGift && (
                            <Badge variant="outline" className="text-[9px] py-0 h-3.5 border-emerald-500/60 text-emerald-300 bg-emerald-950/40">
                              赠送
                            </Badge>
                          )}
                          {isPkgChild && (
                            <Badge variant="outline" className="text-[9px] py-0 h-3.5 border-amber-500/50 text-amber-300 bg-amber-950/30">
                              套餐内
                            </Badge>
                          )}
                          <Badge variant="outline" className={`text-[9px] py-0 h-3.5 ${deptColor(it.outputDept)}`}>
                            {deptLabel(it.outputDept)}
                          </Badge>
                          <Badge variant="outline" className={`text-[9px] py-0 h-3.5 ${itemStatusMeta(it.status).className}`}>
                            {itemStatusMeta(it.status).label}
                          </Badge>
                        </div>
                        {fv && <div className="text-[10px] text-amber-300 mt-0.5">{fv}</div>}
                        {it.isGift && it.giftRemark && (
                          <div className="text-[10px] text-emerald-400/70 mt-0.5">{it.giftRemark}</div>
                        )}
                      </td>
                      <td className="text-center text-slate-300 tabular-nums">{it.qty}</td>
                      <td className="text-right text-slate-300 tabular-nums">{it.price === 0 ? "—" : yuan(it.price)}</td>
                      <td className={`text-right tabular-nums ${it.isGift ? "text-emerald-400 font-bold" : "text-slate-200"}`}>
                        {it.price === 0 ? "—" : yuan(it.amount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 费用汇总 */}
      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
        <div className="text-xs text-slate-400 mb-2">费用汇总</div>
        <div className="space-y-1.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs">
              包厢费
              <span className="text-slate-600 ml-1">（{billingModeLabel(bill.billingMode)} · {billingModeDesc(bill)}）</span>
            </span>
            <span className="text-slate-100 font-medium tabular-nums">{yuan(bill.roomFee)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs">商品费</span>
            <span className="text-slate-100 font-medium tabular-nums">{yuan(bill.productFee)}</span>
          </div>
          {bill.discount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs">
                会员折扣
                <span className="text-slate-600 ml-1">
                  （{bill.member?.name ?? member?.name ?? ""}{bill.member ? ` · ${Math.round(bill.member.discount * 10)}折` : ""}）
                </span>
              </span>
              <span className="text-emerald-400 font-medium tabular-nums">-{yuan(bill.discount)}</span>
            </div>
          )}
          <Separator className="bg-slate-700 my-1" />
          <div className="flex items-center justify-between">
            <span className="text-slate-200 font-medium">实付</span>
            <span className="text-2xl font-extrabold text-rose-400 tabular-nums">{yuan(bill.totalAmount)}</span>
          </div>
          {bill.payMethod && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">支付方式</span>
              <span className="text-slate-300">{payMethodLabel(bill.payMethod)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ 账单打印 HTML ============
function renderBillPrintHtml(bill: OrderBill): string {
  const activeItems = bill.items.filter((i) => i.status !== "cancelled");
  const rows = activeItems.map((it) => {
    const isPkgChild = !it.isGift && it.price === 0;
    const tag = it.isGift ? " [赠送]" : isPkgChild ? " [套餐内]" : "";
    return `<tr>
      <td>${it.productName}${tag}</td>
      <td align="center">${it.qty}</td>
      <td align="right">${it.price === 0 ? "—" : it.price.toFixed(2)}</td>
      <td align="right">${it.price === 0 ? "—" : it.amount.toFixed(2)}</td>
    </tr>`;
  }).join("");
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8">
<title>账单 ${bill.orderNo}</title>
<style>
  body { font-family: "PingFang SC", "Microsoft YaHei", monospace; font-size: 12px; padding: 8px; color: #000; }
  h2 { text-align: center; margin: 4px 0; font-size: 16px; }
  .info { margin: 6px 0; line-height: 1.6; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0; }
  th, td { border-bottom: 1px dashed #999; padding: 3px 4px; font-size: 11px; }
  th { font-weight: bold; }
  .total { margin-top: 10px; text-align: right; }
  .total .amount { font-size: 22px; font-weight: bold; }
  .foot { margin-top: 14px; text-align: center; color: #666; font-size: 10px; }
</style></head><body>
  <h2>KTV 账单</h2>
  <div class="info">
    订单号：${bill.orderNo}<br>
    房号：${bill.roomNo} ${bill.roomName}（${bill.roomType}）<br>
    客户：${bill.customerName || "散客"} · ${bill.customerCount} 人<br>
    计费：${billingModeLabel(bill.billingMode)}（${billingModeDesc(bill)}）<br>
    开台：${fullTime(bill.openedAt)}<br>
    时长：${bill.elapsedMinutes} 分钟<br>
    ${bill.closedAt ? `结账：${fullTime(bill.closedAt)}<br>` : ""}
    ${bill.bookingManagerName ? `订房经理：${bill.bookingManagerName}<br>` : ""}
  </div>
  <table>
    <thead><tr><th align="left">商品</th><th>数量</th><th align="right">单价</th><th align="right">金额</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="total">
    包厢费：¥${bill.roomFee.toFixed(2)}<br>
    商品费：¥${bill.productFee.toFixed(2)}<br>
    ${bill.discount > 0 ? `会员折扣：-¥${bill.discount.toFixed(2)}<br>` : ""}
    <div class="amount">实付 ¥${bill.totalAmount.toFixed(2)}</div>
    ${bill.payMethod ? `支付方式：${payMethodLabel(bill.payMethod)}` : ""}
  </div>
  <div class="foot">感谢光临，欢迎下次再来！</div>
</body></html>`;
}

// ============ 子组件 ============
function CategoryChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
        active
          ? "bg-emerald-500 text-white font-medium"
          : "bg-slate-900 border border-slate-700 text-slate-300 hover:border-emerald-500/50"
      }`}
    >
      {children}
    </button>
  );
}

function PayBtn({ active, onClick, icon, label, disabled }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center gap-1 py-2 rounded-lg border transition-colors disabled:opacity-40 ${
        active
          ? "bg-emerald-600 border-emerald-500 text-white"
          : "bg-slate-800 border-slate-700 text-slate-300 hover:border-emerald-500/50"
      }`}
    >
      {icon}
      <span className="text-[10px]">{label}</span>
    </button>
  );
}

// ============ 交接班弹窗 ============
function ShiftDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [shift, setShift] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [empName, setEmpName] = useState("");
  const [startCash, setStartCash] = useState("");
  const [endCash, setEndCash] = useState("");
  const [remark, setRemark] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const load = useCallback(async () => {
    try {
      const [cur, hist] = await Promise.all([api.getCurrentShift(), api.getShifts()]);
      setShift(cur.shift);
      setStats(cur.stats);
      setHistory(hist.slice(0, 5));
      if (cur.shift) setEmpName(cur.shift.employeeName);
    } catch {}
  }, []);

  useEffect(() => { if (open) load(); }, [open, load]);

  const start = async () => {
    setLoading(true);
    try {
      await api.startShift(empName || "收银员", Number(startCash) || 0);
      toast({ title: "班次已开始" });
      load();
    } catch (e) { toast({ title: "失败", description: String(e), variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const close = async () => {
    if (!shift) return;
    setLoading(true);
    try {
      await api.closeShift(shift.id, Number(endCash) || 0, remark);
      toast({ title: "交接班完成", description: `营收: ¥${stats?.totalRevenue ?? 0}` });
      onClose();
      load();
    } catch (e) { toast({ title: "失败", description: String(e), variant: "destructive" }); }
    finally { setLoading(false); }
  };

  if (!open) return null;

  const payLabels: Record<string, string> = { cash: "现金", wechat: "微信", alipay: "支付宝", member: "会员卡", card: "银行卡" };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><LogIn className="h-5 w-5 text-emerald-400" /> 交接班</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {shift ? (
            <>
              <div className="rounded-lg bg-slate-800/60 p-3 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">收银员</span><span>{shift.employeeName}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">开始时间</span><span>{new Date(shift.startAt).toLocaleString("zh-CN")}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">起始现金</span><span>¥{shift.startCash}</span></div>
                {stats && (
                  <>
                    <div className="border-t border-slate-700/50 pt-2 mt-2">
                      <div className="flex justify-between font-medium"><span>总营收</span><span className="text-emerald-400">¥{stats.totalRevenue}</span></div>
                      <div className="flex justify-between text-xs text-slate-400 mt-1"><span>订单数</span><span>{stats.orderCount}</span></div>
                      <div className="flex justify-between text-xs text-slate-400"><span>开台数</span><span>{stats.openCount}</span></div>
                    </div>
                    {stats.revenueByMethod && Object.entries(stats.revenueByMethod).map(([m, amt]) => (
                      <div key={m} className="flex justify-between text-xs"><span className="text-slate-400">{payLabels[m] ?? m}</span><span>¥{amt as number}</span></div>
                    ))}
                  </>
                )}
              </div>
              <div>
                <Label className="text-xs text-slate-400">结束现金</Label>
                <Input type="number" value={endCash} onChange={(e) => setEndCash(e.target.value)} className="bg-slate-800/60 border-slate-700 text-slate-100 mt-1" />
              </div>
              <div>
                <Label className="text-xs text-slate-400">备注</Label>
                <Input value={remark} onChange={(e) => setRemark(e.target.value)} className="bg-slate-800/60 border-slate-700 text-slate-100 mt-1" />
              </div>
              <Button onClick={close} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500">
                {loading ? "处理中..." : "确认交班"}
              </Button>
            </>
          ) : (
            <>
              <div>
                <Label className="text-xs text-slate-400">收银员姓名</Label>
                <Input value={empName} onChange={(e) => setEmpName(e.target.value)} className="bg-slate-800/60 border-slate-700 text-slate-100 mt-1" />
              </div>
              <div>
                <Label className="text-xs text-slate-400">起始现金</Label>
                <Input type="number" value={startCash} onChange={(e) => setStartCash(e.target.value)} className="bg-slate-800/60 border-slate-700 text-slate-100 mt-1" />
              </div>
              <Button onClick={start} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500">
                {loading ? "处理中..." : "开始班次"}
              </Button>
            </>
          )}
          {history.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs text-slate-500 font-medium">最近交接班</div>
              {history.map((h) => (
                <div key={h.id} className="text-xs text-slate-400 flex justify-between rounded-md bg-slate-800/40 px-2 py-1">
                  <span>{h.employeeName} · {new Date(h.startAt).toLocaleDateString("zh-CN")}</span>
                  <span className={h.status === "active" ? "text-emerald-400" : "text-slate-500"}>{h.status === "active" ? "进行中" : `¥${h.totalRevenue ?? 0}`}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
