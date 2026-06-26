// 模块3：配置中心

"use client";

import { useEffect, useState } from "react";
import {
  Save,
  History,
  Undo2,
  Pencil,
  RefreshCw,
  Search,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { api } from "@/lib/api";
import type {
  StoreInfo,
  StoreConfigInfo,
  ConfigHistoryInfo,
} from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { fullTime } from "@/components/common/format";

export function ConfigModule() {
  const [stores, setStores] = useState<StoreInfo[]>([]);
  const [storeId, setStoreId] = useState<number>(1001);
  const [configs, setConfigs] = useState<StoreConfigInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [editing, setEditing] = useState<StoreConfigInfo | null>(null);
  const [historyKey, setHistoryKey] = useState<string | null>(null);

  const loadStores = async () => {
    const s = await api.getStores();
    setStores(s);
  };

  const loadConfigs = async () => {
    setLoading(true);
    try {
      setConfigs(await api.getConfigs(storeId));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    loadConfigs();
  }, [storeId]);

  const filtered = configs.filter(
    (c) =>
      c.configKey.toLowerCase().includes(keyword.toLowerCase()) ||
      (c.description ?? "").includes(keyword),
  );

  return (
    <div className="space-y-4">
      {/* 门店选择 + 搜索 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select
          value={String(storeId)}
          onValueChange={(v) => setStoreId(Number(v))}
        >
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="选择门店" />
          </SelectTrigger>
          <SelectContent>
            {stores.map((s) => (
              <SelectItem key={s.storeId} value={String(s.storeId)}>
                {s.storeName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索配置项..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="pl-9"
          />
        </div>

        <Button variant="outline" onClick={loadConfigs} className="gap-1">
          <RefreshCw className="h-4 w-4" /> 刷新
        </Button>
      </div>

      {/* 配置列表 */}
      {loading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((c) => (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-semibold">
                        {c.configKey}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {c.valueType}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        v{c.version}
                      </Badge>
                    </div>
                    {c.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {c.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="rounded bg-muted px-3 py-2 text-sm font-mono break-all max-h-20 overflow-y-auto">
                  {c.configValue}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-muted-foreground">
                    更新于 {fullTime(c.updatedAt)}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setHistoryKey(c.configKey)}
                      className="gap-1"
                    >
                      <History className="h-3.5 w-3.5" /> 历史
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setEditing(c)}
                      className="gap-1"
                    >
                      <Pencil className="h-3.5 w-3.5" /> 编辑下发
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              未找到匹配的配置项
            </div>
          )}
        </div>
      )}

      {/* 编辑弹窗 */}
      <EditConfigDialog
        storeId={storeId}
        config={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          loadConfigs();
        }}
      />

      {/* 历史弹窗 */}
      <HistoryDialog
        storeId={storeId}
        configKey={historyKey}
        onClose={() => setHistoryKey(null)}
        onRollback={() => loadConfigs()}
      />
    </div>
  );
}

function EditConfigDialog({
  storeId,
  config,
  onClose,
  onSaved,
}: {
  storeId: number;
  config: StoreConfigInfo | null;
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
      await api.updateConfig(storeId, config.configKey, value, "admin");
      toast({
        title: "配置已下发",
        description: `${config.configKey} → v${config.version + 1}，已推送到边缘端`,
      });
      onSaved();
    } catch (e) {
      toast({ title: "下发失败", description: String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!config} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>编辑配置 · {config?.configKey}</DialogTitle>
          <DialogDescription>
            修改后会生成新版本并实时下发到边缘端（WebSocket 推送）
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <Label className="text-xs text-muted-foreground">类型</Label>
              <div>{config?.valueType}</div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">当前版本</Label>
              <div>v{config?.version}</div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">描述</Label>
              <div className="truncate">{config?.description ?? "—"}</div>
            </div>
          </div>
          <div>
            <Label htmlFor="cfg-value">配置值</Label>
            <Textarea
              id="cfg-value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              rows={6}
              className="font-mono"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={save} disabled={saving} className="gap-1">
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" /> 下发中
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> 保存并下发
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HistoryDialog({
  storeId,
  configKey,
  onClose,
  onRollback,
}: {
  storeId: number;
  configKey: string | null;
  onClose: () => void;
  onRollback: () => void;
}) {
  const [history, setHistory] = useState<ConfigHistoryInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [rollbackTarget, setRollbackTarget] = useState<ConfigHistoryInfo | null>(null);
  const [rolling, setRolling] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!configKey) return;
    setLoading(true);
    api
      .getConfigHistory(storeId, configKey)
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [storeId, configKey]);

  const doRollback = async () => {
    if (!rollbackTarget) return;
    setRolling(true);
    try {
      await api.rollbackConfig(rollbackTarget.id);
      toast({
        title: "已回滚",
        description: `${configKey} 已回滚到 v${rollbackTarget.version - 1} 的值，生成新版本`,
      });
      setRollbackTarget(null);
      onRollback();
      // 重新加载历史
      const h = await api.getConfigHistory(storeId, configKey!);
      setHistory(h);
    } catch (e) {
      toast({ title: "回滚失败", description: String(e), variant: "destructive" });
    } finally {
      setRolling(false);
    }
  };

  return (
    <Dialog open={!!configKey} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>变更历史 · {configKey}</DialogTitle>
          <DialogDescription>
            每次修改都会保留历史版本，可一键回滚到任意历史值
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[500px] pr-4">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((h) => (
                <div key={h.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">v{h.version}</Badge>
                      {h.isRollback && (
                        <Badge variant="outline" className="text-amber-600">
                          <Undo2 className="h-3 w-3 mr-1" />
                          回滚
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {fullTime(h.createdAt)} · {h.operator}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-muted-foreground mb-1">旧值</div>
                      <div className="font-mono bg-muted rounded px-2 py-1 break-all max-h-16 overflow-y-auto">
                        {h.oldValue ?? "（初始）"}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">新值</div>
                      <div className="font-mono bg-emerald-50 dark:bg-emerald-950/30 rounded px-2 py-1 break-all max-h-16 overflow-y-auto">
                        {h.newValue}
                      </div>
                    </div>
                  </div>
                  {h.oldValue && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-2 gap-1 text-xs"
                      onClick={() => setRollbackTarget(h)}
                    >
                      <Undo2 className="h-3 w-3" /> 回滚到此版本之前
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <AlertDialog
          open={!!rollbackTarget}
          onOpenChange={(v) => !v && setRollbackTarget(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认回滚？</AlertDialogTitle>
              <AlertDialogDescription>
                将 {configKey} 的值回滚到 v
                {rollbackTarget && rollbackTarget.version - 1} 的状态，
                会生成一个新版本，原历史不受影响。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={doRollback}
                disabled={rolling}
                className="gap-1"
              >
                {rolling ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> 回滚中
                  </>
                ) : (
                  <>
                    <Undo2 className="h-4 w-4" /> 确认回滚
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
