// 给商品绑定图片
import { db } from "../src/lib/db";

const IMG: Record<string, string> = {
  "酒水": "/dishes/beer.png",
  "饮料": "/dishes/drinks.png",
  "水果": "/dishes/fruit.png",
  "零食": "/dishes/snacks.png",
  "热菜": "/dishes/hotdish.png",
  "凉菜": "/dishes/hotdish.png",
  "主食": "/dishes/hotdish.png",
  "套餐": "/dishes/whisky.png",
};

const WHISKY = ["芝华士 12年", "轩尼诗 VSOP", "杰克丹尼", "黑方威士忌"];

async function main() {
  console.log("🖼️ 绑定商品图片...");
  const cats = await db.productCategory.findMany();
  const catMap = new Map(cats.map((c) => [c.id, c.name]));
  const products = await db.product.findMany();
  for (const p of products) {
    const catName = catMap.get(p.categoryId) ?? "酒水";
    const img = WHISKY.includes(p.name) ? "/dishes/whisky.png" : (IMG[catName] ?? "/dishes/beer.png");
    await db.product.update({ where: { id: p.id }, data: { imageUrl: img } });
  }
  console.log(`✅ ${products.length} 个商品绑定图片`);
}

main().catch(console.error).finally(() => db.$disconnect());
