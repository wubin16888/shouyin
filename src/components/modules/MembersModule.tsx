// KTV 模块5：会员系统

"use client";

import { useEffect, useState } from "react";
import {
  RefreshCw,
  Search,
  Users,
  Wallet,
  Star,
  TrendingUp,
  Plus,
  CreditCard,
  History,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
import { api } from "@/lib/api";
import type { MemberInfo, MemberTransactionInfo } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { yuan, fullTime, relTime } from "@/components/common/format";

const LEVEL_META: Record<string, { color: string; badge: string }> = {
  普通会员: { color: "text-slate-600", badge: "bg-slate-100 text-slate-700" },
  银卡: { color: "text-slate-600", badge: "bg-slate-200 text-slate-700" },
  金卡: { color: "text-amber-600", badge: "bg-amber-100 text-amber-700" },
  钻石: { color: "text-purple-600", badge: "bg-purple-100 text-purple-700" },
};

export function MembersModule() {
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [selected, setSelected] = useState<MemberInfo | null>(null);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      setMembers(await api.getMembers(keyword));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [keyword]);

  const totalBalance = members.reduce((s, m) => s + m.balance, 0);
  const totalPoints = members.reduce((s, m) => s + m.points, 0);
  const totalSpent = members.reduce((s, m) => s + m.totalSpent, 0);

  return (
    <div className="space-y-4">
      {/* KPI */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">会员总数</span>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            {loading ? (
              <Skeleton className="h-7 w-12 mt-1" />
            ) : (
              <div className="text-2xl font-bold mt-0.5">{members.length}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">储值余额</span>
              <Wallet className="h-4 w-4 text-emerald-600" />
            </div>
            {loading ? (
              <Skeleton className="h-7 w-20 mt-1" />
            ) : (
              <div className="text-xl font-bold mt-0.5 text-emerald-600">
                {yuan(totalBalance)}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">总积分</span>
              <Star className="h-4 w-4 text-amber-500" />
            </div>
            {loading ? (
              <Skeleton className="h-7 w-16 mt-1" />
            ) : (
              <div className="text-xl font-bold mt-0.5">
                {totalPoints.toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">累计消费</span>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            {loading ? (
              <Skeleton className="h-7 w-20 mt-1" />
            ) : (
              <div className="text-xl font-bold mt-0.5">
                {yuan(totalSpent)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 搜索 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索会员（姓名/手机/卡号）..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={load} className="gap-1">
          <RefreshCw className="h-4 w-4" /> 刷新
        </Button>
      </div>

      {/* 会员列表 */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            {loading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                暂无会员
              </div>
            ) : (
              <div className="divide-y">
                {members.map((m) => {
                  const meta = LEVEL_META[m.level] ?? LEVEL_META["普通会员"];
                  return (
                    <div
                      key={m.id}
                      className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                      onClick={() => setSelected(m)}
                    >
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold shrink-0">
                        {m.name.slice(0, 1)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{m.name}</span>
                          <Badge variant="outline" className={meta.badge}>
                            {m.level}
                          </Badge>
                          {m.status !== 1 && (
                            <Badge variant="destructive">已冻结</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {m.cardNo} · {m.phone}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-semibold text-emerald-600">
                          {yuan(m.balance)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {m.points} 积分
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(m);
                          setRechargeOpen(true);
                        }}
                      >
                        <Plus className="h-3.5 w-3.5" /> 充值
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* 会员详情 */}
      <MemberDetailDialog
        member={selected}
        onClose={() => setSelected(null)}
        onRecharge={() => setRechargeOpen(true)}
      />

      {/* 充值弹窗 */}
      <RechargeDialog
        member={rechargeOpen ? selected : null}
        onClose={() => setRechargeOpen(false)}
        onDone={() => {
          setRechargeOpen(false);
          load();
        }}
      />
    </div>
  );
}

function MemberDetailDialog({
  member,
  onClose,
  onRecharge,
}: {
  member: MemberInfo | null;
  onClose: () => void;
  onRecharge: () => void;
}) {
  const [txs, setTxs] = useState<MemberTransactionInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!member) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
     
    setTxs([]);
    api
      .getMemberTransactions(member.id)
      .then((data) => {
        if (!cancelled) setTxs(data);
      })
      .catch(() => {
        if (!cancelled) setTxs([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [member]);

  if (!member) return null;
  const meta = LEVEL_META[member.level] ?? LEVEL_META["普通会员"];

  return (
    <Dialog open={!!member} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold">
              {member.name.slice(0, 1)}
            </div>
            <div>
              <div>{member.name}</div>
              <div className="text-xs text-muted-foreground font-normal">
                {member.cardNo} · {member.phone}
              </div>
            </div>
            <Badge variant="outline" className={meta.badge}>
              {member.level}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3 py-2">
          <div className="rounded-lg border p-3 text-center">
            <div className="text-xs text-muted-foreground">余额</div>
            <div className="text-lg font-bold text-emerald-600">
              {yuan(member.balance)}
            </div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-xs text-muted-foreground">积分</div>
            <div className="text-lg font-bold">{member.points}</div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-xs text-muted-foreground">累计消费</div>
            <div className="text-lg font-bold">{yuan(member.totalSpent)}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">折扣率：</span>
          <Badge variant="outline">
            {member.discount < 1 ? `${member.discount * 10} 折` : "不打折"}
          </Badge>
          <span className="text-muted-foreground ml-auto">
            入会 {fullTime(member.createdAt)}
          </span>
        </div>

        <Separator />

        <div>
          <div className="flex items-center gap-2 mb-2">
            <History className="h-4 w-4" />
            <span className="font-medium text-sm">交易记录</span>
          </div>
          <ScrollArea className="h-48">
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : txs.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                暂无交易记录
              </div>
            ) : (
              <div className="space-y-1">
                {txs.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-2 text-sm border rounded p-2"
                  >
                    <Badge
                      variant="outline"
                      className={
                        t.type === "recharge"
                          ? "text-emerald-600"
                          : t.type === "consume"
                          ? "text-rose-600"
                          : "text-blue-600"
                      }
                    >
                      {t.type === "recharge" ? "充值" : t.type === "consume" ? "消费" : "退款"}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs">
                        {t.remark ?? "—"}
                        {t.relatedOrderNo && ` · ${t.relatedOrderNo}`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {fullTime(t.createdAt)} · 余额 {yuan(t.balanceAfter)}
                      </div>
                    </div>
                    <div
                      className={`font-semibold ${
                        t.amount > 0 ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {t.amount > 0 ? "+" : ""}
                      {yuan(t.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            关闭
          </Button>
          <Button
            className="gap-1 bg-emerald-600 hover:bg-emerald-700"
            onClick={onRecharge}
          >
            <CreditCard className="h-4 w-4" /> 充值
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RechargeDialog({
  member,
  onClose,
  onDone,
}: {
  member: MemberInfo | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState("500");
  const [payMethod, setPayMethod] = useState("cash");
  const [remark, setRemark] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (member) {
      setAmount("500");
      setPayMethod("cash");
      setRemark("");
    }
  }, [member]);

  const submit = async () => {
    if (!member) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast({ title: "请输入有效金额", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await api.rechargeMember(member.id, amt, payMethod, remark);
      toast({
        title: "充值成功",
        description: `${member.name} +${yuan(amt)}`,
      });
      onDone();
    } catch (e) {
      toast({ title: "充值失败", description: String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!member} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>会员充值</DialogTitle>
          <DialogDescription>
            {member?.name} · 当前余额 {member ? yuan(member.balance) : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>充值金额</Label>
            <Input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <div className="flex gap-2 mt-2">
              {[100, 300, 500, 1000, 2000, 5000].map((a) => (
                <Button
                  key={a}
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setAmount(String(a))}
                >
                  {a}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <Label>支付方式</Label>
            <Select value={payMethod} onValueChange={setPayMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">现金</SelectItem>
                <SelectItem value="wechat">微信</SelectItem>
                <SelectItem value="alipay">支付宝</SelectItem>
                <SelectItem value="card">银行卡</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>备注（可选）</Label>
            <Input
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="如：活动赠送"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button
            onClick={submit}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {saving ? "充值中..." : `确认充值 ${yuan(Number(amount) || 0)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
