// 模块：系统维护 — KTV 后台配置中心
// 8 个子页签：营业参数 / 物品管理 / 口味设置 / 赠送规则 / 人事 / 出品点设置 / 包厢设置 / 主题市场

"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Settings2,
  Store,
  UtensilsCrossed,
  Sparkles,
  Gift,
  UserCog,
  Palette,
  Plus,
  RefreshCw,
  Save,
  Pencil,
  Search,
  Check,
  Wine,
  Coffee,
  Candy,
  Cherry,
  ChefHat,
  Salad,
  Sandwich,
  Apple,
  Bike,
  Package,
  Download,
  TrendingUp,
  Clock,
  Tag,
  Shield,
  Users,
  Server,
  Printer,
  Monitor,
  Network,
  Building2,
  Trash2,
  MapPin,
  Percent,
  Phone,
  IdCard,
  CalendarClock,
  X,
  LayoutTemplate,
  FileText,
  QrCode,
  Image as ImageIcon,
  Copy,
  UserPlus,
  CheckCircle,
  XCircle,
  ArrowRightLeft,
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { AiChatWidget } from "@/components/common/AiChatWidget";
import type {
  SysConfigInfo,
  ProductCategoryInfo,
  FlavorCategoryInfo,
  ProductInfo,
  GiftRuleInfo,
  ThemeTemplateInfo,
} from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { fullTime } from "@/components/common/format";

// ============ 常量 ============

const OUTPUT_DEPTS: Array<{ value: string; label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = [
  { value: "bar", label: "吧台", icon: Wine, color: "text-amber-400" },
  { value: "kitchen", label: "厨房", icon: ChefHat, color: "text-rose-400" },
  { value: "fruit", label: "水果房", icon: Apple, color: "text-emerald-400" },
  { value: "outside", label: "外卖", icon: Bike, color: "text-sky-400" },
];

const PRODUCT_STATUS: Record<number, { label: string; className: string }> = {
  1: { label: "在售", className: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  0: { label: "停售", className: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
  2: { label: "估清", className: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
};

// 大类图标 — 按类目名关键字匹配
const CATEGORY_ICON_RULES: Array<{ keys: string[]; icon: React.ComponentType<{ className?: string }>; color: string }> = [
  { keys: ["酒", "洋酒", "啤酒"], icon: Wine, color: "bg-amber-500/15 text-amber-400" },
  { keys: ["饮料", "饮品", "茶", "咖啡"], icon: Coffee, color: "bg-orange-500/15 text-orange-400" },
  { keys: ["零食", "小吃", "干果", "坚果"], icon: Candy, color: "bg-pink-500/15 text-pink-400" },
  { keys: ["水果"], icon: Cherry, color: "bg-emerald-500/15 text-emerald-400" },
  { keys: ["热菜", "炒菜", "热食"], icon: ChefHat, color: "bg-rose-500/15 text-rose-400" },
  { keys: ["凉菜", "冷菜", "冷盘"], icon: Salad, color: "bg-teal-500/15 text-teal-400" },
  { keys: ["主食", "面", "饭", "饼"], icon: Sandwich, color: "bg-yellow-500/15 text-yellow-400" },
  { keys: ["套餐", "组合", "礼包"], icon: Gift, color: "bg-violet-500/15 text-violet-400" },
];

function pickCategoryIcon(name: string): { icon: React.ComponentType<{ className?: string }>; color: string } {
  const hit = CATEGORY_ICON_RULES.find((r) => r.keys.some((k) => name.includes(k)));
  return hit ?? { icon: Package, color: "bg-slate-500/15 text-slate-300" };
}

// 物品行缩略图（32x32 圆角，无图隐藏）
function ProductRowThumb({ imageUrl, alt }: { imageUrl: string | null; alt: string }) {
  const [err, setErr] = useState(false);
  if (!imageUrl || err) return null;
  return (
    <img
      src={imageUrl}
      alt={alt}
      loading="lazy"
      onError={() => setErr(true)}
      className="h-8 w-8 rounded-md object-cover ring-1 ring-white/10 shrink-0"
    />
  );
}

const THEME_TYPE_LABEL: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  room_theme: { label: "房态主题", icon: Palette, color: "from-violet-500/20 to-fuchsia-500/20" },
  product_pack: { label: "商品包", icon: Package, color: "from-emerald-500/20 to-teal-500/20" },
  bill_template: { label: "账单模板", icon: Receipt, color: "from-sky-500/20 to-cyan-500/20" },
  print_template: { label: "出品单模板", icon: Tag, color: "from-amber-500/20 to-orange-500/20" },
  member_activity: { label: "会员活动", icon: Sparkles, color: "from-rose-500/20 to-pink-500/20" },
};

const DISPLAY_FIELDS: Array<{ key: string; label: string }> = [
  { key: "roomNo", label: "房号" },
  { key: "roomName", label: "包厢名称" },
  { key: "roomType", label: "包厢类型" },
  { key: "area", label: "区域" },
  { key: "bookingManager", label: "订房经理" },
  { key: "customerName", label: "订房人" },
  { key: "customerCount", label: "人数" },
  { key: "consume", label: "消费" },
  { key: "openedAt", label: "入客时间" },
  { key: "duration", label: "时长" },
];

// 岗位
const POSITION_OPTIONS: Array<{ value: string; label: string; color: string }> = [
  { value: "manager", label: "经理", color: "text-rose-300 bg-rose-500/15" },
  { value: "cashier", label: "收银", color: "text-amber-300 bg-amber-500/15" },
  { value: "waiter", label: "服务员", color: "text-sky-300 bg-sky-500/15" },
  { value: "bartender", label: "吧台", color: "text-fuchsia-300 bg-fuchsia-500/15" },
  { value: "chef", label: "厨房", color: "text-orange-300 bg-orange-500/15" },
  { value: "marketing", label: "营销", color: "text-emerald-300 bg-emerald-500/15" },
];

// 权限角色
const ROLE_OPTIONS: Array<{ value: string; label: string; desc: string }> = [
  { value: "admin", label: "管理员", desc: "全部权限" },
  { value: "manager", label: "经理", desc: "管理 + 报表" },
  { value: "cashier", label: "收银员", desc: "收银 + 开台" },
  { value: "production", label: "出品员", desc: "出品看板" },
];

// 细粒度权限点
const PERM_POINTS: Array<{ key: string; label: string; desc: string }> = [
  { key: "login", label: "允许登录", desc: "可登录系统" },
  { key: "book", label: "订房/开台", desc: "开房、转房、预订" },
  { key: "checkout", label: "买单结账", desc: "结账收银" },
  { key: "gift", label: "赠送商品", desc: "赠送物品" },
  { key: "discount", label: "打折", desc: "订单折扣" },
  { key: "changePrice", label: "改价", desc: "修改商品价格" },
  { key: "void", label: "退单", desc: "撤销订单明细" },
  { key: "shift", label: "交接班", desc: "开关交接班" },
];

// 按 role 推断默认权限
function defaultPermsByRole(role: string): Record<string, boolean> {
  switch (role) {
    case "admin":
      return { login: true, book: true, checkout: true, gift: true, discount: true, changePrice: true, void: true, shift: true };
    case "cashier":
      return { login: true, book: true, checkout: true, gift: true, discount: true, changePrice: false, void: false, shift: true };
    case "production":
      return { login: true, book: false, checkout: false, gift: false, discount: false, changePrice: false, void: false, shift: false };
    case "manager":
      return { login: true, book: false, checkout: false, gift: false, discount: false, changePrice: false, void: false, shift: false };
    default:
      return { login: true, book: false, checkout: false, gift: false, discount: false, changePrice: false, void: false, shift: false };
  }
}

function parsePerms(raw: string | null | undefined, role: string): Record<string, boolean> {
  if (!raw) return defaultPermsByRole(role);
  try {
    const p = JSON.parse(raw);
    return { ...defaultPermsByRole(role), ...p };
  } catch {
    return defaultPermsByRole(role);
  }
}

// 打印方式
const PRINT_MODE_OPTIONS: Array<{ value: string; label: string; desc: string }> = [
  { value: "client", label: "客户端打印", desc: "本机安装打印机驱动即可" },
  { value: "network", label: "网络打印机", desc: "需要配置中转服务器地址" },
];

// 计费模式
const BILLING_MODE_OPTIONS: Array<{ value: string; label: string; color: string }> = [
  { value: "hourly", label: "计时", color: "bg-sky-500/20 text-sky-300" },
  { value: "minspend", label: "低消", color: "bg-amber-500/20 text-amber-300" },
  { value: "package", label: "开房套餐", color: "bg-emerald-500/20 text-emerald-300" },
  { value: "free", label: "免费", color: "bg-slate-700/50 text-slate-300" },
];

// 简易 Receipt icon（lucide 没有，用占位）
function Receipt({ className }: { className?: string }) {
  return <Tag className={className} />;
}

const positionLabel = (v: string) => POSITION_OPTIONS.find((p) => p.value === v)?.label ?? v;
const positionColor = (v: string) => POSITION_OPTIONS.find((p) => p.value === v)?.color ?? "bg-slate-700/50 text-slate-300";
const roleLabel = (v: string) => ROLE_OPTIONS.find((r) => r.value === v)?.label ?? v;
const billingLabel = (v: string) => BILLING_MODE_OPTIONS.find((b) => b.value === v)?.label ?? v;
const billingColor = (v: string) => BILLING_MODE_OPTIONS.find((b) => b.value === v)?.color ?? "bg-slate-700/50 text-slate-300";

// ============ 主模块 ============

export function SystemModule() {
  const [tab, setTab] = useState("business");

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl overflow-hidden">
      {/* 顶部模块标题 */}
      <div className="relative px-5 md:px-8 py-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 to-slate-900/50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_50%)]" />
        <div className="relative flex items-start gap-4">
          <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/30 p-2.5 hidden sm:block">
            <Settings2 className="h-7 w-7 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold text-slate-50 tracking-tight">
                系统维护中心
              </h1>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20">
                <Shield className="h-3 w-3 mr-1" />
                后台配置
              </Badge>
            </div>
            <p className="mt-1.5 text-sm text-slate-400 leading-relaxed">
              统一管理营业参数、物品与单位、口味、赠送规则、人事权限、出品点、包厢与主题模板。所有配置变更将实时影响前台各业务模块。
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-3 md:px-5 pt-4 bg-slate-900/60">
        <Tabs value={tab} onValueChange={setTab}>
          <ScrollArea className="w-full whitespace-nowrap">
            <TabsList className="bg-slate-800/80 border border-slate-700/60 h-auto p-1 gap-0.5 inline-flex">
              <TabsTrigger value="business" className="data-[state=active]:bg-slate-700 data-[state=active]:text-emerald-300 text-slate-300 gap-1.5 px-3 py-1.5">
                <Store className="h-4 w-4" /> 营业参数
              </TabsTrigger>
              <TabsTrigger value="products" className="data-[state=active]:bg-slate-700 data-[state=active]:text-emerald-300 text-slate-300 gap-1.5 px-3 py-1.5">
                <UtensilsCrossed className="h-4 w-4" /> 物品管理
              </TabsTrigger>
              <TabsTrigger value="flavors" className="data-[state=active]:bg-slate-700 data-[state=active]:text-emerald-300 text-slate-300 gap-1.5 px-3 py-1.5">
                <Sparkles className="h-4 w-4" /> 口味设置
              </TabsTrigger>
              <TabsTrigger value="gifts" className="data-[state=active]:bg-slate-700 data-[state=active]:text-emerald-300 text-slate-300 gap-1.5 px-3 py-1.5">
                <Gift className="h-4 w-4" /> 赠送规则
              </TabsTrigger>
              <TabsTrigger value="employees" className="data-[state=active]:bg-slate-700 data-[state=active]:text-emerald-300 text-slate-300 gap-1.5 px-3 py-1.5">
                <UserCog className="h-4 w-4" /> 人事
              </TabsTrigger>
              <TabsTrigger value="output-points" className="data-[state=active]:bg-slate-700 data-[state=active]:text-emerald-300 text-slate-300 gap-1.5 px-3 py-1.5">
                <Server className="h-4 w-4" /> 出品点设置
              </TabsTrigger>
              <TabsTrigger value="rooms" className="data-[state=active]:bg-slate-700 data-[state=active]:text-emerald-300 text-slate-300 gap-1.5 px-3 py-1.5">
                <Building2 className="h-4 w-4" /> 包厢设置
              </TabsTrigger>
              <TabsTrigger value="themes" className="data-[state=active]:bg-slate-700 data-[state=active]:text-emerald-300 text-slate-300 gap-1.5 px-3 py-1.5">
                <Palette className="h-4 w-4" /> 主题市场
              </TabsTrigger>
              <TabsTrigger value="print-templates" className="data-[state=active]:bg-slate-700 data-[state=active]:text-emerald-300 text-slate-300 gap-1.5 px-3 py-1.5">
                <LayoutTemplate className="h-4 w-4" /> 打印模板
              </TabsTrigger>
            </TabsList>
          </ScrollArea>

          <TabsContent value="business" className="pt-4">
            <BusinessParamsTab />
          </TabsContent>
          <TabsContent value="products" className="pt-4">
            <ProductsTab />
          </TabsContent>
          <TabsContent value="flavors" className="pt-4">
            <FlavorsTab />
          </TabsContent>
          <TabsContent value="gifts" className="pt-4">
            <GiftRulesTab />
          </TabsContent>
          <TabsContent value="employees" className="pt-4">
            <EmployeesTab />
          </TabsContent>
          <TabsContent value="output-points" className="pt-4">
            <OutputPointsTab />
          </TabsContent>
          <TabsContent value="rooms" className="pt-4">
            <RoomsSettingsTab />
          </TabsContent>
          <TabsContent value="themes" className="pt-4">
            <ThemesTab />
          </TabsContent>
          <TabsContent value="print-templates" className="pt-4">
            <PrintTemplatesTab />
          </TabsContent>
        </Tabs>
      </div>

      <AiChatWidget title="系统助手" buttonColor="bg-violet-600 hover:bg-violet-500" />
    </div>
  );
}

// ============ 通用小组件 ============

function DarkCard({ className, ...props }: React.ComponentProps<typeof Card>) {
  return (
    <Card
      className={cn(
        "bg-slate-800/60 border-slate-700/60 text-slate-100 backdrop-blur",
        className,
      )}
      {...props}
    />
  );
}

function SectionTitle({ icon: Icon, title, desc, action }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex items-start gap-2.5 min-w-0">
        <div className="rounded-lg bg-slate-700/50 p-1.5 shrink-0">
          <Icon className="h-4 w-4 text-emerald-400" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
          {desc && <p className="text-xs text-slate-400 mt-0.5">{desc}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-center py-10 text-slate-500 text-sm">
      {children}
    </div>
  );
}

function LoadingGrid({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full bg-slate-700/50" />
      ))}
    </div>
  );
}

// ============ Tab1: 营业参数 ============

function BusinessParamsTab() {
  const [configs, setConfigs] = useState<SysConfigInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SysConfigInfo | null>(null);
  const [storeName, setStoreName] = useState("");
  const [roundMode, setRoundMode] = useState("yuan");
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setConfigs(await api.getSysConfigs("system"));
    } catch (e) {
      toast({ title: "加载失败", description: String(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const cfgMap = useMemo(() => {
    const m = new Map<string, SysConfigInfo>();
    configs.forEach((c) => m.set(c.configKey, c));
    return m;
  }, [configs]);

  const currency = cfgMap.get("currency_symbol")?.configValue ?? "¥";

  // 门店名称 / 抹零方式 — 同步本地输入框
  useEffect(() => {
    setStoreName(cfgMap.get("store_name")?.configValue ?? "");
    setRoundMode(cfgMap.get("round_mode")?.configValue ?? "yuan");
  }, [cfgMap]);

  const businessHours = useMemo(() => {
    const raw = cfgMap.get("business_hours")?.configValue;
    if (!raw) return { open: "18:00", close: "02:00" };
    try {
      return JSON.parse(raw) as { open: string; close: string };
    } catch {
      return { open: "18:00", close: "02:00" };
    }
  }, [cfgMap]);

  const setCurrency = async (sym: string) => {
    if (sym === currency) return;
    try {
      await api.updateSysConfig("currency_symbol", sym);
      toast({ title: "货币符号已切换", description: `所有金额展示将使用 ${sym}` });
      load();
    } catch (e) {
      toast({ title: "切换失败", description: String(e), variant: "destructive" });
    }
  };

  const saveBusinessHours = async (open: string, close: string) => {
    try {
      await api.updateSysConfig("business_hours", JSON.stringify({ open, close }));
      toast({ title: "营业时间已更新", description: `${open} - ${close}` });
      load();
    } catch (e) {
      toast({ title: "更新失败", description: String(e), variant: "destructive" });
    }
  };

  const otherParams = configs.filter(
    (c) => !["currency_symbol", "business_hours", "auto_deliver", "store_name", "round_mode"].includes(c.configKey),
  );

  const autoDeliverCfg = cfgMap.get("auto_deliver");
  const autoDeliverOn = autoDeliverCfg?.configValue === "true";

  const toggleAutoDeliver = async (on: boolean) => {
    try {
      await api.updateSysConfig("auto_deliver", on ? "true" : "false");
      toast({
        title: on ? "已开启出品自动送达" : "已关闭出品自动送达",
        description: on
          ? "收银点单的商品将自动标记为已送达"
          : "商品将按正常出品流程出单",
      });
      load();
    } catch (e) {
      toast({ title: "切换失败", description: String(e), variant: "destructive" });
    }
  };

  // 门店名称 — 失焦保存到 SysConfig("store_name")
  const saveStoreName = async () => {
    const trimmed = storeName.trim();
    const current = cfgMap.get("store_name")?.configValue ?? "";
    if (trimmed === current) return;
    try {
      await api.updateSysConfig("store_name", trimmed);
      toast({
        title: "门店名称已保存",
        description: trimmed ? `本门店将显示为「${trimmed}」` : "已清空门店名称",
      });
      load();
    } catch (e) {
      toast({ title: "保存失败", description: String(e), variant: "destructive" });
    }
  };

  // 抹零方式 — yuan / jiao / none
  const changeRoundMode = async (mode: string) => {
    if (mode === roundMode) return;
    setRoundMode(mode);
    try {
      await api.updateSysConfig("round_mode", mode);
      const label = mode === "yuan" ? "抹元（精确到元）" : mode === "jiao" ? "抹角（精确到 0.1 元）" : "不抹零";
      toast({ title: "抹零方式已切换", description: label });
      load();
    } catch (e) {
      toast({ title: "切换失败", description: String(e), variant: "destructive" });
    }
  };

  // 转房规则：new(按新房价) / old(按原房价) / both(两房价分别)
  const transferRule = useMemo(() => {
    const raw = cfgMap.get("transfer_rule")?.configValue;
    if (!raw) return { mode: "new" as string, newRoomRate: 0, oldRoomRate: 0 };
    try {
      const p = JSON.parse(raw);
      return { mode: p.mode ?? "new", newRoomRate: Number(p.newRoomRate ?? 0), oldRoomRate: Number(p.oldRoomRate ?? 0) };
    } catch {
      return { mode: "new" as string, newRoomRate: 0, oldRoomRate: 0 };
    }
  }, [cfgMap]);

  const saveTransferRule = async (mode: string) => {
    try {
      await api.updateSysConfig("transfer_rule", JSON.stringify({ mode, newRoomRate: transferRule.newRoomRate, oldRoomRate: transferRule.oldRoomRate }));
      const label = mode === "new" ? "按新房价计费（原房按原价，之后按新房）" : mode === "old" ? "按原房价计费（全程按原房费率）" : "两房价分别结算（原房费 + 新房费）";
      toast({ title: "转房规则已保存", description: label });
      load();
    } catch (e) {
      toast({ title: "保存失败", description: String(e), variant: "destructive" });
    }
  };

  // 预定房自动取消时间（分钟，0=不自动取消）
  const reservationAutoCancel = Number(cfgMap.get("reservation_auto_cancel")?.configValue ?? "0");
  const [resvCancelInput, setResvCancelInput] = useState(String(reservationAutoCancel));
  useEffect(() => { setResvCancelInput(String(reservationAutoCancel)); }, [reservationAutoCancel]);
  const saveResvCancel = async () => {
    const mins = Number(resvCancelInput) || 0;
    try {
      await api.updateSysConfig("reservation_auto_cancel", String(mins));
      toast({ title: "预定自动取消已保存", description: mins > 0 ? `超时 ${mins} 分钟未到店自动取消` : "不自动取消" });
      load();
    } catch (e) {
      toast({ title: "保存失败", description: String(e), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4 pb-6">
      {/* 门店名称 + 抹零方式 — 顶部基础参数 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <DarkCard className="border-emerald-700/40">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-emerald-500/15 p-1.5">
                <Store className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-base text-slate-100">门店名称</CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  登录后显示的门店名（同步 SysConfig: store_name）
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Input
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              onBlur={saveStoreName}
              onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
              placeholder="如：星耀 KTV 总店"
              className="bg-slate-900/60 border-slate-700 text-slate-100 placeholder:text-slate-500"
            />
            <p className="text-[10px] text-slate-500 mt-1.5">
              失焦或回车后自动保存
            </p>
          </CardContent>
        </DarkCard>

        <DarkCard>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-amber-500/15 p-1.5">
                <Percent className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-base text-slate-100">抹零方式</CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  买单时金额舍入到元 / 角 / 不抹零
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: "yuan", label: "抹元", desc: "到 1 元" },
                { value: "jiao", label: "抹角", desc: "到 0.1 元" },
                { value: "none", label: "不抹", desc: "精确到分" },
              ] as const).map((opt) => {
                const active = roundMode === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => changeRoundMode(opt.value)}
                    className={cn(
                      "rounded-lg border-2 p-3 text-center transition-all",
                      active
                        ? "border-amber-500 bg-amber-500/15 shadow-lg shadow-amber-500/20"
                        : "border-slate-700 bg-slate-800/50 hover:border-slate-600",
                    )}
                  >
                    <div className={cn("text-base font-bold", active ? "text-amber-300" : "text-slate-200")}>
                      {opt.label}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </DarkCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DarkCard>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-amber-500/15 p-1.5">
                <span className="text-amber-400 font-bold text-sm">¥</span>
              </div>
              <div>
                <CardTitle className="text-base text-slate-100">货币符号</CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  切换全系统金额展示符号
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setCurrency("¥")}
                className={cn(
                  "rounded-xl border-2 p-5 text-center transition-all hover:scale-[1.02]",
                  currency === "¥"
                    ? "border-emerald-500 bg-emerald-500/15 shadow-lg shadow-emerald-500/20"
                    : "border-slate-700 bg-slate-800/50 hover:border-slate-600",
                )}
              >
                <div className={cn("text-4xl font-bold", currency === "¥" ? "text-emerald-300" : "text-slate-400")}>¥</div>
                <div className="mt-1 text-xs text-slate-400">人民币</div>
                {currency === "¥" && (
                  <Badge className="mt-2 bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                    <Check className="h-3 w-3 mr-1" /> 已启用
                  </Badge>
                )}
              </button>
              <button
                onClick={() => setCurrency("$")}
                className={cn(
                  "rounded-xl border-2 p-5 text-center transition-all hover:scale-[1.02]",
                  currency === "$"
                    ? "border-emerald-500 bg-emerald-500/15 shadow-lg shadow-emerald-500/20"
                    : "border-slate-700 bg-slate-800/50 hover:border-slate-600",
                )}
              >
                <div className={cn("text-4xl font-bold", currency === "$" ? "text-emerald-300" : "text-slate-400")}>$</div>
                <div className="mt-1 text-xs text-slate-400">美元</div>
                {currency === "$" && (
                  <Badge className="mt-2 bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                    <Check className="h-3 w-3 mr-1" /> 已启用
                  </Badge>
                )}
              </button>
            </div>
          </CardContent>
        </DarkCard>

        <DarkCard>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-sky-500/15 p-1.5">
                <Clock className="h-4 w-4 text-sky-400" />
              </div>
              <div>
                <CardTitle className="text-base text-slate-100">营业时间</CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  跨日营业场景支持（如 18:00 - 次日 02:00）
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <BusinessHoursEditor
              open={businessHours.open}
              close={businessHours.close}
              onSave={saveBusinessHours}
            />
          </CardContent>
        </DarkCard>
      </div>

      {/* 出品自动送达开关 */}
      <DarkCard className="border-emerald-700/40">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className={cn(
                "rounded-lg p-2.5 shrink-0 transition-colors",
                autoDeliverOn ? "bg-emerald-500/20" : "bg-slate-700/50",
              )}>
                <Package className={cn("h-5 w-5", autoDeliverOn ? "text-emerald-300" : "text-slate-400")} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-slate-100">出品自动送达</h3>
                  <Badge
                    className={
                      autoDeliverOn
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        : "bg-slate-700/50 text-slate-400 border-slate-600/50"
                    }
                  >
                    {autoDeliverOn ? "已开启" : "已关闭"}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  开启后，收银点单的商品会自动标记为已送达，跳过出品系统的出单环节。适合不需要出品流程的小场所。
                </p>
              </div>
            </div>
            <Switch
              checked={autoDeliverOn}
              onCheckedChange={toggleAutoDeliver}
              className="data-[state=checked]:bg-emerald-600 shrink-0"
            />
          </div>
        </CardContent>
      </DarkCard>

      {/* 转房规则 */}
      <DarkCard>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-sky-500/15 p-1.5">
              <ArrowRightLeft className="h-4 w-4 text-sky-400" />
            </div>
            <div>
              <CardTitle className="text-base text-slate-100">转房规则</CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                客人转房时包厢费的计算方式
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {([
              { value: "new", label: "按新房价", desc: "原房已开时间按原价，之后按新房费率" },
              { value: "old", label: "按原房价", desc: "全程按原房费率计费" },
              { value: "both", label: "两房价分别", desc: "原房费 + 新房费 分别结算" },
            ] as const).map((opt) => {
              const active = transferRule.mode === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => saveTransferRule(opt.value)}
                  className={cn(
                    "rounded-lg border-2 p-3 text-left transition-all",
                    active ? "border-sky-500 bg-sky-500/15" : "border-slate-700 bg-slate-800/50 hover:border-slate-600",
                  )}
                >
                  <div className={cn("text-sm font-bold", active ? "text-sky-300" : "text-slate-200")}>{opt.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </DarkCard>

      {/* 预定房自动取消 */}
      <DarkCard>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-amber-500/15 p-1.5">
              <CalendarClock className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <CardTitle className="text-base text-slate-100">预定房自动取消</CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                预定时间过后多少分钟客人未到店，自动取消该预定
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={0}
              value={resvCancelInput}
              onChange={(e) => setResvCancelInput(e.target.value)}
              onBlur={saveResvCancel}
              onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
              className="bg-slate-900/60 border-slate-700 text-slate-100 w-32"
            />
            <span className="text-sm text-slate-400">分钟</span>
            <span className="text-xs text-slate-500">（0 = 不自动取消）</span>
          </div>
        </CardContent>
      </DarkCard>

      <DarkCard>
        <CardHeader className="pb-3">
          <SectionTitle
            icon={Settings2}
            title="其他营业参数"
            desc="服务费率、税率、出品模式、抹零方式、自动赠送等"
            action={
              <Button size="sm" variant="ghost" onClick={load} className="text-slate-300 hover:text-slate-100 hover:bg-slate-700/50 gap-1">
                <RefreshCw className="h-3.5 w-3.5" /> 刷新
              </Button>
            }
          />
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingGrid count={4} className="grid-cols-1 md:grid-cols-2" />
          ) : (
            <div className="grid gap-2.5 md:grid-cols-2">
              {otherParams.map((c) => (
                <BusinessParamCard key={c.id} config={c} onEdit={() => setEditing(c)} />
              ))}
              {otherParams.length === 0 && (
                <EmptyHint>暂无其他参数</EmptyHint>
              )}
            </div>
          )}
        </CardContent>
      </DarkCard>

      <EditConfigDialog
        config={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          load();
        }}
      />
    </div>
  );
}

function BusinessHoursEditor({ open, close, onSave }: {
  open: string;
  close: string;
  onSave: (open: string, close: string) => void;
}) {
  const [o, setO] = useState(open);
  const [c, setC] = useState(close);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setO(open);
    setC(close);
  }, [open, close]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-slate-400">开门时间</Label>
          <Input
            type="time"
            value={o}
            onChange={(e) => setO(e.target.value)}
            className="bg-slate-900/60 border-slate-700 text-slate-100 mt-1"
          />
        </div>
        <div>
          <Label className="text-xs text-slate-400">打烊时间</Label>
          <Input
            type="time"
            value={c}
            onChange={(e) => setC(e.target.value)}
            className="bg-slate-900/60 border-slate-700 text-slate-100 mt-1"
          />
        </div>
      </div>
      <Button
        size="sm"
        onClick={() => onSave(o, c)}
        disabled={o === open && c === close}
        className="w-full gap-1 bg-emerald-600 hover:bg-emerald-500"
      >
        <Save className="h-3.5 w-3.5" /> 保存营业时间
      </Button>
    </div>
  );
}

function BusinessParamCard({ config, onEdit }: {
  config: SysConfigInfo;
  onEdit: () => void;
}) {
  const labelMap: Record<string, string> = {
    store_name: "门店名称",
    tax_rate: "税率",
    service_charge: "服务费率",
    round_mode: "抹零方式",
    output_mode: "出品模式",
    output_print_count: "出品单打印次数",
    order_gift_enabled: "自动赠送",
    order_flavor_required: "必选口味强制弹出",
  };
  const label = labelMap[config.configKey] ?? config.configKey;

  const isBool = config.configValue === "true" || config.configValue === "false";
  const isAuto = config.configValue === "auto" || config.configValue === "manual";

  return (
    <div className="rounded-lg border border-slate-700/60 bg-slate-800/40 p-3 hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-100">{label}</div>
          <div className="text-xs text-slate-500 mt-0.5 truncate">{config.description ?? config.configKey}</div>
        </div>
        <Button size="sm" variant="ghost" onClick={onEdit} className="text-slate-400 hover:text-emerald-300 hover:bg-slate-700/50 h-7 w-7 p-0">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        {isBool ? (
          <Badge className={config.configValue === "true" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-slate-700/50 text-slate-400 border-slate-600/50"}>
            {config.configValue === "true" ? "已启用" : "已停用"}
          </Badge>
        ) : isAuto ? (
          <Badge className="bg-sky-500/20 text-sky-300 border-sky-500/30">
            {config.configValue === "auto" ? "自动出品" : "手动出品"}
          </Badge>
        ) : (
          <span className="font-mono text-sm text-emerald-300 truncate">{config.configValue}</span>
        )}
      </div>
    </div>
  );
}

function EditConfigDialog({ config, onClose, onSaved }: {
  config: SysConfigInfo | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setValue(config?.configValue ?? "");
  }, [config]);

  const save = async () => {
    if (!config) return;
    setSaving(true);
    try {
      await api.updateSysConfig(config.configKey, value);
      toast({ title: "参数已更新", description: `${config.configKey} = ${value}` });
      onSaved();
    } catch (e) {
      toast({ title: "保存失败", description: String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const isBool = config?.configValue === "true" || config?.configValue === "false";

  return (
    <Dialog open={!!config} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-slate-100">编辑参数 · {config?.configKey}</DialogTitle>
          <DialogDescription className="text-slate-400">
            {config?.description}
          </DialogDescription>
        </DialogHeader>
        <div className="py-2 space-y-3">
          {isBool ? (
            <div className="flex items-center gap-3">
              <Switch
                checked={value === "true"}
                onCheckedChange={(c) => setValue(c ? "true" : "false")}
              />
              <Label className="text-slate-300">{value === "true" ? "启用" : "停用"}</Label>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-400">参数值</Label>
              <Textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                rows={4}
                className="bg-slate-800/60 border-slate-700 text-slate-100 font-mono"
              />
            </div>
          )}
          <div className="text-xs text-slate-500">
            更新于 {fullTime(config?.updatedAt ?? null)}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-slate-300 hover:bg-slate-800">
            取消
          </Button>
          <Button onClick={save} disabled={saving} className="bg-emerald-600 hover:bg-emerald-500 gap-1">
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ Tab2: 物品管理（原菜品管理）============

function ProductsTab() {
  const [categories, setCategories] = useState<ProductCategoryInfo[]>([]);
  const [products, setProducts] = useState<ProductInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState<string>("");
  const [keyword, setKeyword] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [editingProduct, setEditingProduct] = useState<ProductInfo | null>(null);
  const [addingCategory, setAddingCategory] = useState(false);
  const [addingProductTo, setAddingProductTo] = useState<ProductCategoryInfo | null>(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, pros] = await Promise.all([api.getCategories(), api.getProducts()]);
      setCategories(cats);
      setProducts(pros);
      if (cats.length > 0 && !selectedCat) setSelectedCat(cats[0].id);
    } catch (e) {
      toast({ title: "加载失败", description: String(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast, selectedCat]);

  useEffect(() => {
    load();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCat && p.categoryId !== selectedCat) return false;
      if (deptFilter !== "all" && p.outputDept !== deptFilter) return false;
      if (keyword && !p.name.toLowerCase().includes(keyword.toLowerCase())) return false;
      return true;
    }).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [products, selectedCat, deptFilter, keyword]);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === selectedCat) ?? null,
    [categories, selectedCat],
  );

  const handleToggleStatus = async (p: ProductInfo) => {
    const next = p.status === 1 ? 0 : 1;
    try {
      await api.updateProduct({ id: p.id, status: next });
      toast({ title: next === 1 ? "已上架" : "已下架", description: p.name });
      load();
    } catch (e) {
      toast({ title: "操作失败", description: String(e), variant: "destructive" });
    }
  };

  const handleQuickUpdate = async (p: ProductInfo, field: "price" | "stock", value: number) => {
    try {
      await api.updateProduct({ id: p.id, [field]: value });
      toast({ title: "已更新", description: `${p.name} ${field === "price" ? "价格" : "库存"} = ${value}` });
      load();
    } catch (e) {
      toast({ title: "更新失败", description: String(e), variant: "destructive" });
    }
  };

  // 沽清设置：status 2=估清(沽清) / 1=恢复在售
  
  const handleBatchStatus = async (status: number) => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(selectedIds.map(id => api.updateProduct({ id, status })));
      toast({ title: "批量操作成功", description: `已更新 ${selectedIds.length} 个物品的状态` });
      setSelectedIds([]);
      load();
    } catch (e) {
      toast({ title: "批量操作失败", description: String(e), variant: "destructive" });
    }
  };

  const handleExport = () => {
    const data = filteredProducts.map(p => ({
      "名称": p.name,
      "单位": p.unit,
      "包房价": p.roomPrice,
      "大厅价": p.hallPrice,
      "会员价": p.memberPrice,
      "成本价": p.costPrice,
      "库存": p.stock,
      "排序": p.sortOrder,
      "部门": p.outputDept
    }));
    const csvContent = "data:text/csv;charset=utf-8," + 
      "﻿" + // UTF-8 BOM
      "名称,单位,包房价,大厅价,会员价,成本价,库存,排序,部门\n" + 
      data.map(r => Object.values(r).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "物品导出.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSoldout = async (p: ProductInfo) => {
    const next = p.status === 2 ? 1 : 2;
    try {
      await api.updateProduct({ id: p.id, status: next });
      toast({ title: next === 2 ? "已设为沽清" : "已恢复在售", description: `${p.name} · 收银端将${next === 2 ? "不再显示" : "恢复显示"}` });
      load();
    } catch (e) {
      toast({ title: "操作失败", description: String(e), variant: "destructive" });
    }
  };

  return (
    <div className="pb-6 grid gap-4 lg:grid-cols-[300px_1fr]">
      {/* 左侧大类列表 */}
      <DarkCard className="h-fit lg:sticky lg:top-4">
        <CardHeader className="pb-3">
          <SectionTitle
            icon={Package}
            title="菜品大类"
            desc={`${categories.length} 个大类 · 点击查看物品`}
            action={
              <Button size="sm" onClick={() => setAddingCategory(true)} className="bg-emerald-600 hover:bg-emerald-500 h-7 w-7 p-0">
                <Plus className="h-4 w-4" />
              </Button>
            }
          />
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full bg-slate-700/50" />
              ))}
            </div>
          ) : (
            <ScrollArea className="max-h-[560px] pr-1">
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCat("")}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-md text-sm transition-colors border",
                    !selectedCat
                      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
                      : "text-slate-300 hover:bg-slate-700/50 border-transparent",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">全部物品</span>
                    <Badge variant="outline" className="bg-slate-700/50 border-slate-600 text-slate-300">
                      {products.length}
                    </Badge>
                  </div>
                </button>
                {categories.map((c) => {
                  const active = selectedCat === c.id;
                  const catIcon = pickCategoryIcon(c.name);
                  const CatIcon = catIcon.icon;
                  return (
                    <div
                      key={c.id}
                      className={cn(
                        "rounded-md border p-3 transition-colors",
                        active
                          ? "bg-emerald-500/15 border-emerald-500/40"
                          : "bg-slate-800/40 border-slate-700/50 hover:border-slate-600",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          {/* 大类图标色块 */}
                          <span
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                              catIcon.color,
                            )}
                          >
                            <CatIcon className="h-4 w-4" />
                          </span>
                          <button
                            onClick={() => setSelectedCat(c.id)}
                            className="flex-1 min-w-0 text-left"
                          >
                            <div className={cn("font-medium truncate", active ? "text-emerald-300" : "text-slate-200")}>
                              {c.name}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {c.productCount} 个物品
                            </div>
                          </button>
                        </div>
                        {/* 右上角「+ 添加物品」按钮 — 用户反馈加号不够明显 */}
                        <Button
                          size="sm"
                          onClick={() => setAddingProductTo(c)}
                          className={cn(
                            "h-7 px-2 gap-1 shrink-0",
                            active
                              ? "bg-emerald-600 hover:bg-emerald-500"
                              : "bg-slate-700/60 hover:bg-slate-700 text-slate-200",
                          )}
                        >
                          <Plus className="h-3.5 w-3.5" /> 添加物品
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </DarkCard>

      {/* 右侧物品列表 */}
      <DarkCard>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <div className="text-sm font-semibold text-slate-100">
              {selectedCategory ? (
                <span className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-emerald-400" />
                  {selectedCategory.name}
                  <Badge variant="outline" className="bg-slate-700/50 border-slate-600 text-slate-300">
                    {filteredProducts.length} 项
                  </Badge>
                </span>
              ) : (
                <span>全部物品</span>
              )}
            </div>
            <div className="flex-1" />
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="搜索物品名称..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="pl-9 bg-slate-900/60 border-slate-700 text-slate-100"
              />
            </div>
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-slate-900/60 border-slate-700 text-slate-100">
                <SelectValue placeholder="出品部门" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                <SelectItem value="all">全部部门</SelectItem>
                {OUTPUT_DEPTS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    <span className="flex items-center gap-1.5">
                      <d.icon className={cn("h-3.5 w-3.5", d.color)} /> {d.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-700 h-9">批量修改</Button>
              <Button variant="outline" size="sm" onClick={() => {
                const csv = "物品名称,单位,包房价,大厅价,会员价,成本价\n" + filteredProducts.map(p => `${p.name},${p.unit || "份"},${p.roomPrice ?? p.price},${p.hallPrice ?? p.price},${p.memberPrice ?? p.price},${p.costPrice ?? 0}`).join("\n");
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = "物品列表.csv";
                link.click();
              }} className="bg-blue-600/20 border-blue-500/30 text-blue-400 hover:bg-blue-600/30 h-9">导出</Button>
              <Button variant="outline" size="sm" className="bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-700 h-9">日志</Button>
              <Button variant="outline" size="sm" className="bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-700 h-9">排序</Button>
              <Button variant="ghost" onClick={load} className="text-slate-300 hover:bg-slate-700/50 gap-1 h-9">
                <RefreshCw className="h-3.5 w-3.5" /> 刷新
              </Button>
            </div>
            {selectedCategory && (
              <Button
                onClick={() => setAddingProductTo(selectedCategory)}
                className="bg-emerald-600 hover:bg-emerald-500 gap-1"
              >
                <Plus className="h-4 w-4" /> 添加物品
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingGrid count={5} />
          ) : filteredProducts.length === 0 ? (
            <EmptyHint>
              {selectedCategory ? (
                <div className="space-y-2">
                  <div>该大类下暂无物品</div>
                  <Button size="sm" onClick={() => setAddingProductTo(selectedCategory)} className="bg-emerald-600 hover:bg-emerald-500 gap-1">
                    <Plus className="h-4 w-4" /> 添加第一个物品
                  </Button>
                </div>
              ) : (
                "暂无符合条件的物品"
              )}
            </EmptyHint>
          ) : (
            <div className="rounded-lg border border-slate-700/60 overflow-hidden">
              <ScrollArea className="max-h-[560px]">
                <table className="w-full text-sm">
                  <thead className="bg-slate-800/80 sticky top-0 backdrop-blur z-10">
                    <tr className="text-left text-slate-400 text-xs">
                      <th className="px-3 py-2 w-10">
                        <input 
                          type="checkbox" 
                          className="h-3.5 w-3.5 accent-emerald-500" 
                          checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedIds(filteredProducts.map(p => p.id));
                            else setSelectedIds([]);
                          }}
                        />
                      </th>
                      <th className="px-3 py-2 font-medium w-12">序号</th>
                      <th className="px-3 py-2 font-medium">物品</th>
                      <th className="px-3 py-2 font-medium">出品部门</th>
                      <th className="px-3 py-2 font-medium text-right">价格</th>
                      <th className="px-3 py-2 font-medium text-center hidden sm:table-cell">低消</th>
                      <th className="px-3 py-2 font-medium text-center hidden md:table-cell">套餐</th>
                      <th className="px-3 py-2 font-medium text-right hidden sm:table-cell">库存</th>
                      <th className="px-3 py-2 font-medium text-center">状态</th>
                      <th className="px-3 py-2 font-medium text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p) => {
                      const dept = OUTPUT_DEPTS.find((d) => d.value === p.outputDept);
                      const DeptIcon = dept?.icon ?? Wine;
                      const status = PRODUCT_STATUS[p.status] ?? PRODUCT_STATUS[1];
                      return (
                        <tr key={p.id} className="border-t border-slate-700/40 hover:bg-slate-800/50 transition-colors">
                          <td className="px-3 py-2.5">
                            <input 
                              type="checkbox" 
                              className="h-3.5 w-3.5 accent-emerald-500" 
                              checked={selectedIds.includes(p.id)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedIds([...selectedIds, p.id]);
                                else setSelectedIds(selectedIds.filter(id => id !== p.id));
                              }}
                            />
                          </td>
                          <td className="px-3 py-2.5 text-slate-500 text-xs">{p.sortOrder || 0}</td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              {/* 商品缩略图 32x32（无图隐藏） */}
                              <ProductRowThumb imageUrl={p.imageUrl} alt={p.name} />
                              <div className="min-w-0">
                                <div className="font-medium text-slate-100 flex items-center gap-1.5">
                                  <span className="truncate">{p.name}</span>
                                  {p.isPackage && (
                                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] px-1.5 py-0 shrink-0">
                                      <Package className="h-2.5 w-2.5 mr-0.5" />套餐
                                    </Badge>
                                  )}
                                </div>
                                {p.flavors.length > 0 && (
                                  <div className="text-xs text-slate-500 mt-0.5">
                                    口味: {p.flavors.map((f) => f.categoryName).filter((v, i, a) => a.indexOf(v) === i).join(" / ")}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={cn("inline-flex items-center gap-1 text-xs", dept?.color ?? "text-amber-400")}>
                              <DeptIcon className="h-3.5 w-3.5" />
                              {dept?.label ?? p.outputDept}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <InlineEdit
                              value={p.price}
                              onSave={(v) => handleQuickUpdate(p, "price", v)}
                              format={(v) => `包:¥${v.toFixed(2)}`}
                            />
                          </td>
                          <td className="px-3 py-2.5 text-center hidden sm:table-cell">
                            {p.countToMinSpend ? (
                              <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[10px]">计入</Badge>
                            ) : (
                              <Badge className="bg-slate-700/50 text-slate-400 border-slate-600/50 text-[10px]">不计</Badge>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-center hidden md:table-cell">
                            {p.isPackage ? (
                              <span className="text-emerald-300 font-mono text-xs">¥{p.packagePrice.toFixed(2)}</span>
                            ) : (
                              <span className="text-slate-600 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right hidden sm:table-cell">
                            <InlineEdit
                              value={p.stock}
                              onSave={(v) => handleQuickUpdate(p, "stock", v)}
                              format={(v) => v >= 999 ? "∞" : String(v)}
                            />
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <Badge variant="outline" className={status.className}>
                              {status.label}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleToggleStatus(p)}
                                className="h-7 px-2 text-slate-400 hover:text-emerald-300 hover:bg-slate-700/50"
                              >
                                {p.status === 1 ? "下架" : "上架"}
                              </Button>
                              {p.status !== 0 && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleSoldout(p)}
                                  className={cn(
                                    "h-7 px-2",
                                    p.status === 2
                                      ? "text-emerald-300 hover:bg-emerald-500/10"
                                      : "text-amber-300 hover:bg-amber-500/10",
                                  )}
                                >
                                  {p.status === 2 ? "恢复" : "沽清"}
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingProduct(p)}
                                className="h-7 w-7 p-0 text-slate-400 hover:text-sky-300 hover:bg-slate-700/50"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </DarkCard>

      <AddCategoryDialog
        open={addingCategory}
        onClose={() => setAddingCategory(false)}
        onSaved={() => {
          setAddingCategory(false);
          load();
        }}
      />
      <AddProductDialog
        category={addingProductTo}
        allProducts={products}
        categories={categories}
        onClose={() => setAddingProductTo(null)}
        onSaved={() => {
          setAddingProductTo(null);
          load();
        }}
      />
      <EditProductDialog
        product={editingProduct}
        allProducts={products}
        categories={categories}
        onClose={() => setEditingProduct(null)}
        onSaved={() => {
          setEditingProduct(null);
          load();
        }}
      />
    </div>
  );
}

function InlineEdit({ value, onSave, format }: {
  value: number;
  onSave: (v: number) => void;
  format: (v: number) => string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  if (editing) {
    return (
      <Input
        autoFocus
        type="number"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          setEditing(false);
          const n = Number(draft);
          if (!isNaN(n) && n !== value) onSave(n);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") {
            setDraft(String(value));
            setEditing(false);
          }
        }}
        className="h-7 w-20 bg-slate-900/60 border-slate-700 text-slate-100 text-right"
      />
    );
  }
  return (
    <button
      onClick={() => setEditing(true)}
      className="font-mono text-slate-200 hover:text-emerald-300 hover:bg-slate-700/40 rounded px-1.5 py-0.5 transition-colors"
    >
      {format(value)}
    </button>
  );
}

function AddCategoryDialog({ open, onClose, onSaved }: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) setName("");
  }, [open]);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await api.createCategory(name.trim());
      toast({ title: "大类已创建", description: name.trim() });
      onSaved();
    } catch (e) {
      toast({ title: "创建失败", description: String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-slate-100">新建菜品大类</DialogTitle>
          <DialogDescription className="text-slate-400">例如：酒水 / 饮料 / 零食 / 套餐</DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <Label className="text-xs text-slate-400">大类名称</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="输入大类名称"
            className="bg-slate-800/60 border-slate-700 text-slate-100 mt-1"
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-slate-300 hover:bg-slate-800">取消</Button>
          <Button onClick={save} disabled={saving || !name.trim()} className="bg-emerald-600 hover:bg-emerald-500 gap-1">
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            创建
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 解析 packageItems
function parsePackageItems(raw: string | null): Array<{ productId: string; name: string; qty: number }> {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr as Array<{ productId: string; name: string; qty: number }>;
  } catch {
    /* ignore */
  }
  return [];
}

// 通用：物品编辑/新建表单（含 计入最低消费 + 套餐 + 子商品）
function ProductFormFields({
  name, setName,
  price, setPrice,
  roomPrice, setRoomPrice,
  hallPrice, setHallPrice,
  memberPrice, setMemberPrice,
  costPrice, setCostPrice,
  unit, setUnit,
  sortOrder, setSortOrder,
  stock, setStock,
  status, setStatus,
  outputDept, setOutputDept,
  countToMinSpend, setCountToMinSpend,
  isPackage, setIsPackage,
  packagePrice, setPackagePrice,
  packageItemDrafts, setPackageItemDrafts,
  allProducts,
  selfId,
}: {
  name: string; setName: (v: string) => void;
  price: number; setPrice: (v: number) => void;
  roomPrice: number; setRoomPrice: (v: number) => void;
  hallPrice: number; setHallPrice: (v: number) => void;
  memberPrice: number; setMemberPrice: (v: number) => void;
  costPrice: number; setCostPrice: (v: number) => void;
  unit: string; setUnit: (v: string) => void;
  sortOrder: number; setSortOrder: (v: number) => void;
  stock: number; setStock: (v: number) => void;
  status: number; setStatus: (v: number) => void;
  outputDept: string; setOutputDept: (v: string) => void;
  countToMinSpend: boolean; setCountToMinSpend: (v: boolean) => void;
  isPackage: boolean; setIsPackage: (v: boolean) => void;
  packagePrice: number; setPackagePrice: (v: number) => void;
  packageItemDrafts: Array<{ productId: string; name: string; qty: number }>;
  setPackageItemDrafts: (v: Array<{ productId: string; name: string; qty: number }>) => void;
  allProducts: ProductInfo[];
  selfId?: string;
}) {
  // 子商品可选范围：非套餐、非自己
  const availableSubs = useMemo(
    () => allProducts.filter((p) => !p.isPackage && p.id !== selfId),
    [allProducts, selfId],
  );

  const toggleSub = (p: ProductInfo) => {
    const exists = packageItemDrafts.find((d) => d.productId === p.id);
    if (exists) {
      setPackageItemDrafts(packageItemDrafts.filter((d) => d.productId !== p.id));
    } else {
      setPackageItemDrafts([...packageItemDrafts, { productId: p.id, name: p.name, qty: 1 }]);
    }
  };

  const setSubQty = (productId: string, qty: number) => {
    setPackageItemDrafts(packageItemDrafts.map((d) => (d.productId === productId ? { ...d, qty: Math.max(1, qty) } : d)));
  };

  return (
    <div className="py-2 space-y-3">
      <div className="grid grid-cols-4 gap-3">
        <div className="col-span-2">
          <Label className="text-xs text-slate-400">物品名称</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-slate-800/60 border-slate-700 text-slate-100 mt-1" />
        </div>
        <div>
          <Label className="text-xs text-slate-400">单位</Label>
          <Input value={unit} onChange={(e) => setUnit(e.target.value)} className="bg-slate-800/60 border-slate-700 text-slate-100 mt-1" placeholder="份/瓶/打" />
        </div>
        <div>
          <Label className="text-xs text-slate-400">显示序号</Label>
          <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className="bg-slate-800/60 border-slate-700 text-slate-100 mt-1" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="text-xs text-slate-400">包房价 ¥</Label>
          <Input type="number" value={roomPrice} onChange={(e) => setRoomPrice(Number(e.target.value))} className="bg-slate-800/60 border-slate-700 text-slate-100 mt-1" />
        </div>
        <div>
          <Label className="text-xs text-slate-400">大厅价 ¥</Label>
          <Input type="number" value={hallPrice} onChange={(e) => setHallPrice(Number(e.target.value))} className="bg-slate-800/60 border-slate-700 text-slate-100 mt-1" />
        </div>
        <div>
          <Label className="text-xs text-slate-400">会员价 ¥</Label>
          <Input type="number" value={memberPrice} onChange={(e) => setMemberPrice(Number(e.target.value))} className="bg-slate-800/60 border-slate-700 text-slate-100 mt-1" />
        </div>
        <div>
          <Label className="text-xs text-slate-400">成本价 ¥</Label>
          <Input type="number" value={costPrice} onChange={(e) => setCostPrice(Number(e.target.value))} className="bg-slate-800/60 border-slate-700 text-slate-100 mt-1" />
        </div>
        <div>
          <Label className="text-xs text-slate-400">库存</Label>
          <Input
            type="number"
            value={stock}
            onChange={(e) => setStock(Number(e.target.value))}
            className="bg-slate-800/60 border-slate-700 text-slate-100 mt-1"
          />
        </div>
        <div>
          <Label className="text-xs text-slate-400">状态</Label>
          <Select value={String(status)} onValueChange={(v) => setStatus(Number(v))}>
            <SelectTrigger className="bg-slate-800/60 border-slate-700 text-slate-100 mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
              <SelectItem value="1">在售</SelectItem>
              <SelectItem value="0">停售</SelectItem>
              <SelectItem value="2">估清</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-xs text-slate-400">出品部门</Label>
        <div className="grid grid-cols-4 gap-2 mt-1">
          {OUTPUT_DEPTS.map((d) => {
            const Icon = d.icon;
            const active = outputDept === d.value;
            return (
              <button
                key={d.value}
                onClick={() => setOutputDept(d.value)}
                className={cn(
                  "rounded-lg border-2 p-3 text-center transition-all",
                  active ? "border-emerald-500 bg-emerald-500/15" : "border-slate-700 bg-slate-800/50 hover:border-slate-600",
                )}
              >
                <Icon className={cn("h-5 w-5 mx-auto", d.color)} />
                <div className={cn("text-xs mt-1", active ? "text-emerald-300" : "text-slate-400")}>{d.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      <Separator className="bg-slate-700/60" />

      {/* 计入最低消费 */}
      <div className="flex items-center justify-between rounded-md border border-slate-700 bg-slate-800/40 px-3 py-2.5">
        <div className="min-w-0">
          <div className="text-sm text-slate-200 flex items-center gap-1.5">
            <Percent className="h-3.5 w-3.5 text-amber-400" />
            计入最低消费
          </div>
          <div className="text-xs text-slate-500 mt-0.5">不勾选的物品，即使包厢有最低消费，点了也不算进低消</div>
        </div>
        <Switch checked={countToMinSpend} onCheckedChange={setCountToMinSpend} />
      </div>

      {/* 套餐 */}
      <div className="rounded-md border border-slate-700 bg-slate-800/40 px-3 py-2.5">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-sm text-slate-200 flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-emerald-400" />
              是否套餐
            </div>
            <div className="text-xs text-slate-500 mt-0.5">勾选后设定套餐价，子商品单价在账单中隐藏（显示0），只有套餐价进账单</div>
          </div>
          <Switch checked={isPackage} onCheckedChange={setIsPackage} />
        </div>

        {isPackage && (
          <div className="mt-3 space-y-3 border-t border-slate-700/50 pt-3">
            <div>
              <Label className="text-xs text-slate-400">套餐价 ¥</Label>
              <Input
                type="number"
                value={packagePrice}
                onChange={(e) => setPackagePrice(Number(e.target.value))}
                className="bg-slate-800/60 border-slate-700 text-slate-100 mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-400">套餐子项选择</Label>
              <div className="mt-1 max-h-56 overflow-y-auto rounded-md border border-slate-700/50 bg-slate-900/40 p-2 space-y-1">
                {availableSubs.length === 0 && (
                  <div className="text-xs text-slate-500 text-center py-4">暂无可选子商品</div>
                )}
                {availableSubs.map((p) => {
                  const checked = packageItemDrafts.some((d) => d.productId === p.id);
                  const draft = packageItemDrafts.find((d) => d.productId === p.id);
                  return (
                    <label
                      key={p.id}
                      className={cn(
                        "flex items-center gap-2 rounded px-2 py-1.5 cursor-pointer transition-colors",
                        checked ? "bg-emerald-500/10" : "hover:bg-slate-800/60",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSub(p)}
                        className="h-3.5 w-3.5 accent-emerald-500"
                      />
                      <span className={cn("text-sm flex-1 truncate", checked ? "text-emerald-200" : "text-slate-300")}>
                        {p.name}
                      </span>
                      <span className="text-xs text-slate-500">¥{p.price.toFixed(2)}</span>
                      {checked && draft && (
                        <Input
                          type="number"
                          min={1}
                          value={draft.qty}
                          onChange={(e) => setSubQty(p.id, Number(e.target.value))}
                          className="h-7 w-14 bg-slate-900/60 border-slate-700 text-slate-100 text-center"
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                    </label>
                  );
                })}
              </div>
              {packageItemDrafts.length > 0 && (
                <div className="mt-2 text-xs text-slate-400">
                  已选 {packageItemDrafts.length} 项 · 子商品单价在账单中显示为 ¥0
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AddProductDialog({ category, allProducts, categories, onClose, onSaved }: {
  category: ProductCategoryInfo | null;
  allProducts: ProductInfo[];
  categories: ProductCategoryInfo[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);
  const [roomPrice, setRoomPrice] = useState(0);
  const [hallPrice, setHallPrice] = useState(0);
  const [memberPrice, setMemberPrice] = useState(0);
  const [costPrice, setCostPrice] = useState(0);
  const [unit, setUnit] = useState("份");
  const [sortOrder, setSortOrder] = useState(0);
  const [stock, setStock] = useState(0);
  const [status, setStatus] = useState(1);
  const [outputDept, setOutputDept] = useState("bar");
  const [countToMinSpend, setCountToMinSpend] = useState(true);
  const [isPackage, setIsPackage] = useState(false);
  const [packagePrice, setPackagePrice] = useState(0);
  const [packageItemDrafts, setPackageItemDrafts] = useState<Array<{ productId: string; name: string; qty: number }>>([]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (category) {
      setName("");
      setPrice(0);
      setStock(0);
      setStatus(1);
      setOutputDept("bar");
      setCountToMinSpend(true);
      setIsPackage(false);
      setPackagePrice(0);
      setPackageItemDrafts([]);
    }
  }, [category]);

  const save = async () => {
    if (!category || !name.trim()) return;
    setSaving(true);
    try {
      await api.createProduct({
        name: name.trim(),
        categoryId: category.id,
        price: Number(price),
        stock: Number(stock),
        status: Number(status),
        outputDept,
        countToMinSpend,
        isPackage,
        packagePrice: Number(packagePrice),
        packageItems: isPackage ? JSON.stringify(packageItemDrafts) : null,
      });
      toast({ title: "物品已添加", description: `${category.name} / ${name.trim()}` });
      onSaved();
    } catch (e) {
      toast({ title: "创建失败", description: String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!category} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-100">添加物品 · {category?.name}</DialogTitle>
          <DialogDescription className="text-slate-400">
            填写物品基础信息、出品部门、最低消费与套餐设置
          </DialogDescription>
        </DialogHeader>
        <ProductFormFields
          name={name} setName={setName}
          price={price} setPrice={setPrice}
          roomPrice={roomPrice} setRoomPrice={setRoomPrice}
          hallPrice={hallPrice} setHallPrice={setHallPrice}
          memberPrice={memberPrice} setMemberPrice={setMemberPrice}
          costPrice={costPrice} setCostPrice={setCostPrice}
          unit={unit} setUnit={setUnit}
          sortOrder={sortOrder} setSortOrder={setSortOrder}
          stock={stock} setStock={setStock}
          status={status} setStatus={setStatus}
          outputDept={outputDept} setOutputDept={setOutputDept}
          countToMinSpend={countToMinSpend} setCountToMinSpend={setCountToMinSpend}
          isPackage={isPackage} setIsPackage={setIsPackage}
          packagePrice={packagePrice} setPackagePrice={setPackagePrice}
          packageItemDrafts={packageItemDrafts} setPackageItemDrafts={setPackageItemDrafts}
          allProducts={allProducts}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-slate-300 hover:bg-slate-800">取消</Button>
          <Button onClick={save} disabled={saving || !name.trim()} className="bg-emerald-600 hover:bg-emerald-500 gap-1">
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            添加物品
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditProductDialog({ product, allProducts, categories, onClose, onSaved }: {
  product: ProductInfo | null;
  allProducts: ProductInfo[];
  categories: ProductCategoryInfo[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [price, setPrice] = useState(0);
  const [roomPrice, setRoomPrice] = useState(0);
  const [hallPrice, setHallPrice] = useState(0);
  const [memberPrice, setMemberPrice] = useState(0);
  const [costPrice, setCostPrice] = useState(0);
  const [unit, setUnit] = useState("份");
  const [sortOrder, setSortOrder] = useState(0);
  const [stock, setStock] = useState(0);
  const [status, setStatus] = useState(1);
  const [outputDept, setOutputDept] = useState("bar");
  const [name, setName] = useState("");
  const [countToMinSpend, setCountToMinSpend] = useState(true);
  const [isPackage, setIsPackage] = useState(false);
  const [packagePrice, setPackagePrice] = useState(0);
  const [packageItemDrafts, setPackageItemDrafts] = useState<Array<{ productId: string; name: string; qty: number }>>([]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (product) {
      setPrice(product.price);
      setRoomPrice(product.roomPrice ?? product.price);
      setHallPrice(product.hallPrice ?? product.price);
      setMemberPrice(product.memberPrice ?? product.price);
      setCostPrice(product.costPrice ?? 0);
      setUnit(product.unit ?? "份");
      setSortOrder(product.sortOrder ?? 0);
      setStock(product.stock);
      setStatus(product.status);
      setOutputDept(product.outputDept);
      setName(product.name);
      setCountToMinSpend(product.countToMinSpend);
      setIsPackage(product.isPackage);
      setPackagePrice(product.packagePrice);
      setPackageItemDrafts(parsePackageItems(product.packageItems));
    }
  }, [product]);

  const save = async () => {
    if (!product) return;
    setSaving(true);
    try {
      await api.updateProduct({
        id: product.id,
        name,
        price: Number(roomPrice),
        roomPrice: Number(roomPrice),
        hallPrice: Number(hallPrice),
        memberPrice: Number(memberPrice),
        costPrice: Number(costPrice),
        unit,
        sortOrder: Number(sortOrder),
        stock: Number(stock),
        status: Number(status),
        outputDept,
        countToMinSpend,
        isPackage,
        packagePrice: Number(packagePrice),
        packageItems: isPackage ? JSON.stringify(packageItemDrafts) : null,
      });
      toast({ title: "物品已更新", description: product.name });
      onSaved();
    } catch (e) {
      toast({ title: "更新失败", description: String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!product} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-100">编辑物品</DialogTitle>
          <DialogDescription className="text-slate-400">
            修改物品基础信息、价格、库存、出品部门与套餐设置
          </DialogDescription>
        </DialogHeader>
        <ProductFormFields
          name={name} setName={setName}
          price={price} setPrice={setPrice}
          roomPrice={roomPrice} setRoomPrice={setRoomPrice}
          hallPrice={hallPrice} setHallPrice={setHallPrice}
          memberPrice={memberPrice} setMemberPrice={setMemberPrice}
          costPrice={costPrice} setCostPrice={setCostPrice}
          unit={unit} setUnit={setUnit}
          sortOrder={sortOrder} setSortOrder={setSortOrder}
          stock={stock} setStock={setStock}
          status={status} setStatus={setStatus}
          outputDept={outputDept} setOutputDept={setOutputDept}
          countToMinSpend={countToMinSpend} setCountToMinSpend={setCountToMinSpend}
          isPackage={isPackage} setIsPackage={setIsPackage}
          packagePrice={packagePrice} setPackagePrice={setPackagePrice}
          packageItemDrafts={packageItemDrafts} setPackageItemDrafts={setPackageItemDrafts}
          allProducts={allProducts}
          selfId={product?.id}
        />
        {product && (
          <div className="text-xs text-slate-500 border-t border-slate-700/40 pt-2">
            当前大类：{product.categoryName}
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-slate-300 hover:bg-slate-800">取消</Button>
          <Button onClick={save} disabled={saving} className="bg-emerald-600 hover:bg-emerald-500 gap-1">
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ Tab3: 口味设置 ============

function FlavorsTab() {
  const [flavors, setFlavors] = useState<FlavorCategoryInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setFlavors(await api.getFlavorCategories());
    } catch (e) {
      toast({ title: "加载失败", description: String(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="pb-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-400">
          共 {flavors.length} 个口味分类，{flavors.reduce((s, f) => s + f.flavors.length, 0)} 个口味选项
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-700 h-9">批量修改</Button>
              <Button variant="outline" size="sm" onClick={() => {
                const csv = "物品名称,单位,包房价,大厅价,会员价,成本价\n" + filteredProducts.map(p => `${p.name},${p.unit || "份"},${p.roomPrice ?? p.price},${p.hallPrice ?? p.price},${p.memberPrice ?? p.price},${p.costPrice ?? 0}`).join("\n");
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = "物品列表.csv";
                link.click();
              }} className="bg-blue-600/20 border-blue-500/30 text-blue-400 hover:bg-blue-600/30 h-9">导出</Button>
              <Button variant="outline" size="sm" className="bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-700 h-9">日志</Button>
              <Button variant="outline" size="sm" className="bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-700 h-9">排序</Button>
              <Button variant="ghost" onClick={load} className="text-slate-300 hover:bg-slate-700/50 gap-1 h-9">
                <RefreshCw className="h-3.5 w-3.5" /> 刷新
              </Button>
            </div>
          <Button onClick={() => setAdding(true)} className="bg-emerald-600 hover:bg-emerald-500 gap-1">
            <Plus className="h-4 w-4" /> 新建口味分类
          </Button>
        </div>
      </div>

      {loading ? (
        <LoadingGrid count={3} className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3" />
      ) : flavors.length === 0 ? (
        <EmptyHint>暂无口味分类</EmptyHint>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {flavors.map((f) => (
            <DarkCard key={f.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="rounded-md bg-fuchsia-500/15 p-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-fuchsia-400" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-slate-100">{f.name}</CardTitle>
                      <CardDescription className="text-xs text-slate-400">
                        {f.required ? "必选" : "可选"} · {f.flavors.length} 个选项
                      </CardDescription>
                    </div>
                  </div>
                  {f.required ? (
                    <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30">必选</Badge>
                  ) : (
                    <Badge className="bg-slate-700/50 text-slate-300 border-slate-600/50">可选</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {f.flavors.map((fl) => (
                    <span
                      key={fl.id}
                      className="inline-flex items-center rounded-md bg-slate-700/40 border border-slate-600/40 px-2.5 py-1 text-xs text-slate-200"
                    >
                      {fl.name}
                      {fl.priceDelta > 0 && (
                        <span className="ml-1 text-emerald-400">+¥{fl.priceDelta}</span>
                      )}
                    </span>
                  ))}
                  {f.flavors.length === 0 && (
                    <span className="text-xs text-slate-500">暂无选项</span>
                  )}
                </div>
              </CardContent>
            </DarkCard>
          ))}
        </div>
      )}

      <CreateFlavorDialog
        open={adding}
        onClose={() => setAdding(false)}
        onSaved={() => {
          setAdding(false);
          load();
        }}
      />
    </div>
  );
}

function CreateFlavorDialog({ open, onClose, onSaved }: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [required, setRequired] = useState(false);
  const [flavorsText, setFlavorsText] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setName("");
      setRequired(false);
      setFlavorsText("");
    }
  }, [open]);

  const save = async () => {
    if (!name.trim()) return;
    const flavors = flavorsText
      .split(/[,，\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (flavors.length === 0) {
      toast({ title: "请至少添加一个口味选项", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await api.createFlavorCategory(name.trim(), required, flavors);
      toast({ title: "口味分类已创建", description: `${name} · ${flavors.length} 个选项` });
      onSaved();
    } catch (e) {
      toast({ title: "创建失败", description: String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-slate-100">新建口味分类</DialogTitle>
          <DialogDescription className="text-slate-400">
            口味是动态的，分类名与选项名都由管理员自定义
          </DialogDescription>
        </DialogHeader>
        <div className="py-2 space-y-3">
          <div>
            <Label className="text-xs text-slate-400">分类名称</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：酒水温度 / 辣度 / 甜度"
              className="bg-slate-800/60 border-slate-700 text-slate-100 mt-1"
            />
          </div>
          <div className="flex items-center justify-between rounded-md border border-slate-700 bg-slate-800/40 px-3 py-2">
            <div>
              <div className="text-sm text-slate-200">必选口味</div>
              <div className="text-xs text-slate-500">启用后点单时强制弹出选择</div>
            </div>
            <Switch checked={required} onCheckedChange={setRequired} />
          </div>
          <div>
            <Label className="text-xs text-slate-400">口味选项（逗号或空格分隔）</Label>
            <Textarea
              value={flavorsText}
              onChange={(e) => setFlavorsText(e.target.value)}
              placeholder="常温, 冰镇&#10;或不辣, 微辣, 中辣, 特辣"
              rows={3}
              className="bg-slate-800/60 border-slate-700 text-slate-100 mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-slate-300 hover:bg-slate-800">取消</Button>
          <Button onClick={save} disabled={saving || !name.trim()} className="bg-emerald-600 hover:bg-emerald-500 gap-1">
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            创建
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ Tab4: 赠送规则 ============

function GiftRulesTab() {
  const [rules, setRules] = useState<GiftRuleInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRules(await api.getGiftRules());
    } catch (e) {
      toast({ title: "加载失败", description: String(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggle = async (r: GiftRuleInfo, enabled: boolean) => {
    try {
      await api.updateGiftRule(r.id, { enabled });
      toast({
        title: enabled ? "规则已启用" : "规则已停用",
        description: r.name,
      });
      load();
    } catch (e) {
      toast({ title: "操作失败", description: String(e), variant: "destructive" });
    }
  };

  const parseDeliveries = (raw: string | null): Array<{ name: string; qty: number }> => {
    if (!raw) return [];
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr as Array<{ name: string; qty: number }>;
    } catch {
      /* ignore */
    }
    return [];
  };

  return (
    <div className="pb-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-400">
          共 {rules.length} 条规则，{rules.filter((r) => r.enabled).length} 条启用中
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-700 h-9">批量修改</Button>
              <Button variant="outline" size="sm" onClick={() => {
                const csv = "物品名称,单位,包房价,大厅价,会员价,成本价\n" + filteredProducts.map(p => `${p.name},${p.unit || "份"},${p.roomPrice ?? p.price},${p.hallPrice ?? p.price},${p.memberPrice ?? p.price},${p.costPrice ?? 0}`).join("\n");
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = "物品列表.csv";
                link.click();
              }} className="bg-blue-600/20 border-blue-500/30 text-blue-400 hover:bg-blue-600/30 h-9">导出</Button>
              <Button variant="outline" size="sm" className="bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-700 h-9">日志</Button>
              <Button variant="outline" size="sm" className="bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-700 h-9">排序</Button>
              <Button variant="ghost" onClick={load} className="text-slate-300 hover:bg-slate-700/50 gap-1 h-9">
                <RefreshCw className="h-3.5 w-3.5" /> 刷新
              </Button>
            </div>
          <Button onClick={() => setAdding(true)} className="bg-emerald-600 hover:bg-emerald-500 gap-1">
            <Plus className="h-4 w-4" /> 新建规则
          </Button>
        </div>
      </div>

      {loading ? (
        <LoadingGrid count={3} />
      ) : rules.length === 0 ? (
        <EmptyHint>暂无赠送规则</EmptyHint>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rules.map((r) => {
            const deliveries = parseDeliveries(r.deliveries);
            return (
              <DarkCard key={r.id} className={cn(!r.enabled && "opacity-60")}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="rounded-md bg-rose-500/15 p-1.5 shrink-0">
                        <Gift className="h-3.5 w-3.5 text-rose-400" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-base text-slate-100 truncate">{r.name}</CardTitle>
                        <CardDescription className="text-xs text-slate-400">
                          {r.cumulative ? "累计叠加" : "单次触发"} ·{" "}
                          {r.timeLimit ? `时段 ${r.startTime}-${r.endTime}` : "全时段"} ·{" "}
                          {r.roomLimit ? `限 ${r.roomTypes}` : "全部房台"}
                        </CardDescription>
                      </div>
                    </div>
                    <Switch
                      checked={r.enabled}
                      onCheckedChange={(c) => handleToggle(r, c)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg bg-slate-900/60 border border-slate-700/40 p-3">
                    <div className="flex items-center gap-2 flex-wrap text-sm">
                      <span className="text-slate-400">买</span>
                      <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30">
                        {r.condProductName}
                      </Badge>
                      <span className="text-slate-300 font-mono">×{r.condQty}</span>
                      <span className="text-emerald-400 mx-1">→</span>
                      {r.giftQty > 0 ? (
                        <>
                          <span className="text-slate-400">送</span>
                          <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
                            {r.giftProductName}
                          </Badge>
                          <span className="text-slate-300 font-mono">×{r.giftQty}</span>
                        </>
                      ) : (
                        <span className="text-slate-500 text-xs">（仅配送，不赠送主商品）</span>
                      )}
                    </div>
                    {deliveries.length > 0 && (
                      <div className="mt-2 flex items-center gap-2 flex-wrap text-xs">
                        <span className="text-slate-400">+ 配送：</span>
                        {deliveries.map((d, i) => (
                          <Badge key={i} variant="outline" className="bg-sky-500/10 text-sky-300 border-sky-500/30">
                            {d.name} ×{d.qty}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </DarkCard>
            );
          })}
        </div>
      )}

      <CreateGiftRuleDialog
        open={adding}
        onClose={() => setAdding(false)}
        onSaved={() => {
          setAdding(false);
          load();
        }}
      />
    </div>
  );
}

function CreateGiftRuleDialog({ open, onClose, onSaved }: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [condProductName, setCondProductName] = useState("");
  const [condQty, setCondQty] = useState(2);
  const [cumulative, setCumulative] = useState(true);
  const [giftProductName, setGiftProductName] = useState("");
  const [giftQty, setGiftQty] = useState(1);
  const [deliveriesText, setDeliveriesText] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<ProductInfo[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setName("");
      setCondProductName("");
      setCondQty(2);
      setCumulative(true);
      setGiftProductName("");
      setGiftQty(1);
      setDeliveriesText("");
      setEnabled(true);
    }
  }, [open]);

  // 加载在售物品列表供下拉选择（排除套餐）
  useEffect(() => {
    if (open && products.length === 0) {
      api.getProducts().then(setProducts).catch(() => {});
    }
  }, [open, products.length]);

  const save = async () => {
    if (!name.trim() || !condProductName.trim() || !giftProductName.trim()) {
      toast({ title: "请填写完整规则信息", variant: "destructive" });
      return;
    }
    const deliveries = deliveriesText
      .split(/[\n,，]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        const m = s.match(/^(.+?)[\s×xX]*(\d+)$/);
        return m ? { name: m[1].trim(), qty: Number(m[2]) } : { name: s, qty: 1 };
      });
    setSaving(true);
    try {
      await api.createGiftRule({
        name: name.trim(),
        condProductName: condProductName.trim(),
        condQty,
        cumulative,
        giftProductName: giftProductName.trim(),
        giftQty,
        deliveries: JSON.stringify(deliveries),
        timeLimit: false,
        roomLimit: false,
        enabled,
      });
      toast({ title: "规则已创建", description: name.trim() });
      onSaved();
    } catch (e) {
      toast({ title: "创建失败", description: String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-slate-100">新建赠送规则</DialogTitle>
          <DialogDescription className="text-slate-400">
            买 N 送 M + 配送，支持累计叠加
          </DialogDescription>
        </DialogHeader>
        <div className="py-2 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          <div>
            <Label className="text-xs text-slate-400">规则名称</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：百威买2送1"
              className="bg-slate-800/60 border-slate-700 text-slate-100 mt-1"
            />
          </div>
          <Separator className="bg-slate-700/60" />
          <div className="text-xs font-medium text-emerald-300">购买条件</div>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <Label className="text-xs text-slate-400">商品名称</Label>
              <Select value={condProductName} onValueChange={setCondProductName}>
                <SelectTrigger className="bg-slate-800/60 border-slate-700 text-slate-100 mt-1">
                  <SelectValue placeholder="选择商品" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-slate-100 max-h-60">
                  {products.filter((p) => !p.isPackage).map((p) => (
                    <SelectItem key={p.id} value={p.name}>{p.name} · ¥{p.price.toFixed(2)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-slate-400">数量</Label>
              <Input
                type="number"
                value={condQty}
                onChange={(e) => setCondQty(Number(e.target.value))}
                className="bg-slate-800/60 border-slate-700 text-slate-100 mt-1"
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md border border-slate-700 bg-slate-800/40 px-3 py-2">
            <div className="text-xs text-slate-300">累计叠加（买 4 件 = 触发 2 次）</div>
            <Switch checked={cumulative} onCheckedChange={setCumulative} />
          </div>
          <Separator className="bg-slate-700/60" />
          <div className="text-xs font-medium text-emerald-300">赠送内容</div>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <Label className="text-xs text-slate-400">赠送商品</Label>
              <Select value={giftProductName} onValueChange={setGiftProductName}>
                <SelectTrigger className="bg-slate-800/60 border-slate-700 text-slate-100 mt-1">
                  <SelectValue placeholder="选择商品" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-slate-100 max-h-60">
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.name}>{p.name} · ¥{p.price.toFixed(2)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-slate-400">数量</Label>
              <Input
                type="number"
                value={giftQty}
                onChange={(e) => setGiftQty(Number(e.target.value))}
                className="bg-slate-800/60 border-slate-700 text-slate-100 mt-1"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs text-slate-400">额外配送（每行一项：商品名 数量）</Label>
            <Textarea
              value={deliveriesText}
              onChange={(e) => setDeliveriesText(e.target.value)}
              placeholder={"矿泉水 6\n果盘 1"}
              rows={2}
              className="bg-slate-800/60 border-slate-700 text-slate-100 mt-1"
            />
          </div>
          <div className="flex items-center justify-between rounded-md border border-slate-700 bg-slate-800/40 px-3 py-2">
            <div className="text-xs text-slate-300">立即启用</div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-slate-300 hover:bg-slate-800">取消</Button>
          <Button onClick={save} disabled={saving} className="bg-emerald-600 hover:bg-emerald-500 gap-1">
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            创建规则
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ Tab5: 人事（员工入职 / 权限 / 折扣 / 赠送额度） ============

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
  permissions: string | null;
  entryDate: string;
}

function EmployeesTab() {
  const [employees, setEmployees] = useState<EmployeeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<EmployeeInfo | null>(null);
  const [posFilter, setPosFilter] = useState("all");
  const [qrOpen, setQrOpen] = useState(false);
  const [joinApps, setJoinApps] = useState<any[]>([]);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [emps, joins] = await Promise.all([
        api.getEmployees(),
        fetch("/api/join-applications?storeId=1001").then((r) => r.json()).then((b) => b.data ?? []),
      ]);
      setEmployees(emps);
      setJoinApps(joins);
    } catch (e) {
      toast({ title: "加载失败", description: String(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () => (posFilter === "all" ? employees : employees.filter((e) => e.position === posFilter)),
    [employees, posFilter],
  );

  const onDuty = employees.filter((e) => e.status === 1).length;
  const marketingCount = employees.filter((e) => e.position === "marketing").length;
  const totalGiftLimit = employees.reduce((s, e) => s + e.monthlyGiftLimit, 0);
  const totalGiftUsed = employees.reduce((s, e) => s + e.usedGiftAmount, 0);

  return (
    <div className="pb-6 space-y-4">
      {/* KPI */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <DarkCard className="p-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Users className="h-3.5 w-3.5" /> 员工总数
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-1">{employees.length}</div>
        </DarkCard>
        <DarkCard className="p-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <IdCard className="h-3.5 w-3.5" /> 在职
          </div>
          <div className="text-2xl font-bold text-emerald-300 mt-1">{onDuty}</div>
        </DarkCard>
        <DarkCard className="p-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <TrendingUp className="h-3.5 w-3.5" /> 营销岗位
          </div>
          <div className="text-2xl font-bold text-amber-300 mt-1">{marketingCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">订房经理</div>
        </DarkCard>
        <DarkCard className="p-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Gift className="h-3.5 w-3.5" /> 赠送额度（月）
          </div>
          <div className="text-2xl font-bold text-sky-300 mt-1">
            ¥{totalGiftUsed.toFixed(0)}<span className="text-sm text-slate-500"> / {totalGiftLimit.toFixed(0)}</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
            <CalendarClock className="h-2.5 w-2.5" /> 每月1号重置
          </div>
        </DarkCard>
      </div>

      <DarkCard>
        <CardHeader className="pb-3">
          <SectionTitle
            icon={UserCog}
            title="员工入职登记 / 权限 / 折扣 / 赠送额度"
            desc="管理人员档案、岗位、权限角色、折扣率与月度赠送额度"
            action={
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setQrOpen(true)} className="bg-slate-900/60 border-slate-700 text-slate-200 hover:bg-slate-700 gap-1">
                  <QrCode className="h-4 w-4" /> 生成入职码
                </Button>
                <Button onClick={() => setAdding(true)} className="bg-emerald-600 hover:bg-emerald-500 gap-1">
                  <Plus className="h-4 w-4" /> 新建员工
                </Button>
              </div>
            }
          />
          <div className="flex flex-wrap items-center gap-2">
            <Select value={posFilter} onValueChange={setPosFilter}>
              <SelectTrigger className="w-36 bg-slate-900/60 border-slate-700 text-slate-100 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                <SelectItem value="all">全部岗位</SelectItem>
                {POSITION_OPTIONS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="ghost" onClick={load} className="text-slate-300 hover:bg-slate-700/50 gap-1">
              <RefreshCw className="h-3.5 w-3.5" /> 刷新
            </Button>
            <div className="ml-auto text-xs text-slate-500">
              共 {filtered.length} 人
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingGrid count={3} />
          ) : filtered.length === 0 ? (
            <EmptyHint>暂无员工，点击「新建员工」开始登记</EmptyHint>
          ) : (
            <div className="rounded-lg border border-slate-700/60 overflow-hidden">
              <ScrollArea className="max-h-[560px]">
                <table className="w-full text-sm">
                  <thead className="bg-slate-800/80 sticky top-0 backdrop-blur z-10">
                    <tr className="text-left text-slate-400 text-xs">
                      <th className="px-3 py-2 font-medium">姓名</th>
                      <th className="px-3 py-2 font-medium hidden sm:table-cell">电话</th>
                      <th className="px-3 py-2 font-medium">岗位</th>
                      <th className="px-3 py-2 font-medium hidden md:table-cell">部门</th>
                      <th className="px-3 py-2 font-medium hidden lg:table-cell">权限角色</th>
                      <th className="px-3 py-2 font-medium text-right">折扣率</th>
                      <th className="px-3 py-2 font-medium text-right">赠送额度</th>
                      <th className="px-3 py-2 font-medium text-center hidden sm:table-cell">状态</th>
                      <th className="px-3 py-2 font-medium text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((e) => (
                      <tr key={e.id} className="border-t border-slate-700/40 hover:bg-slate-800/50 transition-colors">
                        <td className="px-3 py-2.5">
                          <div className="font-medium text-slate-100">{e.name}</div>
                          <div className="text-xs text-slate-500 sm:hidden">
                            {e.phone ?? "未填写"}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 hidden sm:table-cell text-slate-300 text-xs">
                          {e.phone ?? <span className="text-slate-600">—</span>}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge className={cn("text-[10px]", positionColor(e.position))}>
                            {positionLabel(e.position)}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 hidden md:table-cell text-slate-300 text-xs">
                          {e.department ?? <span className="text-slate-600">—</span>}
                        </td>
                        <td className="px-3 py-2.5 hidden lg:table-cell">
                          <Badge variant="outline" className="bg-slate-700/40 border-slate-600/50 text-slate-300 text-[10px]">
                            <Shield className="h-2.5 w-2.5 mr-1" />
                            {roleLabel(e.role)}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <span className="font-mono text-amber-300">
                            {e.discount === 1 ? "原价" : `${(e.discount * 10).toFixed(1)}折`}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <div className="text-xs">
                            <span className="text-rose-300 font-mono">¥{e.usedGiftAmount.toFixed(0)}</span>
                            <span className="text-slate-500"> / </span>
                            <span className="text-slate-300 font-mono">¥{e.monthlyGiftLimit.toFixed(0)}</span>
                          </div>
                          <div className="text-[10px] text-slate-500">每月1号重置</div>
                        </td>
                        <td className="px-3 py-2.5 text-center hidden sm:table-cell">
                          {e.status === 1 ? (
                            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">在职</Badge>
                          ) : (
                            <Badge className="bg-slate-700/50 text-slate-400 border-slate-600/50 text-[10px]">离职</Badge>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { setEditing(e); setAdding(true); }}
                            className="h-7 w-7 p-0 text-slate-400 hover:text-sky-300 hover:bg-slate-700/50"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </DarkCard>

      {/* 入职审核 */}
      {joinApps.length > 0 && (
        <DarkCard>
          <CardHeader className="pb-3">
            <SectionTitle
              icon={UserPlus}
              title="入职审核"
              desc={`${joinApps.filter((a) => a.status === "pending").length} 条待审核`}
            />
          </CardHeader>
          <CardContent className="space-y-2">
            {joinApps.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-lg border border-slate-700/50 p-3 bg-slate-900/40">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-slate-100">{a.name}</span>
                    <Badge variant="outline" className="text-xs">{a.phone}</Badge>
                    <Badge variant="secondary" className="text-xs">
                      {a.position === "manager" ? "经理" : a.position === "cashier" ? "收银员" : a.position === "bartender" ? "吧台" : a.position === "chef" ? "厨房" : a.position === "marketing" ? "营销" : "服务员"}
                    </Badge>
                    <Badge variant={a.status === "pending" ? "secondary" : a.status === "approved" ? "default" : "destructive"}
                      className={a.status === "approved" ? "bg-emerald-600" : ""}>
                      {a.status === "pending" ? "待审核" : a.status === "approved" ? "已通过" : "已驳回"}
                    </Badge>
                  </div>
                  {a.status === "approved" && a.createdEmployeeId && (
                    <div className="text-xs text-emerald-400 mt-1">已生成员工账号</div>
                  )}
                </div>
                {a.status === "pending" && (
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" onClick={async () => {
                      try {
                        const res = await fetch(`/api/join-applications/${a.id}/audit`, {
                          method: "POST", headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ status: "approved", auditedBy: "admin" }),
                        });
                        const body = await res.json();
                        if (body.code === 200) {
                          toast({ title: "审核通过", description: `账号：${body.data.username} 密码：${body.data.password}` });
                          load();
                        } else toast({ title: "失败", description: body.msg, variant: "destructive" });
                      } catch (e) { toast({ title: "错误", description: String(e), variant: "destructive" }); }
                    }} className="bg-emerald-600 hover:bg-emerald-700 gap-1">
                      <CheckCircle className="h-3.5 w-3.5" /> 通过
                    </Button>
                    <Button size="sm" variant="outline" onClick={async () => {
                      try {
                        await fetch(`/api/join-applications/${a.id}/audit`, {
                          method: "POST", headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ status: "rejected", auditedBy: "admin" }),
                        });
                        toast({ title: "已驳回" });
                        load();
                      } catch (e) { toast({ title: "错误", description: String(e), variant: "destructive" }); }
                    }} className="border-red-700 text-red-400 hover:bg-red-950/40 gap-1">
                      <XCircle className="h-3.5 w-3.5" /> 驳回
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </DarkCard>
      )}

      {/* 生成入职码弹窗 */}
      <JoinQrDialog open={qrOpen} onClose={() => setQrOpen(false)} />

      <EmployeeDialog
        open={adding}
        editing={editing}
        onClose={() => {
          setAdding(false);
          setEditing(null);
        }}
        onSaved={() => {
          setAdding(false);
          setEditing(null);
          load();
        }}
      />
    </div>
  );
}

function EmployeeDialog({ open, editing, onClose, onSaved }: {
  open: boolean;
  editing: EmployeeInfo | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("waiter");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("cashier");
  const [discount, setDiscount] = useState(1);
  const [monthlyGiftLimit, setMonthlyGiftLimit] = useState(0);
  const [perms, setPerms] = useState<Record<string, boolean>>(defaultPermsByRole("cashier"));
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      if (editing) {
        setName(editing.name);
        setPhone(editing.phone ?? "");
        setPosition(editing.position);
        setDepartment(editing.department ?? "");
        setRole(editing.role);
        setDiscount(editing.discount);
        setMonthlyGiftLimit(editing.monthlyGiftLimit);
        setPerms(parsePerms(editing.permissions, editing.role));
      } else {
        setName("");
        setPhone("");
        setPosition("waiter");
        setDepartment("");
        setRole("cashier");
        setDiscount(1);
        setMonthlyGiftLimit(0);
        setPerms(defaultPermsByRole("cashier"));
      }
    }
  }, [open, editing]);

  // 切换角色时重置为该角色默认权限（用户可再手动调整）
  const handleRoleChange = (r: string) => {
    setRole(r);
    setPerms(defaultPermsByRole(r));
  };

  const togglePerm = (key: string) => {
    setPerms((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const save = async () => {
    if (!name.trim()) {
      toast({ title: "请填写姓名", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim() || null,
        position,
        department: department.trim() || null,
        role,
        discount: Number(discount),
        monthlyGiftLimit: Number(monthlyGiftLimit),
        permissions: JSON.stringify(perms),
      };
      if (editing) {
        await api.saveEmployee({ id: editing.id, ...payload });
        toast({ title: "员工已更新", description: name.trim() });
      } else {
        await api.saveEmployee(payload);
        toast({ title: "员工已入职", description: `${name.trim()} · ${positionLabel(position)}` });
      }
      onSaved();
    } catch (e) {
      toast({ title: "保存失败", description: String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-100">{editing ? "编辑员工" : "新建员工入职登记"}</DialogTitle>
          <DialogDescription className="text-slate-400">
            填写员工档案、岗位、权限角色、折扣率与月度赠送额度
          </DialogDescription>
        </DialogHeader>
        <div className="py-2 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-400">姓名</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：王经理"
                className="bg-slate-800/60 border-slate-700 text-slate-100 mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-400">电话</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="11 位手机号"
                className="bg-slate-800/60 border-slate-700 text-slate-100 mt-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-400">岗位</Label>
              <Select value={position} onValueChange={setPosition}>
                <SelectTrigger className="bg-slate-800/60 border-slate-700 text-slate-100 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                  {POSITION_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-slate-400">部门</Label>
              <Input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="如：前厅 / 后厨 / 营销部"
                className="bg-slate-800/60 border-slate-700 text-slate-100 mt-1"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs text-slate-400">权限角色</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {ROLE_OPTIONS.map((r) => {
                const active = role === r.value;
                return (
                  <button
                    key={r.value}
                    onClick={() => handleRoleChange(r.value)}
                    className={cn(
                      "rounded-md border-2 p-2 text-left transition-all",
                      active ? "border-emerald-500 bg-emerald-500/15" : "border-slate-700 bg-slate-800/50 hover:border-slate-600",
                    )}
                  >
                    <div className={cn("text-sm font-medium", active ? "text-emerald-300" : "text-slate-200")}>{r.label}</div>
                    <div className="text-xs text-slate-500">{r.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
          {/* 细粒度权限点 */}
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-slate-400">功能权限</Label>
              <span className="text-[10px] text-slate-500">切换角色会重置为默认，可逐项调整</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 mt-1">
              {PERM_POINTS.map((p) => {
                const on = !!perms[p.key];
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => togglePerm(p.key)}
                    className={cn(
                      "flex items-center justify-between rounded-md border px-2.5 py-1.5 text-left transition-all",
                      on ? "border-emerald-500/50 bg-emerald-500/10" : "border-slate-700 bg-slate-800/40",
                    )}
                  >
                    <div className="min-w-0">
                      <div className={cn("text-xs font-medium truncate", on ? "text-emerald-300" : "text-slate-300")}>{p.label}</div>
                      <div className="text-[10px] text-slate-500 truncate">{p.desc}</div>
                    </div>
                    <Switch checked={on} className="data-[state=checked]:bg-emerald-600 scale-90" />
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-400">折扣率（0-1）</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  step={0.05}
                  min={0}
                  max={1}
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="bg-slate-800/60 border-slate-700 text-slate-100"
                />
                <span className="text-xs text-slate-400 whitespace-nowrap">
                  {discount === 1 ? "原价" : `${(discount * 10).toFixed(1)}折`}
                </span>
              </div>
              <div className="flex gap-1.5 mt-2">
                {[1, 0.95, 0.9, 0.85, 0.8].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDiscount(d)}
                    className={cn(
                      "px-2 py-1 rounded text-xs border transition-colors",
                      discount === d
                        ? "border-emerald-500 bg-emerald-500/15 text-emerald-300"
                        : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600",
                    )}
                  >
                    {d === 1 ? "原价" : `${d * 10}折`}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs text-slate-400">每月赠送额度 ¥</Label>
              <Input
                type="number"
                min={0}
                value={monthlyGiftLimit}
                onChange={(e) => setMonthlyGiftLimit(Number(e.target.value))}
                className="bg-slate-800/60 border-slate-700 text-slate-100 mt-1"
              />
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <CalendarClock className="h-3 w-3" /> 每月1号自动重置
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-slate-300 hover:bg-slate-800">取消</Button>
          <Button onClick={save} disabled={saving || !name.trim()} className="bg-emerald-600 hover:bg-emerald-500 gap-1">
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : editing ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editing ? "保存" : "入职登记"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ Tab6: 出品点设置 ============

interface OutputPointInfo {
  id: string;
  storeId: number;
  deptCode: string;
  name: string;
  ip: string | null;
  printMode: string;
  relayServer: string | null;
  enabled: boolean;
  computerName: string | null;
}

function OutputPointsTab() {
  const [points, setPoints] = useState<OutputPointInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<OutputPointInfo | null>(null);
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPoints(await api.getOutputPoints());
    } catch (e) {
      toast({ title: "加载失败", description: String(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggle = async (p: OutputPointInfo, enabled: boolean) => {
    try {
      await api.saveOutputPoint({ id: p.id, enabled });
      toast({ title: enabled ? "已启用" : "已停用", description: p.name });
      load();
    } catch (e) {
      toast({ title: "操作失败", description: String(e), variant: "destructive" });
    }
  };

  return (
    <div className="pb-6 space-y-4">
      <DarkCard>
        <CardHeader className="pb-3">
          <SectionTitle
            icon={Server}
            title="出品点设置"
            desc="配置各出品部门（吧台/厨房/水果房）的内网IP、打印方式与中转服务器"
            action={
              <Button onClick={() => setAdding(true)} className="bg-emerald-600 hover:bg-emerald-500 gap-1">
                <Plus className="h-4 w-4" /> 新建出品点
              </Button>
            }
          />
          <div className="rounded-md border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs text-sky-200 flex items-start gap-2">
            <Network className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>网络打印机模式需要配置中转服务器地址，客户端模式只需本机安装打印机驱动</span>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingGrid count={3} />
          ) : points.length === 0 ? (
            <EmptyHint>暂无出品点，点击「新建出品点」开始配置</EmptyHint>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {points.map((p) => {
                const dept = OUTPUT_DEPTS.find((d) => d.value === p.deptCode);
                const DeptIcon = dept?.icon ?? Server;
                const mode = PRINT_MODE_OPTIONS.find((m) => m.value === p.printMode);
                return (
                  <DarkCard key={p.id} className={cn(!p.enabled && "opacity-60")}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={cn("rounded-md bg-slate-700/50 p-1.5 shrink-0", dept?.color)}>
                            <DeptIcon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <CardTitle className="text-base text-slate-100 truncate">{p.name}</CardTitle>
                            <CardDescription className="text-xs text-slate-400">
                              部门代码：{p.deptCode}
                            </CardDescription>
                          </div>
                        </div>
                        <Switch
                          checked={p.enabled}
                          onCheckedChange={(c) => handleToggle(p, c)}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">内网IP</span>
                        <span className="font-mono text-slate-200">{p.ip ?? "—"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">计算机名</span>
                        <span className="font-mono text-slate-200">{p.computerName ?? "—"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">打印方式</span>
                        <Badge className={cn(
                          "text-[10px]",
                          p.printMode === "network"
                            ? "bg-sky-500/20 text-sky-300 border-sky-500/30"
                            : "bg-slate-700/50 text-slate-300 border-slate-600/50",
                        )}>
                          {p.printMode === "network" ? <Network className="h-2.5 w-2.5 mr-1" /> : <Monitor className="h-2.5 w-2.5 mr-1" />}
                          {mode?.label ?? p.printMode}
                        </Badge>
                      </div>
                      {p.printMode === "network" && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">中转服务器</span>
                          <span className="font-mono text-emerald-300 truncate max-w-[150px]">{p.relayServer ?? "—"}</span>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="pt-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setEditing(p); setAdding(true); }}
                        className="w-full text-slate-300 hover:bg-slate-700/50 gap-1"
                      >
                        <Pencil className="h-3.5 w-3.5" /> 编辑
                      </Button>
                    </CardFooter>
                  </DarkCard>
                );
              })}
            </div>
          )}
        </CardContent>
      </DarkCard>

      <OutputPointDialog
        open={adding}
        editing={editing}
        onClose={() => {
          setAdding(false);
          setEditing(null);
        }}
        onSaved={() => {
          setAdding(false);
          setEditing(null);
          load();
        }}
      />
    </div>
  );
}

function OutputPointDialog({ open, editing, onClose, onSaved }: {
  open: boolean;
  editing: OutputPointInfo | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [deptCode, setDeptCode] = useState("bar");
  const [ip, setIp] = useState("");
  const [printMode, setPrintMode] = useState("client");
  const [relayServer, setRelayServer] = useState("");
  const [computerName, setComputerName] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      if (editing) {
        setName(editing.name);
        setDeptCode(editing.deptCode);
        setIp(editing.ip ?? "");
        setPrintMode(editing.printMode);
        setRelayServer(editing.relayServer ?? "");
        setComputerName(editing.computerName ?? "");
        setEnabled(editing.enabled);
      } else {
        setName("");
        setDeptCode("bar");
        setIp("");
        setPrintMode("client");
        setRelayServer("");
        setComputerName("");
        setEnabled(true);
      }
    }
  }, [open, editing]);

  const save = async () => {
    if (!name.trim()) {
      toast({ title: "请填写出品点名称", variant: "destructive" });
      return;
    }
    if (printMode === "network" && !relayServer.trim()) {
      toast({ title: "网络打印机模式需要填写中转服务器地址", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        deptCode,
        ip: ip.trim() || null,
        printMode,
        relayServer: printMode === "network" ? relayServer.trim() : null,
        computerName: computerName.trim() || null,
        enabled,
      };
      if (editing) {
        await api.saveOutputPoint({ id: editing.id, ...payload });
        toast({ title: "出品点已更新", description: name.trim() });
      } else {
        await api.saveOutputPoint(payload);
        toast({ title: "出品点已创建", description: name.trim() });
      }
      onSaved();
    } catch (e) {
      toast({ title: "保存失败", description: String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-slate-100">{editing ? "编辑出品点" : "新建出品点"}</DialogTitle>
          <DialogDescription className="text-slate-400">
            配置出品部门绑定、内网IP、打印方式与中转服务器
          </DialogDescription>
        </DialogHeader>
        <div className="py-2 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-400">出品点名称</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="如：吧台1"
                className="bg-slate-800/60 border-slate-700 text-slate-100 mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-400">部门代码</Label>
              <Select value={deptCode} onValueChange={setDeptCode}>
                <SelectTrigger className="bg-slate-800/60 border-slate-700 text-slate-100 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                  {OUTPUT_DEPTS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-400">内网IP</Label>
              <Input
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                placeholder="如：192.168.1.21"
                className="bg-slate-800/60 border-slate-700 text-slate-100 mt-1 font-mono"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-400">计算机名</Label>
              <Input
                value={computerName}
                onChange={(e) => setComputerName(e.target.value)}
                placeholder="如：JS-PC01"
                className="bg-slate-800/60 border-slate-700 text-slate-100 mt-1 font-mono"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs text-slate-400">打印方式</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {PRINT_MODE_OPTIONS.map((m) => {
                const active = printMode === m.value;
                const Icon = m.value === "network" ? Network : Monitor;
                return (
                  <button
                    key={m.value}
                    onClick={() => setPrintMode(m.value)}
                    className={cn(
                      "rounded-md border-2 p-2.5 text-left transition-all",
                      active ? "border-emerald-500 bg-emerald-500/15" : "border-slate-700 bg-slate-800/50 hover:border-slate-600",
                    )}
                  >
                    <div className={cn("flex items-center gap-1.5 text-sm font-medium", active ? "text-emerald-300" : "text-slate-200")}>
                      <Icon className="h-3.5 w-3.5" />
                      {m.label}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{m.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
          {printMode === "network" && (
            <div>
              <Label className="text-xs text-slate-400">中转服务器地址</Label>
              <Input
                value={relayServer}
                onChange={(e) => setRelayServer(e.target.value)}
                placeholder="如：http://192.168.1.100:9100"
                className="bg-slate-800/60 border-slate-700 text-slate-100 mt-1 font-mono"
              />
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <Network className="h-3 w-3" /> 网络打印机模式必填
              </div>
            </div>
          )}
          <div className="flex items-center justify-between rounded-md border border-slate-700 bg-slate-800/40 px-3 py-2">
            <div className="text-xs text-slate-300">启用此出品点</div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-slate-300 hover:bg-slate-800">取消</Button>
          <Button onClick={save} disabled={saving || !name.trim()} className="bg-emerald-600 hover:bg-emerald-500 gap-1">
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : editing ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editing ? "保存" : "创建"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ Tab7: 包厢设置 ============

interface RoomSettingInfo {
  id: string;
  roomNo: string;
  roomName: string;
  roomType: string;
  area: string | null;
  capacity: number;
  hourlyRate: number;
  minSpend: number;
  billingMode: string;
  packageId: string | null;
  roomIp: string | null;
  status: string;
}

function RoomsSettingsTab() {
  const [rooms, setRooms] = useState<RoomSettingInfo[]>([]);
  const [packages, setPackages] = useState<ProductInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<RoomSettingInfo | null>(null);
  const [deleting, setDeleting] = useState<RoomSettingInfo | null>(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, pros] = await Promise.all([api.getRoomsSettings(), api.getProducts()]);
      setRooms(r);
      setPackages(pros.filter((p) => p.isPackage));
    } catch (e) {
      toast({ title: "加载失败", description: String(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await api.deleteRoomSetting(deleting.id);
      toast({ title: "包厢已删除", description: `${deleting.roomNo} ${deleting.roomName}` });
      setDeleting(null);
      load();
    } catch (e) {
      toast({ title: "删除失败", description: String(e), variant: "destructive" });
    }
  };

  // 按区域分组
  const grouped = useMemo(() => {
    const groups: Record<string, RoomSettingInfo[]> = {};
    rooms.forEach((r) => {
      const k = r.area ?? "未分区";
      if (!groups[k]) groups[k] = [];
      groups[k].push(r);
    });
    return groups;
  }, [rooms]);

  return (
    <div className="pb-6 space-y-4">
      <DarkCard>
        <CardHeader className="pb-3">
          <SectionTitle
            icon={Building2}
            title="包厢设置"
            desc={`共 ${rooms.length} 间包厢 · 按区域分组管理 · 支持计费模式：计时/低消/开房套餐/免费`}
            action={
              <Button onClick={() => setAdding(true)} className="bg-emerald-600 hover:bg-emerald-500 gap-1">
                <Plus className="h-4 w-4" /> 添加包厢
              </Button>
            }
          />
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingGrid count={3} />
          ) : rooms.length === 0 ? (
            <EmptyHint>暂无包厢，点击「添加包厢」开始配置</EmptyHint>
          ) : (
            <div className="space-y-5">
              {Object.entries(grouped).map(([area, list]) => (
                <div key={area}>
                  <div className="flex items-center gap-2 mb-2.5">
                    <MapPin className="h-4 w-4 text-emerald-400" />
                    <h3 className="text-sm font-semibold text-slate-100">{area}</h3>
                    <Badge variant="outline" className="bg-slate-700/50 border-slate-600/50 text-slate-300">
                      {list.length} 间
                    </Badge>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {list.map((r) => (
                      <DarkCard key={r.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="rounded-md bg-emerald-500/15 p-1.5 shrink-0">
                                <Building2 className="h-4 w-4 text-emerald-400" />
                              </div>
                              <div className="min-w-0">
                                <CardTitle className="text-base text-slate-100 truncate">
                                  {r.roomNo} · {r.roomName}
                                </CardTitle>
                                <CardDescription className="text-xs text-slate-400">
                                  {r.roomType} · 容纳 {r.capacity} 人
                                </CardDescription>
                              </div>
                            </div>
                            <Badge className={cn("text-[10px]", billingColor(r.billingMode))}>
                              {billingLabel(r.billingMode)}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-1.5 text-xs">
                          {r.billingMode === "hourly" && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">每小时费率</span>
                              <span className="font-mono text-amber-300">¥{r.hourlyRate.toFixed(2)}</span>
                            </div>
                          )}
                          {r.billingMode === "minspend" && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">最低消费</span>
                              <span className="font-mono text-amber-300">¥{r.minSpend.toFixed(2)}</span>
                            </div>
                          )}
                          {r.billingMode === "package" && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">开房套餐</span>
                              <span className="text-emerald-300 truncate max-w-[150px]">
                                {packages.find((p) => p.id === r.packageId)?.name ?? "未设置"}
                              </span>
                            </div>
                          )}
                          {r.billingMode === "free" && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">计费</span>
                              <span className="text-emerald-300">免费使用</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">包厢IP</span>
                            <span className="font-mono text-slate-200">{r.roomIp ?? "—"}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">当前状态</span>
                            <Badge variant="outline" className="bg-slate-700/40 border-slate-600/50 text-slate-300 text-[10px]">
                              {r.status}
                            </Badge>
                          </div>
                        </CardContent>
                        <CardFooter className="pt-2 gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { setEditing(r); setAdding(true); }}
                            className="flex-1 text-slate-300 hover:bg-slate-700/50 gap-1"
                          >
                            <Pencil className="h-3.5 w-3.5" /> 编辑
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleting(r)}
                            className="text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 h-8 w-8 p-0"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </CardFooter>
                      </DarkCard>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </DarkCard>

      <RoomDialog
        open={adding}
        editing={editing}
        packages={packages}
        onClose={() => {
          setAdding(false);
          setEditing(null);
        }}
        onSaved={() => {
          setAdding(false);
          setEditing(null);
          load();
        }}
      />

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-700 text-slate-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-100">确认删除包厢？</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              将删除 {deleting?.roomNo} · {deleting?.roomName}，此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700">取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-rose-600 hover:bg-rose-500 text-white"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function RoomDialog({ open, editing, packages, onClose, onSaved }: {
  open: boolean;
  editing: RoomSettingInfo | null;
  packages: ProductInfo[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [roomNo, setRoomNo] = useState("");
  const [roomName, setRoomName] = useState("");
  const [roomType, setRoomType] = useState("中包");
  const [area, setArea] = useState("");
  const [capacity, setCapacity] = useState(6);
  const [hourlyRate, setHourlyRate] = useState(38);
  const [minSpend, setMinSpend] = useState(0);
  const [billingMode, setBillingMode] = useState("hourly");
  const [packageId, setPackageId] = useState<string>("");
  const [roomIp, setRoomIp] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      if (editing) {
        setRoomNo(editing.roomNo);
        setRoomName(editing.roomName);
        setRoomType(editing.roomType);
        setArea(editing.area ?? "");
        setCapacity(editing.capacity);
        setHourlyRate(editing.hourlyRate);
        setMinSpend(editing.minSpend);
        setBillingMode(editing.billingMode);
        setPackageId(editing.packageId ?? "");
        setRoomIp(editing.roomIp ?? "");
      } else {
        setRoomNo("");
        setRoomName("");
        setRoomType("中包");
        setArea("");
        setCapacity(6);
        setHourlyRate(38);
        setMinSpend(0);
        setBillingMode("hourly");
        setPackageId("");
        setRoomIp("");
      }
    }
  }, [open, editing]);

  const save = async () => {
    if (!roomNo.trim()) {
      toast({ title: "请填写房号", variant: "destructive" });
      return;
    }
    if (billingMode === "package" && !packageId) {
      toast({ title: "开房套餐模式必须选择一个套餐", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        roomNo: roomNo.trim(),
        roomName: roomName.trim() || roomNo.trim(),
        roomType,
        area: area.trim() || null,
        capacity: Number(capacity),
        hourlyRate: Number(hourlyRate),
        minSpend: Number(minSpend),
        billingMode,
        packageId: billingMode === "package" ? packageId : null,
        roomIp: roomIp.trim() || null,
      };
      if (editing) {
        await api.saveRoomSetting({ id: editing.id, ...payload });
        toast({ title: "包厢已更新", description: `${roomNo} · ${roomName || roomNo}` });
      } else {
        await api.saveRoomSetting(payload);
        toast({ title: "包厢已添加", description: `${roomNo} · ${roomName || roomNo}` });
      }
      onSaved();
    } catch (e) {
      toast({ title: "保存失败", description: String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-100">{editing ? "编辑包厢" : "添加包厢"}</DialogTitle>
          <DialogDescription className="text-slate-400">
            设置房号、类型、区域、计费模式与包厢IP
          </DialogDescription>
        </DialogHeader>
        <div className="py-2 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-400">房号</Label>
              <Input
                value={roomNo}
                onChange={(e) => setRoomNo(e.target.value)}
                placeholder="如：V01"
                className="bg-slate-800/60 border-slate-700 text-slate-100 mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-400">房名</Label>
              <Input
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="如：海洋大包"
                className="bg-slate-800/60 border-slate-700 text-slate-100 mt-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs text-slate-400">类型</Label>
              <Input
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                placeholder="如：中包 / VIP / 主题包"
                className="bg-slate-800/60 border-slate-700 text-slate-100 mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-400">区域</Label>
              <Input
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="如：A区"
                className="bg-slate-800/60 border-slate-700 text-slate-100 mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-400">容纳人数</Label>
              <Input
                type="number"
                min={1}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="bg-slate-800/60 border-slate-700 text-slate-100 mt-1"
              />
            </div>
          </div>
          <Separator className="bg-slate-700/60" />
          <div>
            <Label className="text-xs text-slate-400">计费模式</Label>
            <div className="grid grid-cols-4 gap-2 mt-1">
              {BILLING_MODE_OPTIONS.map((b) => {
                const active = billingMode === b.value;
                return (
                  <button
                    key={b.value}
                    onClick={() => setBillingMode(b.value)}
                    className={cn(
                      "rounded-md border-2 p-2 text-center transition-all",
                      active ? "border-emerald-500 bg-emerald-500/15" : "border-slate-700 bg-slate-800/50 hover:border-slate-600",
                    )}
                  >
                    <div className={cn("text-sm font-medium", active ? "text-emerald-300" : "text-slate-200")}>
                      {b.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          {billingMode === "hourly" && (
            <div>
              <Label className="text-xs text-slate-400">每小时费率 ¥</Label>
              <Input
                type="number"
                step={0.5}
                min={0}
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                className="bg-slate-800/60 border-slate-700 text-slate-100 mt-1"
              />
            </div>
          )}
          {billingMode === "minspend" && (
            <div>
              <Label className="text-xs text-slate-400">最低消费 ¥</Label>
              <Input
                type="number"
                step={10}
                min={0}
                value={minSpend}
                onChange={(e) => setMinSpend(Number(e.target.value))}
                className="bg-slate-800/60 border-slate-700 text-slate-100 mt-1"
              />
              <div className="text-xs text-slate-500 mt-1">不计入低消的物品点单后不影响达标判断</div>
            </div>
          )}
          {billingMode === "package" && (
            <div>
              <Label className="text-xs text-slate-400">开房套餐</Label>
              <Select value={packageId} onValueChange={setPackageId}>
                <SelectTrigger className="bg-slate-800/60 border-slate-700 text-slate-100 mt-1">
                  <SelectValue placeholder="选择套餐商品" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                  {packages.length === 0 ? (
                    <SelectItem value="_none" disabled>暂无套餐商品，请先在「物品管理」创建套餐</SelectItem>
                  ) : (
                    packages.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}（¥{p.packagePrice.toFixed(2)}）
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
          {billingMode === "free" && (
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
              免费模式：开房不收包厢费，仅按点单消费结算
            </div>
          )}
          <div>
            <Label className="text-xs text-slate-400">包厢IP</Label>
            <Input
              value={roomIp}
              onChange={(e) => setRoomIp(e.target.value)}
              placeholder="如：192.168.1.101"
              className="bg-slate-800/60 border-slate-700 text-slate-100 mt-1 font-mono"
            />
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <MapPin className="h-3 w-3" /> 用于对接点歌机
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-slate-300 hover:bg-slate-800">取消</Button>
          <Button onClick={save} disabled={saving || !roomNo.trim()} className="bg-emerald-600 hover:bg-emerald-500 gap-1">
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : editing ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editing ? "保存" : "添加"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ Tab8: 主题市场 + 房态显示字段 ============

function ThemesTab() {
  const [themes, setThemes] = useState<ThemeTemplateInfo[]>([]);
  const [displayConfigs, setDisplayConfigs] = useState<SysConfigInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [displayFields, setDisplayFields] = useState<Record<string, boolean>>({});
  const [savingFields, setSavingFields] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, d] = await Promise.all([
        api.getThemes(),
        api.getSysConfigs("display"),
      ]);
      setThemes(t);
      setDisplayConfigs(d);
      const raw = d.find((c) => c.configKey === "room_display_fields")?.configValue;
      if (raw) {
        try {
          setDisplayFields(JSON.parse(raw));
        } catch {
          setDisplayFields({});
        }
      }
    } catch (e) {
      toast({ title: "加载失败", description: String(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleApply = async (theme: ThemeTemplateInfo) => {
    setApplying(theme.id);
    try {
      const r = await api.applyTheme(theme.id);
      toast({
        title: "模板已应用",
        description: `${theme.name} · 类型 ${r.type} 已下发到 SysConfig`,
      });
      load();
    } catch (e) {
      toast({ title: "应用失败", description: String(e), variant: "destructive" });
    } finally {
      setApplying(null);
    }
  };

  const handleToggleField = (key: string, value: boolean) => {
    setDisplayFields((prev) => ({ ...prev, [key]: value }));
  };

  const saveDisplayFields = async () => {
    setSavingFields(true);
    try {
      await api.updateSysConfig("room_display_fields", JSON.stringify(displayFields));
      toast({ title: "显示字段已保存", description: "收银台房态看板将按此配置展示" });
      load();
    } catch (e) {
      toast({ title: "保存失败", description: String(e), variant: "destructive" });
    } finally {
      setSavingFields(false);
    }
  };

  const groupedThemes = useMemo(() => {
    const groups: Record<string, ThemeTemplateInfo[]> = {};
    themes.forEach((t) => {
      if (!groups[t.type]) groups[t.type] = [];
      groups[t.type].push(t);
    });
    return groups;
  }, [themes]);

  return (
    <div className="pb-6 space-y-5">
      <div>
        <div className="flex items-center justify-between mb-3">
          <SectionTitle
            icon={Palette}
            title="主题模板市场"
            desc="一键应用房态主题、商品包、账单/出品单模板与会员活动。也可保存当前配置为模板"
          />
          <div className="flex gap-2">
            <Button onClick={() => setAiOpen(true)} className="bg-violet-600 hover:bg-violet-500 gap-1">
              <Sparkles className="h-4 w-4" /> AI 设计师
            </Button>
            <Button onClick={() => setCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 gap-1">
              <Plus className="h-4 w-4" /> 创建模板
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-700 h-9">批量修改</Button>
              <Button variant="outline" size="sm" onClick={() => {
                const csv = "物品名称,单位,包房价,大厅价,会员价,成本价\n" + filteredProducts.map(p => `${p.name},${p.unit || "份"},${p.roomPrice ?? p.price},${p.hallPrice ?? p.price},${p.memberPrice ?? p.price},${p.costPrice ?? 0}`).join("\n");
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = "物品列表.csv";
                link.click();
              }} className="bg-blue-600/20 border-blue-500/30 text-blue-400 hover:bg-blue-600/30 h-9">导出</Button>
              <Button variant="outline" size="sm" className="bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-700 h-9">日志</Button>
              <Button variant="outline" size="sm" className="bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-700 h-9">排序</Button>
              <Button variant="ghost" onClick={load} className="text-slate-300 hover:bg-slate-700/50 gap-1 h-9">
                <RefreshCw className="h-3.5 w-3.5" /> 刷新
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingGrid count={3} className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3" />
        ) : themes.length === 0 ? (
          <EmptyHint>暂无主题模板</EmptyHint>
        ) : (
          <div className="space-y-5">
            {Object.entries(groupedThemes).map(([type, items]) => {
              const meta = THEME_TYPE_LABEL[type] ?? { label: type, icon: Package, color: "from-slate-700/30 to-slate-800/30" };
              const Icon = meta.icon;
              return (
                <div key={type}>
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className={cn("rounded-md bg-gradient-to-br p-1.5", meta.color)}>
                      <Icon className="h-4 w-4 text-slate-200" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-100">{meta.label}</h3>
                    <Badge variant="outline" className="bg-slate-700/50 border-slate-600/50 text-slate-300">
                      {items.length}
                    </Badge>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {items.map((t) => (
                      <ThemeCard
                        key={t.id}
                        theme={t}
                        meta={meta}
                        applying={applying === t.id}
                        onApply={() => handleApply(t)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Separator className="bg-slate-700/60" />

      <div>
        <SectionTitle
          icon={Settings2}
          title="房态显示字段"
          desc="勾选收银台房态看板需要展示的字段，保存后实时生效"
          action={
            <Button
              onClick={saveDisplayFields}
              disabled={savingFields}
              className="bg-emerald-600 hover:bg-emerald-500 gap-1"
            >
              {savingFields ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              保存配置
            </Button>
          }
        />
        <DarkCard>
          <CardContent className="p-4">
            {loading ? (
              <Skeleton className="h-24 w-full bg-slate-700/50" />
            ) : (
              <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                {DISPLAY_FIELDS.map((f) => (
                  <label
                    key={f.key}
                    htmlFor={`field-${f.key}`}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-lg border-2 px-3 py-2.5 cursor-pointer transition-all",
                      displayFields[f.key]
                        ? "border-emerald-500/60 bg-emerald-500/10"
                        : "border-slate-700 bg-slate-800/40 hover:border-slate-600",
                    )}
                  >
                    <span className={cn("text-sm", displayFields[f.key] ? "text-emerald-200" : "text-slate-400")}>
                      {f.label}
                    </span>
                    <Switch
                      id={`field-${f.key}`}
                      checked={!!displayFields[f.key]}
                      onCheckedChange={(c) => handleToggleField(f.key, c)}
                    />
                  </label>
                ))}
              </div>
            )}
            <div className="mt-3 text-xs text-slate-500">
              共 {DISPLAY_FIELDS.length} 个字段，已启用 {Object.values(displayFields).filter(Boolean).length} 个 · 更新于{" "}
              {fullTime(displayConfigs.find((c) => c.configKey === "room_display_fields")?.updatedAt ?? null)}
            </div>
          </CardContent>
        </DarkCard>
      </div>

      <CreateThemeDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={() => { setCreateOpen(false); load(); }} />
      <AiThemeDesigner open={aiOpen} onClose={() => setAiOpen(false)} onApplied={() => { setAiOpen(false); load(); }} />
    </div>
  );
}

function CreateThemeDialog({ open, onClose, onCreated }: {
  open: boolean; onClose: () => void; onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("room_theme");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const save = async () => {
    if (!name.trim()) { toast({ title: "请填写模板名称", variant: "destructive" }); return; }
    setSaving(true);
    try {
      let content = "{}";
      let storeId = 1001;
      try {
        const authStr = localStorage.getItem("ktv-auth");
        if (authStr) { const auth = JSON.parse(authStr); if (auth?.state?.user?.storeId) storeId = auth.state.user.storeId; }
      } catch {}

      if (type === "room_theme") {
        const res = await fetch(`/api/sys/config?category=room&storeId=${storeId}`);
        const body = await res.json();
        const colorsCfg = body.data?.find((c: any) => c.configKey === "room_status_colors");
        const colors = colorsCfg ? JSON.parse(colorsCfg.configValue) : {
          idle: "#059669", in_use: "#e11d48", checkout: "#eab308", cleaning: "#8b5cf6", maintenance: "#475569",
        };
        content = JSON.stringify({ bgColor: "#0f172a", cardBg: "#1e293b", colors });
      } else if (type === "bill_template") {
        content = JSON.stringify({ width: 58, fontSize: 12, showQrCode: true, showLogo: true, header: "欢迎光临", footer: "感谢惠顾" });
      } else if (type === "print_template") {
        content = JSON.stringify({ width: 58, showRoomNo: true, showFlavor: true, showTime: true, copies: 2 });
      } else if (type === "member_activity") {
        content = JSON.stringify([{ amount: 500, gift: 50 }, { amount: 1000, gift: 120 }]);
      }

      await api.createTheme({ type, name: name.trim(), description: desc.trim() || undefined, content });
      toast({ title: "模板已保存到市场", description: `${name.trim()} · 其他门店可下载使用` });
      onCreated();
    } catch (e) {
      toast({ title: "保存失败", description: String(e), variant: "destructive" });
    } finally { setSaving(false); }
  };

  const typeOptions = [
    { v: "room_theme", l: "房态主题", d: "保存当前房态配色" },
    { v: "bill_template", l: "账单模板", d: "保存账单格式" },
    { v: "print_template", l: "出品单模板", d: "保存出品单格式" },
    { v: "member_activity", l: "会员活动", d: "保存会员活动方案" },
    { v: "product_pack", l: "商品套餐包", d: "保存当前商品配置" },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-emerald-400" /> 创建模板
          </DialogTitle>
          <DialogDescription className="text-slate-400">将当前配置保存为模板，可分享给其他门店使用</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs text-slate-400">模板名称</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)}
              placeholder="如：我的专属配色"
              className="bg-slate-800/60 border-slate-700 text-slate-100 mt-1" />
          </div>
          <div>
            <Label className="text-xs text-slate-400">模板类型</Label>
            <div className="grid grid-cols-1 gap-2 mt-1">
              {typeOptions.map((t) => (
                <button key={t.v} onClick={() => setType(t.v)}
                  className={cn("flex items-center gap-3 rounded-lg border-2 p-2.5 text-left transition-all",
                    type === t.v ? "border-emerald-500 bg-emerald-500/15" : "border-slate-700 bg-slate-800/50 hover:border-slate-600")}>
                  <div className="flex-1">
                    <div className={cn("text-sm font-medium", type === t.v ? "text-emerald-300" : "text-slate-200")}>{t.l}</div>
                    <div className="text-xs text-slate-500">{t.d}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs text-slate-400">描述（可选）</Label>
            <Input value={desc} onChange={(e) => setDesc(e.target.value)}
              placeholder="简短描述"
              className="bg-slate-800/60 border-slate-700 text-slate-100 mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="bg-slate-800 border-slate-700 text-slate-300">取消</Button>
          <Button onClick={save} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 gap-1">
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "保存中..." : "保存到市场"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ AI 主题设计师 ============
function AiThemeDesigner({ open, onClose, onApplied }: {
  open: boolean; onClose: () => void; onApplied: () => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const presets = [
    "高端商务风，深蓝色调，金色点缀",
    "浪漫粉色系，适合情侣包厢",
    "赛博朋克霓虹风，紫绿对比色",
    "清新自然风，绿色系，放松舒适",
    "中国红喜庆风，红金搭配",
    "暗黑奢华风，黑金配色",
  ];

  const generate = async () => {
    if (!prompt.trim()) { toast({ title: "请描述你想要的风格", variant: "destructive" }); return; }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/ai/theme-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const body = await res.json();
      if (body.code === 200 && body.data) {
        setResult(body.data);
      } else {
        toast({ title: "AI 设计失败", description: body.msg || "请重试", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "网络错误", description: String(e), variant: "destructive" });
    } finally { setLoading(false); }
  };

  const apply = async () => {
    if (!result) return;
    setSaving(true);
    try {
      let storeId = 1001;
      try {
        const authStr = localStorage.getItem("ktv-auth");
        if (authStr) { const auth = JSON.parse(authStr); if (auth?.state?.user?.storeId) storeId = auth.state.user.storeId; }
      } catch {}
      // 批量保存所有视觉配置
      const configs: Record<string, string> = {
        room_status_colors: JSON.stringify(result.colors),
        page_bg_color: result.bgColor || "",
        card_bg_color: result.cardBg || "",
        text_color: result.textColor || "",
        theme_visual: JSON.stringify({
          borderColor: result.borderColor,
          borderRadius: result.borderRadius,
          boxShadow: result.boxShadow,
          glowEffect: result.glowEffect,
          cardBgGradient: result.cardBgGradient,
          headerBg: result.headerBg,
          sidebarBg: result.sidebarBg,
          accentColor: result.accentColor,
          roomShadow: result.roomShadow,
          roomBorder: result.roomBorder,
          textMuted: result.textMuted,
        }),
      };
      for (const [key, value] of Object.entries(configs)) {
        if (value) {
          await fetch("/api/sys/config", {
            method: "PUT",
            headers: { "Content-Type": "application/json", "X-Store-Id": String(storeId) },
            body: JSON.stringify({ configKey: key, configValue: value }),
          });
        }
      }
      // 保存为模板
      await api.createTheme({
        type: "room_theme",
        name: result.name || "AI设计主题",
        description: `AI生成: ${prompt}`,
        content: JSON.stringify(result),
      });
      toast({ title: "AI 主题已应用", description: "配色已下发，刷新页面查看效果" });
      onApplied();
    } catch (e) {
      toast({ title: "应用失败", description: String(e), variant: "destructive" });
    } finally { setSaving(false); }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-400" /> AI 主题设计师
          </DialogTitle>
          <DialogDescription className="text-slate-400">描述你想要的风格，AI 自动生成配色方案</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 输入区 */}
          <div>
            <Label className="text-xs text-slate-400">描述你想要的风格</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && generate()}
                placeholder="如：高端商务风，深蓝色调，金色点缀"
                className="bg-slate-800/60 border-slate-700 text-slate-100 flex-1"
              />
              <Button onClick={generate} disabled={loading} className="bg-violet-600 hover:bg-violet-500 gap-1">
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {loading ? "生成中..." : "生成"}
              </Button>
            </div>
            {/* 快捷预设 */}
            <div className="flex flex-wrap gap-2 mt-2">
              {presets.map((p) => (
                <button
                  key={p}
                  onClick={() => setPrompt(p)}
                  className="text-xs px-2.5 py-1 rounded-full border border-slate-700 bg-slate-800/60 text-slate-400 hover:text-violet-300 hover:border-violet-700/50 transition-all"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* 预览区 */}
          {result && (
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-100">{result.name}</div>
                  {result.description && <div className="text-xs text-slate-500 mt-0.5">{result.description}</div>}
                </div>
                <Button onClick={apply} disabled={saving} size="sm" className="bg-emerald-600 hover:bg-emerald-500 gap-1">
                  {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  应用并保存
                </Button>
              </div>

              {/* 背景预览 */}
              <div
                className="rounded-lg p-4 grid grid-cols-3 sm:grid-cols-5 gap-2"
                style={{ backgroundColor: result.bgColor || "#0f172a" }}
              >
                {Object.entries(result.colors || {}).map(([status, color]) => (
                  <div
                    key={status}
                    className="rounded-lg p-3 text-center"
                    style={{ backgroundColor: color as string, boxShadow: `0 4px 14px ${color}40` }}
                  >
                    <div className="text-white text-xs font-bold">{status}</div>
                    <div className="text-white/60 text-[10px] mt-0.5">{color as string}</div>
                  </div>
                ))}
              </div>

              {/* 文字颜色预览 */}
              {result.textColor && (
                <div className="rounded-lg p-3" style={{ backgroundColor: result.bgColor || "#0f172a" }}>
                  <div className="text-sm" style={{ color: result.textColor }}>
                    {result.textColor === "#ffffff" ? "白色文字" : "深色文字"} · 营业中 ¥3,280.00
                  </div>
                </div>
              )}

              {/* AI 建议 */}
              {result.tips && (
                <div className="text-xs text-slate-400 bg-slate-900/60 rounded-lg p-3 border border-slate-700/40">
                  💡 {result.tips}
                </div>
              )}
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center py-8">
              <Sparkles className="h-8 w-8 text-violet-400 animate-pulse mb-2" />
              <div className="text-sm text-slate-400">AI 正在设计配色方案...</div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ThemeCard({ theme, meta, applying, onApply }: {
  theme: ThemeTemplateInfo;
  meta: { label: string; icon: React.ComponentType<{ className?: string }>; color: string };
  applying: boolean;
  onApply: () => void;
}) {
  const seed = useMemo(() => theme.id.slice(-4), [theme.id]);

  return (
    <DarkCard className="overflow-hidden hover:border-emerald-500/50 transition-colors">
      <div className={cn("relative h-28 bg-gradient-to-br", meta.color)}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="grid grid-cols-4 gap-1 opacity-60">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-3 w-3 rounded-sm bg-slate-300/30"
                style={{ animationDelay: `${i * 50}ms` }}
              />
            ))}
          </div>
        </div>
        <div className="absolute top-2 right-2 flex gap-1">
          {theme.isOfficial && (
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
              <Shield className="h-3 w-3 mr-1" /> 官方
            </Badge>
          )}
        </div>
        <div className="absolute bottom-2 left-2 text-[10px] font-mono text-slate-400/60">
          #{seed}
        </div>
      </div>

      <CardContent className="p-3.5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="text-sm font-semibold text-slate-100 truncate">{theme.name}</h4>
        </div>
        <p className="text-xs text-slate-400 line-clamp-2 min-h-[2rem]">
          {theme.description ?? "—"}
        </p>
        <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {theme.useCount} 次应用
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {fullTime(theme.createdAt)}
          </span>
        </div>
      </CardContent>
      <CardFooter className="p-3.5 pt-0">
        <Button
          size="sm"
          onClick={onApply}
          disabled={applying}
          className="w-full bg-emerald-600 hover:bg-emerald-500 gap-1"
        >
          {applying ? (
            <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> 应用中</>
          ) : (
            <><Download className="h-3.5 w-3.5" /> 下载应用</>
          )}
        </Button>
      </CardFooter>
    </DarkCard>
  );
}

// ============ Tab9: 打印模板 ============

type PrintTemplate = {
  id: string;
  type: string;
  name: string;
  width: number;
  config: string;
  enabled: boolean;
  isActive: boolean;
  createdAt: string;
};

type TemplateConfig = {
  header?: string;
  footer?: string;
  showLogo?: boolean;
  showQrCode?: boolean;
  showRoomNo?: boolean;
  showFlavor?: boolean;
  showTime?: boolean;
  showQty?: boolean;
  showCustomer?: boolean;
  showManager?: boolean;
  showItems?: boolean;
  showSummary?: boolean;
  showMember?: boolean;
  fontSize?: number;
  copies?: number;
  fields?: string[];
};

const PRINT_TYPE_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  production: { label: "出品单", icon: ChefHat, color: "text-rose-400", bg: "bg-rose-500/15" },
  bill: { label: "账单", icon: Receipt, color: "text-sky-400", bg: "bg-sky-500/15" },
  reservation: { label: "预订单", icon: CalendarClock, color: "text-amber-400", bg: "bg-amber-500/15" },
  gift: { label: "赠送单", icon: Gift, color: "text-pink-400", bg: "bg-pink-500/15" },
};

const PRINT_TYPE_ORDER: Array<{ key: string; label: string }> = [
  { key: "production", label: "出品单" },
  { key: "bill", label: "账单" },
  { key: "reservation", label: "预订单" },
  { key: "gift", label: "赠送单" },
];

function parseTemplateConfig(raw: string | null | undefined): TemplateConfig {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as TemplateConfig;
  } catch {
    return {};
  }
}

function PrintTemplatesTab() {
  const [subTab, setSubTab] = useState<string>("production");
  const [templates, setTemplates] = useState<PrintTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PrintTemplate | null>(null);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.getPrintTemplates(subTab);
      setTemplates(list as PrintTemplate[]);
    } catch (e) {
      toast({ title: "加载失败", description: String(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [subTab, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSetActive = async (t: PrintTemplate) => {
    try {
      await api.savePrintTemplate({ id: t.id, isActive: true });
      toast({ title: "已设为当前使用", description: `${t.name}` });
      load();
    } catch (e) {
      toast({ title: "设置失败", description: String(e), variant: "destructive" });
    }
  };

  const handleDelete = async (t: PrintTemplate) => {
    if (!confirm(`确定删除模板「${t.name}」？此操作不可恢复。`)) return;
    try {
      await api.deletePrintTemplate(t.id);
      toast({ title: "已删除", description: t.name });
      load();
    } catch (e) {
      toast({ title: "删除失败", description: String(e), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4 pb-6">
      <SectionTitle
        icon={LayoutTemplate}
        title="打印模板管理"
        desc="管理出品单、账单、预订单、赠送单的打印模板。每个类型可创建多个模板，其中一个设为当前使用。"
        action={
          <Button size="sm" onClick={() => setCreating(true)} className="gap-1 bg-emerald-600 hover:bg-emerald-500">
            <Plus className="h-4 w-4" /> 新建模板
          </Button>
        }
      />

      {/* 子标签：4 种类型 */}
      <div className="flex flex-wrap gap-2 bg-slate-800/60 border border-slate-700/60 rounded-xl p-1.5">
        {PRINT_TYPE_ORDER.map((t) => {
          const meta = PRINT_TYPE_META[t.key];
          const active = subTab === t.key;
          const Icon = meta.icon;
          return (
            <button
              key={t.key}
              onClick={() => setSubTab(t.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all",
                active
                  ? "bg-slate-700 text-emerald-300 shadow"
                  : "text-slate-300 hover:bg-slate-700/50 hover:text-slate-100",
              )}
            >
              <Icon className={cn("h-4 w-4", active ? meta.color : "text-slate-400")} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* 模板列表 */}
      {loading ? (
        <LoadingGrid count={2} className="grid-cols-1 md:grid-cols-2" />
      ) : templates.length === 0 ? (
        <EmptyHint>暂无{PRINT_TYPE_META[subTab]?.label}模板，点击右上角「新建模板」创建</EmptyHint>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => {
            const cfg = parseTemplateConfig(t.config);
            const meta = PRINT_TYPE_META[t.type] ?? PRINT_TYPE_META.production;
            const Icon = meta.icon;
            return (
              <DarkCard key={t.id} className={cn("overflow-hidden", t.isActive && "border-emerald-500/60 ring-1 ring-emerald-500/30")}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={cn("rounded-md p-1.5 shrink-0", meta.bg)}>
                        <Icon className={cn("h-4 w-4", meta.color)} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-100 truncate">{t.name}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          纸宽 {t.width}mm · 字号 {cfg.fontSize ?? 12}px · {cfg.copies ?? 1} 份
                        </div>
                      </div>
                    </div>
                    {t.isActive && (
                      <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 shrink-0">
                        <Check className="h-3 w-3 mr-0.5" /> 当前使用
                      </Badge>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 mb-3 line-clamp-2">
                    {cfg.header ? `页眉：${cfg.header}` : "无页眉"} · {cfg.footer ? `页脚：${cfg.footer}` : "无页脚"}
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {cfg.showLogo && <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-300">Logo</span>}
                    {cfg.showQrCode && <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-300">二维码</span>}
                    {cfg.showRoomNo && <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-300">房号</span>}
                    {cfg.showFlavor && <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-300">口味</span>}
                    {cfg.showTime && <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-300">时间</span>}
                    {cfg.showQty && <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-300">数量</span>}
                  </div>
                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-700/50">
                    {!t.isActive && (
                      <Button size="sm" variant="outline" onClick={() => handleSetActive(t)} className="h-7 text-xs bg-slate-900/40 border-slate-700 text-emerald-300 hover:bg-emerald-600/20 hover:text-emerald-200 gap-1">
                        <Check className="h-3 w-3" /> 设为当前
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setEditing(t)} className="h-7 text-xs text-slate-300 hover:text-slate-100 hover:bg-slate-700/50 gap-1">
                      <Pencil className="h-3 w-3" /> 编辑
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(t)} className="h-7 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-600/10 ml-auto gap-1">
                      <Trash2 className="h-3 w-3" /> 删除
                    </Button>
                  </div>
                </CardContent>
              </DarkCard>
            );
          })}
        </div>
      )}

      {/* 编辑/新建弹窗 */}
      {(editing || creating) && (
        <PrintTemplateDesigner
          type={subTab}
          template={editing}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSaved={() => {
            setEditing(null);
            setCreating(false);
            load();
          }}
        />
      )}
    </div>
  );
}

// ============ 打印模板设计器弹窗 ============
function PrintTemplateDesigner({
  type,
  template,
  onClose,
  onSaved,
}: {
  type: string;
  template: PrintTemplate | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!template;
  const existingCfg = template ? parseTemplateConfig(template.config) : {};
  const [name, setName] = useState(template?.name ?? "");
  const [width, setWidth] = useState<number>(template?.width ?? 58);
  const [header, setHeader] = useState(existingCfg.header ?? "");
  const [footer, setFooter] = useState(existingCfg.footer ?? "");
  const [fontSize, setFontSize] = useState<number>(existingCfg.fontSize ?? 12);
  const [copies, setCopies] = useState<number>(existingCfg.copies ?? 1);
  const [showLogo, setShowLogo] = useState(existingCfg.showLogo ?? false);
  const [showQrCode, setShowQrCode] = useState(existingCfg.showQrCode ?? false);
  const [showRoomNo, setShowRoomNo] = useState(existingCfg.showRoomNo ?? true);
  const [showFlavor, setShowFlavor] = useState(existingCfg.showFlavor ?? true);
  const [showTime, setShowTime] = useState(existingCfg.showTime ?? true);
  const [showQty, setShowQty] = useState(existingCfg.showQty ?? true);
  const [showCustomer, setShowCustomer] = useState(existingCfg.showCustomer ?? true);
  const [showManager, setShowManager] = useState(existingCfg.showManager ?? true);
  const [showItems, setShowItems] = useState(existingCfg.showItems ?? true);
  const [showSummary, setShowSummary] = useState(existingCfg.showSummary ?? true);
  const [showMember, setShowMember] = useState(existingCfg.showMember ?? true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // 不同类型显示不同的开关
  const optionSwitches: Array<{ key: string; label: string; icon: React.ComponentType<{ className?: string }>; get: () => boolean; set: (v: boolean) => void }> = [];
  if (type === "production") {
    optionSwitches.push(
      { key: "logo", label: "显示 Logo", icon: ImageIcon, get: () => showLogo, set: setShowLogo },
      { key: "qr", label: "显示二维码", icon: QrCode, get: () => showQrCode, set: setShowQrCode },
      { key: "room", label: "显示房号", icon: Building2, get: () => showRoomNo, set: setShowRoomNo },
      { key: "flavor", label: "显示口味", icon: Sparkles, get: () => showFlavor, set: setShowFlavor },
      { key: "time", label: "显示时间", icon: Clock, get: () => showTime, set: setShowTime },
      { key: "qty", label: "显示数量", icon: Tag, get: () => showQty, set: setShowQty },
    );
  } else if (type === "bill") {
    optionSwitches.push(
      { key: "logo", label: "显示 Logo", icon: ImageIcon, get: () => showLogo, set: setShowLogo },
      { key: "qr", label: "显示二维码", icon: QrCode, get: () => showQrCode, set: setShowQrCode },
      { key: "room", label: "显示房号", icon: Building2, get: () => showRoomNo, set: setShowRoomNo },
      { key: "customer", label: "显示客户", icon: Users, get: () => showCustomer, set: setShowCustomer },
      { key: "manager", label: "显示经理", icon: UserCog, get: () => showManager, set: setShowManager },
      { key: "items", label: "显示明细", icon: FileText, get: () => showItems, set: setShowItems },
      { key: "summary", label: "显示合计", icon: TrendingUp, get: () => showSummary, set: setShowSummary },
      { key: "member", label: "显示会员", icon: Percent, get: () => showMember, set: setShowMember },
    );
  } else if (type === "reservation") {
    optionSwitches.push(
      { key: "logo", label: "显示 Logo", icon: ImageIcon, get: () => showLogo, set: setShowLogo },
      { key: "qr", label: "显示二维码", icon: QrCode, get: () => showQrCode, set: setShowQrCode },
    );
  } else if (type === "gift") {
    optionSwitches.push(
      { key: "logo", label: "显示 Logo", icon: ImageIcon, get: () => showLogo, set: setShowLogo },
      { key: "qr", label: "显示二维码", icon: QrCode, get: () => showQrCode, set: setShowQrCode },
      { key: "room", label: "显示房号", icon: Building2, get: () => showRoomNo, set: setShowRoomNo },
      { key: "time", label: "显示时间", icon: Clock, get: () => showTime, set: setShowTime },
    );
  }

  const buildConfig = (): string => {
    const cfg: TemplateConfig = {
      header, footer, fontSize, copies,
      showLogo, showQrCode,
    };
    if (type === "production") {
      cfg.showRoomNo = showRoomNo;
      cfg.showFlavor = showFlavor;
      cfg.showTime = showTime;
      cfg.showQty = showQty;
    } else if (type === "bill") {
      cfg.showRoomNo = showRoomNo;
      cfg.showCustomer = showCustomer;
      cfg.showManager = showManager;
      cfg.showItems = showItems;
      cfg.showSummary = showSummary;
      cfg.showMember = showMember;
    } else if (type === "gift") {
      cfg.showRoomNo = showRoomNo;
      cfg.showTime = showTime;
    }
    return JSON.stringify(cfg);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "请输入模板名称", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        type,
        name: name.trim(),
        width,
        config: buildConfig(),
        isActive: isEdit ? template!.isActive : false,
      };
      if (isEdit) payload.id = template!.id;
      await api.savePrintTemplate(payload);
      toast({ title: isEdit ? "模板已更新" : "模板已创建", description: name.trim() });
      onSaved();
    } catch (e) {
      toast({ title: "保存失败", description: String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // 预览宽度（按比例缩小到适合屏幕）
  const previewWidth = width === 80 ? 240 : 180;
  const meta = PRINT_TYPE_META[type] ?? PRINT_TYPE_META.production;
  const PreviewIcon = meta.icon;

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-100">
            <LayoutTemplate className="h-5 w-5 text-emerald-400" />
            {isEdit ? "编辑模板" : "新建模板"} · {meta.label}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            设计打印模板的版式与显示选项，左侧配置右侧实时预览
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-2">
          {/* 左：配置区 */}
          <div className="space-y-4">
            {/* 基本信息 */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">基本信息</div>
              <div>
                <Label className="text-xs text-slate-400 mb-1">模板名称</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="如 标准出品单" className="bg-slate-800 border-slate-700 text-slate-100" />
              </div>
              <div>
                <Label className="text-xs text-slate-400 mb-1">纸张宽度</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setWidth(58)}
                    className={cn(
                      "rounded-lg border-2 px-3 py-2 text-sm transition-all",
                      width === 58 ? "border-emerald-500 bg-emerald-500/15 text-emerald-300" : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600",
                    )}
                  >
                    58mm
                    <div className="text-[10px] text-slate-500 mt-0.5">热敏小票</div>
                  </button>
                  <button
                    onClick={() => setWidth(80)}
                    className={cn(
                      "rounded-lg border-2 px-3 py-2 text-sm transition-all",
                      width === 80 ? "border-emerald-500 bg-emerald-500/15 text-emerald-300" : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600",
                    )}
                  >
                    80mm
                    <div className="text-[10px] text-slate-500 mt-0.5">宽幅热敏</div>
                  </button>
                </div>
              </div>
            </div>

            {/* 页眉页脚 */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">页眉页脚</div>
              <div>
                <Label className="text-xs text-slate-400 mb-1">页眉文字</Label>
                <Input value={header} onChange={(e) => setHeader(e.target.value)} placeholder="如 天娱 KTV 出品单" className="bg-slate-800 border-slate-700 text-slate-100" />
              </div>
              <div>
                <Label className="text-xs text-slate-400 mb-1">页脚文字</Label>
                <Input value={footer} onChange={(e) => setFooter(e.target.value)} placeholder="如 感谢惠顾" className="bg-slate-800 border-slate-700 text-slate-100" />
              </div>
            </div>

            {/* 显示选项 */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">显示选项</div>
              <div className="grid grid-cols-2 gap-2 bg-slate-800/60 border border-slate-700/60 rounded-lg p-3">
                {optionSwitches.map((opt) => {
                  const Icon = opt.icon;
                  const checked = opt.get();
                  return (
                    <div key={opt.key} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Icon className={cn("h-3.5 w-3.5 shrink-0", checked ? "text-emerald-400" : "text-slate-500")} />
                        <span className="text-xs text-slate-300 truncate">{opt.label}</span>
                      </div>
                      <Switch checked={checked} onCheckedChange={opt.set} className="data-[state=checked]:bg-emerald-600 scale-90" />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 字号 + 份数 */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">字号与份数</div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs text-slate-400">字体大小</Label>
                  <span className="text-xs text-emerald-300 tabular-nums">{fontSize}px</span>
                </div>
                <input
                  type="range" min={9} max={18} step={1} value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-400 mb-1">打印份数</Label>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setCopies(Math.max(1, copies - 1))} className="h-8 w-8 p-0 bg-slate-800 border-slate-700 text-slate-200">−</Button>
                  <span className="text-lg font-bold text-emerald-300 tabular-nums w-8 text-center">{copies}</span>
                  <Button size="sm" variant="outline" onClick={() => setCopies(Math.min(9, copies + 1))} className="h-8 w-8 p-0 bg-slate-800 border-slate-700 text-slate-200">+</Button>
                  <span className="text-xs text-slate-500 ml-1">份</span>
                </div>
              </div>
            </div>
          </div>

          {/* 右：预览区 */}
          <div>
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">实时预览</div>
            <div className="bg-slate-950/80 border border-slate-700/60 rounded-lg p-4 flex justify-center">
              <div
                className="bg-white text-slate-900 shadow-xl"
                style={{
                  width: `${previewWidth}px`,
                  fontSize: `${Math.max(8, fontSize * 0.7)}px`,
                  padding: "8px 10px",
                  fontFamily: 'monospace, "PingFang SC"',
                  lineHeight: 1.5,
                }}
              >
                {/* 页眉 */}
                {showLogo && (
                  <div className="text-center border-b border-slate-300 pb-1 mb-1">
                    <div className="inline-block w-6 h-6 bg-slate-800 rounded-sm" />
                  </div>
                )}
                {header && (
                  <div className="text-center font-bold border-b border-slate-300 pb-1 mb-1" style={{ fontSize: `${fontSize * 0.85}px` }}>
                    {header}
                  </div>
                )}
                {/* 类型标识 */}
                <div className="text-center text-slate-500 mb-1" style={{ fontSize: `${fontSize * 0.6}px` }}>
                  —— {meta.label} ——
                </div>
                {/* 内容预览 */}
                <div className="space-y-0.5">
                  {type === "production" && (
                    <>
                      {showRoomNo && <div className="font-bold">房号: V08</div>}
                      {showTime && <div className="text-slate-600">时间: 19:42</div>}
                      <div className="border-t border-dashed border-slate-300 my-1" />
                      <div className="flex justify-between">
                        <span>青岛啤酒{showFlavor ? " (冰)" : ""}</span>
                        {showQty && <span>×2</span>}
                      </div>
                      <div className="flex justify-between">
                        <span>果盘</span>
                        {showQty && <span>×1</span>}
                      </div>
                    </>
                  )}
                  {type === "bill" && (
                    <>
                      <div className="font-bold">账单 #20260626001</div>
                      {showRoomNo && <div>房号: V08</div>}
                      {showCustomer && <div>客户: 张先生</div>}
                      {showManager && <div>经理: 王经理</div>}
                      <div className="border-t border-dashed border-slate-300 my-1" />
                      {showItems && (
                        <>
                          <div className="flex justify-between"><span>包厢费</span><span>¥120.00</span></div>
                          <div className="flex justify-between"><span>商品费</span><span>¥258.00</span></div>
                        </>
                      )}
                      {showSummary && (
                        <>
                          <div className="border-t border-dashed border-slate-300 my-1" />
                          <div className="flex justify-between font-bold"><span>合计</span><span>¥378.00</span></div>
                        </>
                      )}
                      {showMember && <div className="text-slate-600">会员: 13800000000</div>}
                    </>
                  )}
                  {type === "reservation" && (
                    <>
                      <div className="font-bold">客户: 李女士</div>
                      <div>电话: 138****1234</div>
                      <div>人数: 6 人</div>
                      <div>到店: 06-26 20:00</div>
                      <div>包厢: V08</div>
                    </>
                  )}
                  {type === "gift" && (
                    <>
                      {showRoomNo && <div className="font-bold">房号: V08</div>}
                      <div className="border-t border-dashed border-slate-300 my-1" />
                      <div className="flex justify-between">
                        <span>赠送青岛啤酒</span>
                        <span>×2</span>
                      </div>
                      <div className="text-slate-600">经理: 王经理</div>
                      {showTime && <div className="text-slate-600">时间: 19:42</div>}
                    </>
                  )}
                </div>
                {/* 页脚 */}
                {footer && (
                  <div className="text-center text-slate-600 border-t border-slate-300 mt-1 pt-1" style={{ fontSize: `${fontSize * 0.65}px` }}>
                    {footer}
                  </div>
                )}
                {showQrCode && (
                  <div className="text-center mt-1">
                    <div className="inline-block w-10 h-10 bg-slate-900" style={{ backgroundImage: "repeating-linear-gradient(0deg, #fff 0 2px, transparent 2px 4px), repeating-linear-gradient(90deg, #fff 0 2px, transparent 2px 4px)" }} />
                  </div>
                )}
              </div>
            </div>
            <div className="text-[10px] text-slate-500 text-center mt-2 flex items-center justify-center gap-1">
              <PreviewIcon className="h-3 w-3" />
              预览按 {width}mm 纸张比例显示，实际打印效果以打印机为准
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-700">
          <Button variant="outline" onClick={onClose} className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">
            取消
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-1 bg-emerald-600 hover:bg-emerald-500">
            {saving ? <><RefreshCw className="h-4 w-4 animate-spin" /> 保存中</> : <><Save className="h-4 w-4" /> 保存模板</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============ 生成入职二维码弹窗 ============
function JoinQrDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [data, setData] = useState<{ joinCode: string; joinUrl: string; storeName: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      let cancelled = false;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(true);
       
      setData(null);
      fetch("/api/join-code/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId: 1001 }),
      })
        .then((r) => r.json())
        .then((b) => {
          if (cancelled) return;
          if (b.code === 200) setData(b.data);
          else toast({ title: "生成失败", description: b.msg, variant: "destructive" });
        })
        .finally(() => { if (!cancelled) setLoading(false); });
      return () => { cancelled = true; };
    }
  }, [open]);

  const fullUrl = data ? `${window.location.origin}${data.joinUrl}` : "";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-slate-100 flex items-center gap-2">
            <QrCode className="h-5 w-5 text-emerald-400" /> 员工入职二维码
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            新员工用微信扫码即可填写入职信息
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 flex flex-col items-center">
          {loading ? (
            <div className="h-48 w-48 flex items-center justify-center text-slate-400">生成中...</div>
          ) : data ? (
            <>
              {/* 二维码（用 SVG 简易生成） */}
              <div className="bg-white p-4 rounded-xl mb-3">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(fullUrl)}`}
                  alt="入职二维码"
                  className="w-44 h-44"
                />
              </div>
              <div className="text-center mb-3">
                <div className="text-sm text-slate-300">入职码：<span className="font-mono font-bold text-emerald-400">{data.joinCode}</span></div>
                <div className="text-xs text-slate-500 mt-1">门店：{data.storeName}</div>
              </div>
              <div className="w-full rounded-lg bg-slate-900/60 p-2 text-xs text-slate-400 font-mono break-all border border-slate-700">
                {fullUrl}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="mt-3 gap-1 bg-slate-900/60 border-slate-700 text-slate-200"
                onClick={() => {
                  navigator.clipboard.writeText(fullUrl);
                  toast({ title: "链接已复制" });
                }}
              >
                复制入职链接
              </Button>
              <p className="text-xs text-slate-500 mt-3 text-center">
                员工扫码或打开链接 → 填写信息 → 您在「入职审核」中审核通过后生成账号
              </p>
            </>
          ) : (
            <div className="text-slate-400">生成失败</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
