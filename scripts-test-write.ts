import { db } from "@/lib/db";
async function main() {
  try {
    // Try a write
    const r = await db.$executeRaw`PRAGMA journal_mode=WAL`;
    console.log("WAL mode set:", r);
    const emp = await db.employee.findFirst();
    if (emp) {
      await db.employee.update({ where: { id: emp.id }, data: { usedGiftAmount: emp.usedGiftAmount } });
      console.log("Update OK");
    } else {
      console.log("No employee to update");
    }
  } catch (e) {
    console.error("ERROR:", e);
  } finally {
    await db.$disconnect();
  }
}
main();
