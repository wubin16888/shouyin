// 门店申请页（微信扫码后打开）

"use client";

import { useState } from "react";
import { Store, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export function ApplyPage({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    storeName: "", contactName: "", phone: "", region: "",
    address: "", licenseNo: "", businessType: "ktv", remark: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const { toast } = useToast();

  const submit = async () => {
    if (!form.storeName || !form.contactName || !form.phone) {
      toast({ title: "请填写必填字段", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/store-applications", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await res.json();
      if (body.code === 200) { setDone(true); toast({ title: "申请已提交" }); }
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
            <h2 className="text-xl font-bold text-slate-100 mb-2">申请已提交</h2>
            <p className="text-slate-400 text-sm mb-6">您的门店申请已提交至云端，审批通过后将自动生成门店和管理员账号。</p>
            <Button onClick={onClose} className="bg-emerald-600 hover:bg-emerald-700">返回</Button>
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
          <h1 className="text-2xl font-bold text-slate-100">门店入驻申请</h1>
          <p className="text-sm text-slate-400 mt-1">填写信息，提交云端审批</p>
        </div>
        <Card className="bg-slate-800/80 border-slate-700">
          <CardContent className="p-6 space-y-4">
            <div>
              <Label className="text-slate-200">门店名称 *</Label>
              <Input value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                placeholder="如：天娱KTV旗舰店" className="bg-slate-900/60 border-slate-700 text-slate-100" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-200">联系人 *</Label>
                <Input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                  className="bg-slate-900/60 border-slate-700 text-slate-100" />
              </div>
              <div>
                <Label className="text-slate-200">手机号 *</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="bg-slate-900/60 border-slate-700 text-slate-100" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-200">区域</Label>
                <Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}
                  className="bg-slate-900/60 border-slate-700 text-slate-100" />
              </div>
              <div>
                <Label className="text-slate-200">业态</Label>
                <Select value={form.businessType} onValueChange={(v) => setForm({ ...form, businessType: v })}>
                  <SelectTrigger className="bg-slate-900/60 border-slate-700 text-slate-100"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ktv">KTV</SelectItem>
                    <SelectItem value="supermarket">超市</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-slate-200">地址</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="bg-slate-900/60 border-slate-700 text-slate-100" />
            </div>
            <div>
              <Label className="text-slate-200">申请理由</Label>
              <Textarea value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} rows={3}
                className="bg-slate-900/60 border-slate-700 text-slate-100" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={onClose} className="bg-slate-900/60 border-slate-700 text-slate-300">取消</Button>
              <Button onClick={submit} disabled={submitting} className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700">
                {submitting ? "提交中" : <><Send className="h-4 w-4" /> 提交申请</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
