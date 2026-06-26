// 模块7：POS 收银演示

"use client";

import { useEffect, useState, useMemo } from "react";
import {
  UtensilsCrossed,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Receipt,
  CheckCircle2,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
import { api } from "@/lib/api";
import type { DishInfo, OrderInfo, StoreInfo } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { yuan, OrderStatusBadge, payMethodLabel, relTime } from "@/components/common/format";

interface CartItem {
  dish: DishInfo;
  qty: number;
}

export function PosModule() {
  const [stores, setStores] = useState<StoreInfo[]>([]);
  const [storeId, setStoreId] = useState(1001);
  const [dishes, setDishes] = useState<DishInfo[]>([]);
  const [orders, setOrders] = useState<OrderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [category, setCategory] = useState<string>("all");
  const [keyword, setKeyword] = useState("");
  const [payDialog, setPayDialog] = useState(false);
  const [payMethod, setPayMethod] = useState("cash");
  const [paying, setPaying] = useState(false);
  const [lastOrder, setLastOrder] = useState<OrderInfo | null>(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [s, d, o] = await Promise.all([
        api.getStores(),
        api.getDishes(storeId),
        api.getOrders(storeId, 20),
      ]);
      setStores(s);
      setDishes(d);
      setOrders(o);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [storeId]);

  const categories = useMemo(() => {
    const set = new Set(dishes.map((d) => d.category));
    return ["all", ...Array.from(set)];
  }, [dishes]);

  const filteredDishes = dishes.filter(
    (d) =>
      (category === "all" || d.category === category) &&
      d.name.toLowerCase().includes(keyword.toLowerCase()),
  );

  const addToCart = (dish: DishInfo) => {
    setCart((prev) => {
      const ex = prev.find((i) => i.dish.id === dish.id);
      if (ex) {
        return prev.map((i) =>
          i.dish.id === dish.id ? { ...i, qty: i.qty + 1 } : i,
        );
      }
      return [...prev, { dish, qty: 1 }];
    });
  };

  const changeQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.dish.id === id ? { ...i, qty: i.qty + delta } : i,
        )
        .filter((i) => i.qty > 0),
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((i) => i.dish.id !== id));
  };

  const total = cart.reduce((s, i) => s + i.dish.price * i.qty, 0);
  const itemCount = cart.reduce((s, i) => s + i.qty, 0);

  const submitOrder = async () => {
    setPaying(true);
    try {
      const order = await api.createOrder({
        storeId,
        items: cart.map((i) => ({
          name: i.dish.name,
          qty: i.qty,
          price: i.dish.price,
        })),
        payMethod,
      });
      setLastOrder(order);
      setCart([]);
      setPayDialog(false);
      toast({
        title: "下单成功",
        description: `${order.orderNo} · ${yuan(order.totalAmount)}`,
      });
      load();
    } catch (e) {
      toast({ title: "下单失败", description: String(e), variant: "destructive" });
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* 左：菜品选择 */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Select
            value={String(storeId)}
            onValueChange={(v) => setStoreId(Number(v))}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
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
              placeholder="搜索菜品..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* 分类 */}
        <div className="flex gap-2 flex-wrap">
          {categories.map((c) => (
            <Button
              key={c}
              size="sm"
              variant={category === c ? "default" : "outline"}
              onClick={() => setCategory(c)}
              className={category === c ? "bg-emerald-600 hover:bg-emerald-600" : ""}
            >
              {c === "all" ? "全部" : c}
            </Button>
          ))}
        </div>

        {/* 菜品网格 */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredDishes.map((d) => (
              <button
                key={d.id}
                onClick={() => d.status === 1 && addToCart(d)}
                disabled={d.status !== 1}
                className="text-left rounded-lg border p-3 hover:shadow-md hover:border-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative bg-background"
              >
                <div className="aspect-square rounded-md bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-950/40 dark:to-emerald-900/20 flex items-center justify-center mb-2">
                  <UtensilsCrossed className="h-8 w-8 text-emerald-600" />
                </div>
                <div className="font-medium text-sm truncate">{d.name}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-emerald-600 font-bold">{yuan(d.price)}</span>
                  <Badge variant="outline" className="text-xs">
                    {d.category}
                  </Badge>
                </div>
                {d.status !== 1 && (
                  <Badge variant="destructive" className="absolute top-2 right-2 text-xs">
                    停售
                  </Badge>
                )}
              </button>
            ))}
          </div>
        )}

        {/* 最近订单 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              最近订单
            </CardTitle>
            <CardDescription>本门店最近 20 笔</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-64">
              <div className="divide-y">
                {orders.map((o) => (
                  <div key={o.id} className="flex items-center gap-3 p-3 text-sm">
                    <OrderStatusBadge status={o.status} />
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-xs truncate">{o.orderNo}</div>
                      <div className="text-xs text-muted-foreground">
                        {o.itemCount} 件 · {payMethodLabel(o.payMethod)} · {relTime(o.createdAt)}
                      </div>
                    </div>
                    <div className="font-semibold text-emerald-600">
                      {yuan(o.totalAmount)}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* 右：购物车 */}
      <div className="lg:sticky lg:top-20 self-start">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              购物车
              {itemCount > 0 && (
                <Badge className="bg-emerald-600 hover:bg-emerald-600">
                  {itemCount}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80 -mx-2 px-2">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-80 text-muted-foreground text-sm">
                  <ShoppingCart className="h-12 w-12 mb-2 opacity-30" />
                  购物车空空如也
                  <span className="text-xs mt-1">点击左侧菜品添加</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {cart.map((i) => (
                    <div key={i.dish.id} className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {i.dish.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {yuan(i.dish.price)} × {i.qty}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => changeQty(i.dish.id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm">{i.qty}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => changeQty(i.dish.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-red-500"
                        onClick={() => removeFromCart(i.dish.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <Separator className="my-3" />

            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">合计</span>
              <span className="text-2xl font-bold text-emerald-600">
                {yuan(total)}
              </span>
            </div>

            <Button
              className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
              disabled={cart.length === 0}
              onClick={() => setPayDialog(true)}
            >
              <CreditCard className="h-4 w-4" />
              结算 ({itemCount} 件)
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 支付弹窗 */}
      <Dialog open={payDialog} onOpenChange={setPayDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>选择支付方式</DialogTitle>
            <DialogDescription>
              {itemCount} 件商品 · 合计 {yuan(total)}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 py-2">
            {["cash", "wechat", "alipay", "member", "card"].map((m) => (
              <Button
                key={m}
                variant={payMethod === m ? "default" : "outline"}
                className={
                  payMethod === m
                    ? "bg-emerald-600 hover:bg-emerald-600 justify-start"
                    : "justify-start"
                }
                onClick={() => setPayMethod(m)}
              >
                {payMethodLabel(m)}
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialog(false)}>
              取消
            </Button>
            <Button
              onClick={submitOrder}
              disabled={paying}
              className="gap-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {paying ? (
                <>
                  <Receipt className="h-4 w-4 animate-spin" /> 提交中
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" /> 确认支付 {yuan(total)}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 下单成功提示 */}
      <Dialog open={!!lastOrder} onOpenChange={(v) => !v && setLastOrder(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
              下单成功
            </DialogTitle>
            <DialogDescription>订单已同步到云端</DialogDescription>
          </DialogHeader>
          {lastOrder && (
            <div className="space-y-2 text-sm py-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">订单号</span>
                <span className="font-mono">{lastOrder.orderNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">支付方式</span>
                <span>{payMethodLabel(lastOrder.payMethod)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">商品数</span>
                <span>{lastOrder.itemCount} 件</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>实付</span>
                <span className="text-emerald-600">{yuan(lastOrder.totalAmount)}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setLastOrder(null)}>完成</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
