// KTV 模块3：开台结账

"use client";

import { useEffect, useState, useMemo } from "react";
import {
  RefreshCw,
  CreditCard,
  Receipt,
  Clock,
  CheckCircle2,
  User,
  Phone,
  Search,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import type { KtvOrderInfoV2, MemberInfo } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { yuan, fullTime, relTime } from "@/components/common/format";

export function KtvCheckoutModule() {
  const [orders, setOrders] = useState<KtvOrderInfoV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutOrder, setCheckoutOrder] = useState<KtvOrderInfoV2 | null>(null);
  const [autoCheckoutId, setAutoCheckoutId] = useState<string | null>(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      setOrders(await api.getKtvOrders("open"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  // 监听来自包厢看板的"去结账"事件
  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent).detail as string;
      setAutoCheckoutId(id);
    };
    window.addEventListener("ktv-checkout", handler);
    return () => window.removeEventListener("ktv-checkout", handler);
  }, []);

  // 自动打开结账弹窗
  useEffect(() => {
    if (autoCheckoutId) {
      const order = orders.find((o) => o.id === autoCheckoutId);
      if (order) {
        setCheckoutOrder(order);
        setAutoCheckoutId(null);
      }
    }
  }, [autoCheckoutId, orders]);

  if (!loading && orders.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <CheckCircle2 className="h-12 w-12 mb-3 opacity-30" />
          <p className="font-medium">暂无待结账订单</p>
          <p className="text-sm mt-1">所有进行中的包厢都已结账 🎉</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          进行中的包厢订单 · 每 15 秒自动刷新计时
        </p>
        <Button variant="outline" size="sm" onClick={load} className="gap-1">
          <RefreshCw className="h-4 w-4" /> 刷新
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {orders.map((o) => {
            const elapsed = Math.floor(
              (Date.now() - new Date(o.openedAt).getTime()) / 60000,
            );
            const roomFee = Math.round(
              o.hourlyRate * (elapsed / 60) * 100,
            ) / 100;
            const total = roomFee + o.productFee;
            return (
              <Card key={o.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{o.roomNo}</span>
                        <Badge variant="outline">{o.roomType}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {o.customerName || "散客"} · {o.customerCount} 人
                      </div>
                    </div>
                    <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">
                      <Clock className="h-3 w-3 mr-1" />
                      {elapsed} 分钟
                    </Badge>
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">开台时间</span>
                      <span>{fullTime(o.openedAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">包厢费率</span>
                      <span>{yuan(o.hourlyRate)}/小时</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">商品消费</span>
                      <span>{yuan(o.productFee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">包厢费(实时)</span>
                      <span>{yuan(roomFee)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold">
                      <span>合计(实时)</span>
                      <span className="text-emerald-600 text-lg">{yuan(total)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      className="flex-1 gap-1 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => setCheckoutOrder(o)}
                    >
                      <CreditCard className="h-3.5 w-3.5" /> 结账
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={async () => {
                        if (!confirm(`确认取消 ${o.roomNo} 的订单？`)) return;
                        try {
                          await api.cancelOrder(o.id);
                          toast({ title: "订单已取消" });
                          load();
                        } catch (e) {
                          toast({ title: "取消失败", description: String(e), variant: "destructive" });
                        }
                      }}
                    >
                      取消
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 结账弹窗 */}
      <CheckoutDialog
        order={checkoutOrder}
        onClose={() => setCheckoutOrder(null)}
        onDone={() => {
          setCheckoutOrder(null);
          load();
        }}
      />
    </div>
  );
}

function CheckoutDialog({
  order,
  onClose,
  onDone,
}: {
  order: KtvOrderInfoV2 | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [payMethod, setPayMethod] = useState("cash");
  const [memberPhone, setMemberPhone] = useState("");
  const [member, setMember] = useState<MemberInfo | null>(null);
  const [searchingMember, setSearchingMember] = useState(false);
  const [paying, setPaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<KtvOrderInfoV2 | null>(null);
  const { toast } = useToast();

  // 实时计时
  useEffect(() => {
    if (!order) return;
    const update = () =>
      setElapsed(Math.floor((Date.now() - new Date(order.openedAt).getTime()) / 60000));
    update();
    const t = setInterval(update, 30000);
    return () => clearInterval(t);
  }, [order]);

  // 重置
  useEffect(() => {
    if (order) {
      setPayMethod("cash");
      setMemberPhone("");
      setMember(null);
      setResult(null);
    }
  }, [order]);

  const roomFee = order
    ? Math.round(order.hourlyRate * (elapsed / 60) * 100) / 100
    : 0;
  const productFee = order?.productFee ?? 0;
  const discount = member
    ? Math.round(productFee * (1 - member.discount) * 100) / 100
    : 0;
  const total = Math.round((roomFee + productFee - discount) * 100) / 100;

  const searchMember = async () => {
    if (!memberPhone) return;
    setSearchingMember(true);
    try {
      const m = await api.getMemberByPhone(memberPhone);
      if (m) {
        setMember(m);
        toast({ title: `找到会员：${m.name}`, description: `${m.level} · 折扣 ${m.discount * 10} 折` });
      } else {
        toast({ title: "未找到会员", variant: "destructive" });
        setMember(null);
      }
    } finally {
      setSearchingMember(false);
    }
  };

  const doCheckout = async () => {
    if (!order) return;
    if (payMethod === "member" && (!member || member.balance < total)) {
      toast({
        title: "无法使用会员卡支付",
        description: member ? `余额不足（${yuan(member.balance)} < ${yuan(total)}）` : "请先查找会员",
        variant: "destructive",
      });
      return;
    }
    setPaying(true);
    try {
      const res = await api.checkoutOrder(order.id, {
        payMethod,
        memberId: member?.id,
      });
      setResult(res as KtvOrderInfoV2);
      toast({ title: "结账成功", description: `${order.roomNo} · ${yuan(res.totalAmount)}` });
    } catch (e) {
      toast({ title: "结账失败", description: String(e), variant: "destructive" });
    } finally {
      setPaying(false);
    }
  };

  if (!order) return null;

  // 结账成功结果显示
  if (result) {
    return (
      <Dialog open={!!order} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
              结账成功
            </DialogTitle>
            <DialogDescription>订单已结算，包厢已转为清扫中</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm py-2">
            <Row label="订单号" value={result.orderNo} mono />
            <Row label="包厢" value={`${result.roomNo} ${result.roomType}`} />
            <Row label="时长" value={`${result.durationMinutes} 分钟`} />
            <Row label="包厢费" value={yuan(result.roomFee)} />
            <Row label="商品费" value={yuan(result.productFee)} />
            {result.discount > 0 && (
              <Row label="会员折扣" value={`-${yuan(result.discount)}`} className="text-emerald-600" />
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>实付</span>
              <span className="text-emerald-600">{yuan(result.totalAmount)}</span>
            </div>
            <Row label="支付方式" value={payMethodLabel(result.payMethod)} />
          </div>
          <DialogFooter>
            <Button onClick={onDone}>完成</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={!!order} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            结账 · {order.roomNo} {order.roomType}
          </DialogTitle>
          <DialogDescription>
            {order.customerName || "散客"} · {order.customerCount} 人 ·{" "}
            {fullTime(order.openedAt)} 开台
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* 费用明细 */}
          <div className="rounded-lg border p-3 space-y-2 text-sm">
            <Row label={`时长（${elapsed} 分钟）`} value={fullTime(order.openedAt)} small />
            <Row label="包厢费" value={yuan(roomFee)} />
            <Row label="商品消费" value={yuan(productFee)} />
            {discount > 0 && (
              <Row label={`会员折扣 (${member?.discount * 10} 折)`} value={`-${yuan(discount)}`} className="text-emerald-600" />
            )}
            <Separator />
            <div className="flex justify-between font-bold text-base">
              <span>应付</span>
              <span className="text-emerald-600">{yuan(total)}</span>
            </div>
          </div>

          {/* 会员查找 */}
          <div>
            <Label className="text-xs text-muted-foreground">会员（可选，享折扣/积分）</Label>
            <div className="flex gap-2 mt-1">
              <div className="relative flex-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="手机号"
                  value={memberPhone}
                  onChange={(e) => setMemberPhone(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={searchMember}
                disabled={searchingMember}
                className="gap-1"
              >
                <Search className="h-3.5 w-3.5" />
                {searchingMember ? "查找中" : "查找"}
              </Button>
            </div>
            {member && (
              <div className="mt-2 rounded-md bg-emerald-50 dark:bg-emerald-950/30 p-2 text-xs flex items-center justify-between">
                <div>
                  <span className="font-medium">{member.name}</span>
                  <span className="text-muted-foreground ml-2">
                    {member.level} · 余额 {yuan(member.balance)} · 积分 {member.points}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-xs"
                  onClick={() => setMember(null)}
                >
                  移除
                </Button>
              </div>
            )}
          </div>

          {/* 支付方式 */}
          <div>
            <Label className="text-xs text-muted-foreground">支付方式</Label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {["cash", "wechat", "alipay", "member", "card"].map((m) => (
                <Button
                  key={m}
                  size="sm"
                  variant={payMethod === m ? "default" : "outline"}
                  className={payMethod === m ? "bg-emerald-600 hover:bg-emerald-600" : ""}
                  onClick={() => setPayMethod(m)}
                  disabled={m === "member" && !member}
                >
                  {payMethodLabel(m)}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button
            onClick={doCheckout}
            disabled={paying}
            className="gap-1 bg-emerald-600 hover:bg-emerald-700"
          >
            {paying ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" /> 结账中
              </>
            ) : (
              <>
                <Receipt className="h-4 w-4" /> 确认结账 {yuan(total)}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({
  label,
  value,
  mono,
  small,
  className,
}: {
  label: string;
  value: string;
  mono?: boolean;
  small?: boolean;
  className?: string;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={`${mono ? "font-mono text-xs" : small ? "text-xs" : ""} ${className ?? ""}`}
      >
        {value}
      </span>
    </div>
  );
}

function payMethodLabel(m: string | null): string {
  const map: Record<string, string> = {
    cash: "现金",
    wechat: "微信",
    alipay: "支付宝",
    member: "会员卡",
    card: "银行卡",
  };
  return m ? map[m] ?? m : "—";
}
