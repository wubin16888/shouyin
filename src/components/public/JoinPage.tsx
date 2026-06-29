// 员工入职页（扫码后打开）

"use client";

import { useState, useEffect } from "react";
import { Store, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export function JoinPage({ storeId, joinCode, onClose }: {
  storeId: number; joinCode: string; onClose: () => void;
}) {
  const [storeName, setStoreName] = useState("");
  const [form, setForm] = useState({
    name: "", phone: "", position: "waiter", role: "cashier",
    idCard: "", emergencyContact: "", emergencyPhone: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/stores").then((r) => r.json()).then((b) => {
      const s = b.data?.find((x: any) => x.storeId === storeId);
      if (s) setStoreName(s.storeName);
    }).catch(() => {});
  }, [storeId]);

  const submit = async () => {
    if (!form.name || !form.phone) {
      toast({ title: "请填写姓名和手机号", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/join-applications", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, storeId, joinCode }),
      });
      const body = await res.json();
      if (body.code === 200) { setDone(true); toast({ title: "入职申请已提交" }); }
      else toast({ title: "提交失败", description: body.msg, variant: "destructive" });
    } catch (e) {
      toast({ title: "网络错误", description: String(e), variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 p-4">
        <Card className="max-w-md w-full bg-slate-800/80 border-slate-700">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-100 mb-2">入职申请已提交</h2>
            <p className="text-slate-400 text-sm mb-6">
              已提交至 <span className="text-emerald-400 font-medium">{storeName}</span>，
              管理员审核通过后将为您分配账号。
            </p>
            <Button onClick={onClose} className="bg-emerald-600 hover:bg-emerald-700">完成</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 p-4 py-8">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6">
          <Store className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-slate-100">员工入职</h1>
          <p className="text-sm text-slate-400 mt-1">
            申请加入 <span className="text-emerald-400 font-medium">{storeName || `门店${storeId}`}</span>
          </p>
        </div>
        <Card className="bg-slate-800/80 border-slate-700">
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-200">姓名 *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="bg-slate-900/60 border-slate-700 text-slate-100" />
              </div>
              <div>
                <Label className="text-slate-200">手机号 *</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="bg-slate-900/60 border-slate-700 text-slate-100" />
              </div>
            </div>
            <div>
              <Label className="text-slate-200">应聘岗位</Label>
              <Select value={form.position} onValueChange={(v) => setForm({ ...form, position: v })}>
                <SelectTrigger className="bg-slate-900/60 border-slate-700 text-slate-100"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">经理</SelectItem>
                  <SelectItem value="cashier">收银员</SelectItem>
                  <SelectItem value="waiter">服务员</SelectItem>
                  <SelectItem value="bartender">吧台</SelectItem>
                  <SelectItem value="chef">厨房</SelectItem>
                  <SelectItem value="marketing">营销</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-1">权限由门店管理员审核入职后在「人事」中分配</p>
            </div>
            <div>
              <Label className="text-slate-200">身份证号</Label>
              <Input value={form.idCard} onChange={(e) => setForm({ ...form, idCard: e.target.value })}
                className="bg-slate-900/60 border-slate-700 text-slate-100" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-200">紧急联系人</Label>
                <Input value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
                  className="bg-slate-900/60 border-slate-700 text-slate-100" />
              </div>
              <div>
                <Label className="text-slate-200">紧急电话</Label>
                <Input value={form.emergencyPhone} onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })}
                  className="bg-slate-900/60 border-slate-700 text-slate-100" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={onClose} className="bg-slate-900/60 border-slate-700 text-slate-300">取消</Button>
              <Button onClick={submit} disabled={submitting} className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700">
                {submitting ? "提交中" : <><Send className="h-4 w-4" /> 提交入职申请</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
