// KTV 模块2：点单送房

"use client";

import { useEffect, useState, useMemo } from "react";
import {
  RefreshCw,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Send,
  CheckCircle2,
  Clock,
  Music2,
} from "lucide-react";
import {
  Card,
  CardContent,
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
import { api } from "@/lib/api";
import type { KtvOrderInfoV2, KtvProductInfo } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { yuan, relTime, fullTime } from "@/components/common/format";

interface CartLine {
  product: KtvProductInfo;
  qty: number;
}

export function KtvOrderModule() {
  const [orders, setOrders] = useState<KtvOrderInfoV2[]>([]);
  const [products, setProducts] = useState<KtvProductInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [category, setCategory] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [o, p] = await Promise.all([api.getKtvOrders("open"), api.getKtvProducts()]);
      setOrders(o);
      setProducts(p);
      if (!selectedOrderId && o.length > 0) setSelectedOrderId(o[0].id);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  // 当前选中的订单（含明细）
  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId),
    [orders, selectedOrderId],
  );

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ["all", ...Array.from(set)];
  }, [products]);

  const filteredProducts = products.filter(
    (p) =>
      (category === "all" || p.category === category) &&
      p.name.toLowerCase().includes(keyword.toLowerCase()) &&
      p.status === 1,
  );

  const addToCart = (product: KtvProductInfo) => {
    if (product.stock <= 0) {
      toast({ title: "库存不足", variant: "destructive" });
      return;
    }
    setCart((prev) => {
      const ex = prev.find((l) => l.product.id === product.id);
      if (ex) {
        if (ex.qty >= product.stock) {
          toast({ title: `库存仅剩 ${product.stock}`, variant: "destructive" });
          return prev;
        }
        return prev.map((l) =>
          l.product.id === product.id ? { ...l, qty: l.qty + 1 } : l,
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const changeQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) =>
          l.product.id === id ? { ...l, qty: l.qty + delta } : l,
        )
        .filter((l) => l.qty > 0),
    );
  };

  const total = cart.reduce((s, l) => s + l.product.price * l.qty, 0);

  const submitOrder = async () => {
    if (!selectedOrder || cart.length === 0) return;
    setSubmitting(true);
    try {
      await api.addOrderItems(selectedOrder.id, cart.map((l) => ({
        productId: l.product.id,
        qty: l.qty,
      })));
      toast({
        title: "点单成功",
        description: `${cart.length} 种商品已加入 ${selectedOrder.roomNo}`,
      });
      setCart([]);
      load();
    } catch (e) {
      toast({ title: "点单失败", description: String(e), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const deliver = async (itemId: string) => {
    if (!selectedOrder) return;
    try {
      await api.deliverItem(selectedOrder.id, itemId);
      toast({ title: "已标记送达" });
      load();
    } catch (e) {
      toast({ title: "操作失败", description: String(e), variant: "destructive" });
    }
  };

  const cancelItem = async (itemId: string) => {
    if (!selectedOrder) return;
    try {
      await api.cancelOrderItem(selectedOrder.id, itemId);
      toast({ title: "已退单" });
      load();
    } catch (e) {
      toast({ title: "退单失败", description: String(e), variant: "destructive" });
    }
  };

  if (!loading && orders.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Music2 className="h-12 w-12 mb-3 opacity-30" />
          <p className="font-medium">暂无进行中的包厢订单</p>
          <p className="text-sm mt-1">请先在「包厢看板」开台</p>
          <Button variant="outline" className="mt-4" onClick={load}>
            刷新
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* 左：商品 + 当前订单 */}
      <div className="lg:col-span-2 space-y-4">
        {/* 选择包厢订单 */}
        <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="选择包厢订单" />
          </SelectTrigger>
          <SelectContent>
            {orders.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.roomNo} {o.roomName} · {o.customerName || "散客"} ·{" "}
                {relTime(o.openedAt)}开台
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 商品分类 + 搜索 */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索商品..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
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

        {/* 商品网格 */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={p.stock <= 0}
                className="text-left rounded-lg border p-3 hover:shadow-md hover:border-emerald-400 transition-all disabled:opacity-50 bg-background relative"
              >
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="text-xs">
                    {p.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">库存 {p.stock}</span>
                </div>
                <div className="font-medium text-sm truncate mt-1">{p.name}</div>
                <div className="text-emerald-600 font-bold mt-1">{yuan(p.price)}</div>
              </button>
            ))}
          </div>
        )}

        {/* 当前订单明细 */}
        {selectedOrder && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-rose-500" />
                  {selectedOrder.roomNo} 当前订单
                </span>
                <Badge variant="outline">{selectedOrder.orderNo}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-80">
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  <div className="divide-y">
                    {selectedOrder.items.map((it) => (
                      <div key={it.id} className="flex items-center gap-3 p-3 text-sm">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{it.productName}</div>
                          <div className="text-xs text-muted-foreground">
                            {yuan(it.price)} × {it.qty} ={" "}
                            <span className="font-semibold">{yuan(it.price * it.qty)}</span>
                            {it.deliveredAt && ` · 送达 ${relTime(it.deliveredAt)}`}
                          </div>
                        </div>
                        {it.status === "pending" && (
                          <Badge variant="secondary" className="text-amber-600">
                            待送
                          </Badge>
                        )}
                        {it.status === "delivered" && (
                          <Badge variant="secondary" className="text-emerald-600">
                            已送达
                          </Badge>
                        )}
                        {it.status === "cancelled" && (
                          <Badge variant="destructive">已退</Badge>
                        )}
                        {it.status === "pending" && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 gap-1"
                              onClick={() => deliver(it.id)}
                            >
                              <Send className="h-3 w-3" /> 送达
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-red-500"
                              onClick={() => cancelItem(it.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    暂无商品，请从右侧选商品点单
                  </div>
                )}
              </ScrollArea>
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div className="border-t px-4 py-3 flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">商品消费合计</span>
                  <span className="font-bold text-emerald-600">
                    {yuan(selectedOrder.productFee)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* 右：购物车 */}
      <div className="lg:sticky lg:top-20 self-start">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              待下单
              {cart.length > 0 && (
                <Badge className="bg-emerald-600 hover:bg-emerald-600">
                  {cart.reduce((s, l) => s + l.qty, 0)}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64 -mx-2 px-2">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground text-sm">
                  <ShoppingCart className="h-10 w-10 mb-2 opacity-30" />
                  点击商品加入购物车
                </div>
              ) : (
                <div className="space-y-2">
                  {cart.map((l) => (
                    <div key={l.product.id} className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {l.product.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {yuan(l.product.price)} × {l.qty}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => changeQty(l.product.id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm">{l.qty}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => changeQty(l.product.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <Separator className="my-3" />

            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">合计</span>
              <span className="text-xl font-bold text-emerald-600">{yuan(total)}</span>
            </div>

            <Button
              className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
              disabled={cart.length === 0 || !selectedOrder || submitting}
              onClick={submitOrder}
            >
              {submitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> 提交中
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" /> 提交点单
                </>
              )}
            </Button>
            {!selectedOrder && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                请先选择包厢订单
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
