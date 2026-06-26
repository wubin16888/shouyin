// 通用格式化与展示辅助

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** 货币格式化 */
export function yuan(n: number): string {
  return "¥" + n.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** 数字千分位 */
export function num(n: number): string {
  return n.toLocaleString("zh-CN");
}

/** 相对时间 */
export function relTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "刚刚";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)} 小时前`;
  if (diff < 86400_000 * 7) return `${Math.floor(diff / 86400_000)} 天前`;
  return d.toLocaleDateString("zh-CN");
}

/** 完整时间 */
export function fullTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** 时长（秒）格式化 */
export function duration(sec: number | null | undefined): string {
  if (sec == null) return "—";
  if (sec < 60) return `${sec} 秒`;
  if (sec < 3600) return `${Math.floor(sec / 60)} 分 ${sec % 60} 秒`;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h} 时 ${m} 分`;
}

/** 在线状态徽章 */
export function WsBadge({ status }: { status: "online" | "offline" }) {
  return (
    <Badge
      variant={status === "online" ? "default" : "destructive"}
      className={cn(
        "gap-1",
        status === "online" && "bg-emerald-600 hover:bg-emerald-600",
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        {status === "online" && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
        )}
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
      </span>
      {status === "online" ? "在线" : "离线"}
    </Badge>
  );
}

/** 同步状态徽章 */
export function SyncStatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: "default" | "destructive" | "secondary"; label: string; className?: string }> = {
    success: { variant: "default", label: "成功", className: "bg-emerald-600 hover:bg-emerald-600" },
    failed: { variant: "destructive", label: "失败" },
    pending: { variant: "secondary", label: "进行中" },
  };
  const c = map[status] ?? { variant: "secondary" as const, label: status };
  return <Badge variant={c.variant} className={c.className}>{c.label}</Badge>;
}

/** 冲突状态徽章 */
export function ConflictBadge({ status }: { status: string }) {
  return status === "pending" ? (
    <Badge variant="destructive" className="gap-1">
      <span className="h-1.5 w-1.5 rounded-full bg-white" />
      待处理
    </Badge>
  ) : (
    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
      已解决
    </Badge>
  );
}

/** 订单状态徽章 */
export function OrderStatusBadge({ status }: { status: number }) {
  const map: Record<number, { label: string; variant: "default" | "secondary" | "destructive"; className?: string }> = {
    1: { label: "待支付", variant: "secondary" },
    2: { label: "已支付", variant: "default", className: "bg-emerald-600 hover:bg-emerald-600" },
    3: { label: "已取消", variant: "destructive" },
  };
  const c = map[status] ?? { label: "未知", variant: "secondary" as const };
  return <Badge variant={c.variant} className={c.className}>{c.label}</Badge>;
}

/** 支付方式 */
export function payMethodLabel(m: string): string {
  const map: Record<string, string> = {
    cash: "现金",
    wechat: "微信",
    alipay: "支付宝",
    member: "会员卡",
    card: "银行卡",
  };
  return map[m] ?? m;
}

/** 操作类型中文 */
export function opTypeLabel(t: string): string {
  const map: Record<string, string> = {
    "config.update": "配置更新",
    "order.create": "创建订单",
    "order.refund": "订单退款",
    "store.toggle": "门店启停",
    "user.login": "用户登录",
    "user.logout": "用户登出",
    "member.recharge": "会员充值",
    "dish.update": "菜品更新",
    "sync.resolve": "冲突解决",
  };
  return map[t] ?? t;
}
