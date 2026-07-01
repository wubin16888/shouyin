// POST /api/ktv/orders/[id]/items — 给订单加商品（点单，支持套餐展开）
import { db } from "@/lib/db";
import { ok, fail, parseError } from "@/lib/api-helpers";
import type { KtvOrderItemInfo } from "@/lib/types";

export const dynamic = "force-dynamic";

interface PackageChild {
  productId: string;
  name?: string;
  qty: number;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const items = body.items as Array<{
      productId: string;
      qty: number;
      flavors?: string | null;
    }>;
    if (!Array.isArray(items) || items.length === 0)
      return fail("缺少 items");

    const order = await db.ktvOrder.findUnique({ where: { id } });
    if (!order) return fail("订单不存在");
    if (order.status !== "open") return fail("订单已结账，无法加单");

    const created: KtvOrderItemInfo[] = [];
    let addedFee = 0;

    for (const it of items) {
      const product = await db.product.findUnique({ where: { id: it.productId } });
      if (!product) continue;
      // 移除库存限制：if (product.stock < it.qty) return fail(`${product.name} 库存不足（剩 ${product.stock}）`);

      // 套餐：主项价格=packagePrice（兼容 seed 未设的情况，回退到 price）
      const isPkg = product.isPackage;
      const mainPrice = isPkg
        ? (product.packagePrice > 0 ? product.packagePrice : product.price)
        : product.price;

      // 创建主商品/套餐主项
      const item = await db.ktvOrderItem.create({
        data: {
          orderId: id,
          productId: product.id,
          productName: product.name,
          price: mainPrice,
          qty: it.qty,
          flavors: it.flavors ?? null,
          outputDept: product.outputDept,
          status: "pending",
        },
      });
      addedFee += mainPrice * it.qty;
      created.push({
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        productName: item.productName,
        price: item.price,
        qty: item.qty,
        status: "pending",
        deliveredAt: null,
        createdAt: item.createdAt.toISOString(),
      });

      // 扣主商品库存
      await db.product.update({
        where: { id: product.id },
        data: { stock: { decrement: it.qty } },
      });

      // 套餐子项展开（子项单价 0，状态 delivered 不出单）
      if (isPkg && product.packageItems) {
        try {
          const children = JSON.parse(product.packageItems) as PackageChild[];
          if (Array.isArray(children)) {
            for (const child of children) {
              if (!child.productId || !child.qty) continue;
              const sub = await db.product.findUnique({ where: { id: child.productId } });
              if (!sub) continue;
              const subQty = child.qty * it.qty;
              await db.ktvOrderItem.create({
                data: {
                  orderId: id,
                  productId: sub.id,
                  productName: `${product.name} · ${sub.name}`,
                  price: 0, // 套餐子项单价 0
                  qty: subQty,
                  flavors: null,
                  outputDept: sub.outputDept,
                  status: "delivered", // 套餐子项直接标记已送达（不出单）
                  isGift: false,
                  giftRemark: `套餐 ${product.name} 内含`,
                  deliveredAt: new Date(),
                },
              });
              // 子项库存按实际消耗扣减
              if (true) { // 移除库存限制
                await db.product.update({
                  where: { id: sub.id },
                  data: { stock: { decrement: subQty } },
                });
              }
            }
          }
        } catch {
          // packageItems 解析失败：忽略，主项已下单
        }
      }
    }

    await db.ktvOrder.update({
      where: { id },
      data: { productFee: { increment: Math.round(addedFee * 100) / 100 } },
    });

    return ok<KtvOrderItemInfo[]>(created);
  } catch (e) {
    return fail(parseError(e));
  }
}
