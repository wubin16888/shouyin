// 登录页

"use client";

import { useState } from "react";
import { User, Lock, LogIn, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/store/auth-store";

export function LoginPage({ onClose, onLogined }: {
  onClose: () => void;
  onLogined: (defaultModule: string) => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const login = useAuth((s) => s.login);

  const submit = async () => {
    if (!username || !password) {
      toast({ title: "请输入账号密码", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const body = await res.json();
      if (body.code === 200) {
        const { employee, modules, defaultModule, token } = body.data;
        login(employee, modules, token);
        toast({ title: "登录成功", description: `欢迎，${employee.name}` });
        onLogined(defaultModule);
      } else {
        toast({ title: "登录失败", description: body.msg, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "网络错误", description: String(e), variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-emerald-600/20 mb-3">
            <Store className="h-8 w-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">员工登录</h1>
          <p className="text-sm text-slate-400 mt-1">凭账号密码登录对应前端</p>
        </div>
        <Card className="bg-slate-800/80 border-slate-700 backdrop-blur">
          <CardContent className="p-6 space-y-4">
            <div>
              <Label className="text-slate-200">账号</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input value={username} onChange={(e) => setUsername(e.target.value)}
                  placeholder="用户名" className="bg-slate-900/60 border-slate-700 text-slate-100 pl-9" />
              </div>
            </div>
            <div>
              <Label className="text-slate-200">密码</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder="密码" className="bg-slate-900/60 border-slate-700 text-slate-100 pl-9" />
              </div>
            </div>
            <Button onClick={submit} disabled={loading} className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700">
              {loading ? "登录中..." : <><LogIn className="h-4 w-4" /> 登录</>}
            </Button>
            <div className="text-xs text-slate-500 space-y-1 pt-2 border-t border-slate-700/50">
              <p className="text-slate-400 font-medium">权限说明：</p>
              <p>• 门店管理员(admin)：全部模块</p>
              <p>• 经理(manager)：收银/出品/财务</p>
              <p>• 收银员(cashier)：收银系统</p>
              <p>• 吧台/厨房(production)：出品系统</p>
            </div>
            <Button variant="ghost" onClick={onClose} className="w-full text-slate-400 text-xs">返回首页</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
