// KTV 模块4：预订管理

"use client";

import { useEffect, useState } from "react";
import {
  RefreshCw,
  CalendarClock,
  Phone,
  Users,
  Plus,
  CheckCircle2,
  XCircle,
  LogIn,
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
import { Textarea } from "@/components/ui/textarea";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import type { KtvReservationInfo, KtvRoomInfo } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { fullTime, relTime } from "@/components/common/format";

const STATUS_META: Record<
  KtvReservationInfo["status"],
  { label: string; variant: "default" | "secondary" | "destructive"; className?: string }
> = {
  pending: { label: "待确认", variant: "secondary" },
  confirmed: { label: "已确认", variant: "default", className: "bg-blue-500 hover:bg-blue-500" },
  arrived: { label: "已到店", variant: "default", className: "bg-emerald-600 hover:bg-emerald-600" },
  cancelled: { label: "已取消", variant: "destructive" },
  noshow: { label: "未到", variant: "destructive" },
};

export function KtvReservationsModule() {
  const [reservations, setReservations] = useState<KtvReservationInfo[]>([]);
  const [rooms, setRooms] = useState<KtvRoomInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [r, rms] = await Promise.all([
        api.getReservations(),
        api.getKtvRooms(),
      ]);
      setReservations(r);
      setRooms(rms);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.updateReservationStatus(id, status);
      toast({ title: "状态已更新" });
      load();
    } catch (e) {
      toast({ title: "操作失败", description: String(e), variant: "destructive" });
    }
  };

  const filtered =
    filter === "all"
      ? reservations
      : reservations.filter((r) => r.status === filter);

  const counts = {
    all: reservations.length,
    pending: reservations.filter((r) => r.status === "pending").length,
    confirmed: reservations.filter((r) => r.status === "confirmed").length,
    arrived: reservations.filter((r) => r.status === "arrived").length,
    cancelled: reservations.filter((r) => r.status === "cancelled").length,
  };

  return (
    <div className="space-y-4">
      {/* 顶部操作 */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {[
            { k: "all", label: "全部" },
            { k: "pending", label: "待确认" },
            { k: "confirmed", label: "已确认" },
            { k: "arrived", label: "已到店" },
            { k: "cancelled", label: "已取消" },
          ].map((t) => (
            <Button
              key={t.k}
              size="sm"
              variant={filter === t.k ? "default" : "outline"}
              onClick={() => setFilter(t.k)}
              className={filter === t.k ? "bg-emerald-600 hover:bg-emerald-600" : ""}
            >
              {t.label}
              <Badge variant="outline" className="ml-2 bg-background">
                {counts[t.k as keyof typeof counts]}
              </Badge>
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} className="gap-1">
            <RefreshCw className="h-4 w-4" /> 刷新
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1 bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4" /> 新建预订
          </Button>
        </div>
      </div>

      {/* 预订列表 */}
      {loading ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <CalendarClock className="h-12 w-12 mb-3 opacity-30" />
            <p>暂无预订记录</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => {
            const meta = STATUS_META[r.status];
            return (
              <Card key={r.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold">{r.customerName}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3" />
                        {r.phone}
                      </div>
                    </div>
                    <Badge variant={meta.variant} className={meta.className}>
                      {meta.label}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        人数
                      </span>
                      <span className="font-medium">{r.partySize} 人</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">开始</span>
                      <span>{fullTime(r.startAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">结束</span>
                      <span>{fullTime(r.endAt)}</span>
                    </div>
                    {r.roomNo && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">预留包厢</span>
                        <Badge variant="outline">{r.roomNo}</Badge>
                      </div>
                    )}
                    {r.remark && (
                      <div className="text-xs text-muted-foreground bg-muted rounded p-2 mt-2">
                        {r.remark}
                      </div>
                    )}
                  </div>

                  {r.status === "pending" && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-1 text-blue-600"
                        onClick={() => updateStatus(r.id, "confirmed")}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> 确认
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-red-500"
                        onClick={() => updateStatus(r.id, "cancelled")}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                  {r.status === "confirmed" && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        className="flex-1 gap-1 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => updateStatus(r.id, "arrived")}
                      >
                        <LogIn className="h-3.5 w-3.5" /> 已到店
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-red-500"
                        onClick={() => updateStatus(r.id, "noshow")}
                      >
                        未到
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 新建预订弹窗 */}
      <CreateReservationDialog
        open={createOpen}
        rooms={rooms}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false);
          load();
        }}
      />
    </div>
  );
}

function CreateReservationDialog({
  open,
  rooms,
  onClose,
  onCreated,
}: {
  open: boolean;
  rooms: KtvRoomInfo[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [partySize, setPartySize] = useState("4");
  const [roomNo, setRoomNo] = useState("none");
  const [startAt, setStartAt] = useState("");
  const [duration, setDuration] = useState("3");
  const [remark, setRemark] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const submit = async () => {
    if (!customerName || !phone || !startAt) {
      toast({ title: "请填写必填项", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const start = new Date(startAt);
      const end = new Date(start.getTime() + Number(duration) * 3600000);
      await api.createReservation({
        customerName,
        phone,
        partySize: Number(partySize),
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        roomNo: roomNo === "none" ? undefined : roomNo,
        remark: remark || undefined,
      });
      toast({ title: "预订已创建" });
      setCustomerName("");
      setPhone("");
      setPartySize("4");
      setRoomNo("none");
      setRemark("");
      onCreated();
    } catch (e) {
      toast({ title: "创建失败", description: String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // 默认开始时间为当前+1小时整点
  useEffect(() => {
    if (open && !startAt) {
      const d = new Date();
      d.setHours(d.getHours() + 1, 0, 0, 0);
      setStartAt(d.toISOString().slice(0, 16));
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>新建预订</DialogTitle>
          <DialogDescription>登记客户预订信息</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>客户姓名 *</Label>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </div>
            <div>
              <Label>手机号 *</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>人数</Label>
              <Input
                type="number"
                min={1}
                value={partySize}
                onChange={(e) => setPartySize(e.target.value)}
              />
            </div>
            <div>
              <Label>预留包厢</Label>
              <Select value={roomNo} onValueChange={setRoomNo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">不指定</SelectItem>
                  {rooms.map((r) => (
                    <SelectItem key={r.id} value={r.roomNo}>
                      {r.roomNo} {r.roomName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>开始时间 *</Label>
              <Input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
              />
            </div>
            <div>
              <Label>时长（小时）</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map((h) => (
                    <SelectItem key={h} value={String(h)}>
                      {h} 小时
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>备注</Label>
            <Textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="特殊需求..."
              rows={2}
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
            {saving ? "创建中..." : "确认创建"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
