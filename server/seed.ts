import { db } from "./db";
import { invoices, invoiceItems } from "@shared/schema";
import { sql } from "drizzle-orm";

export async function seedDatabase() {
  const existing = await db.select().from(invoices);
  if (existing.length > 0) return;

  const [inv1] = await db.insert(invoices).values({
    invoiceNumber: "INV-39",
    clientName: "ART FASHION LLC",
    clientAddress: "Abu Dhabi, UAE",
    currency: "AED",
    totalAmount: 3200,
    status: "draft",
  }).returning();

  await db.insert(invoiceItems).values([
    { invoiceId: inv1.id, description: "MX-4495 MOD.no", quantity: 10, rate: 20, amount: 200, isUncertain: 0 },
    { invoiceId: inv1.id, description: "MX-3220 MOD.no", quantity: 25, rate: 45, amount: 1125, isUncertain: 0 },
    { invoiceId: inv1.id, description: "MX-7810 MOD.no", quantity: 15, rate: 75, amount: 1125, isUncertain: 0 },
    { invoiceId: inv1.id, description: "MX-1150 MOD.no", quantity: 50, rate: 15, amount: 750, isUncertain: 0 },
  ]);

  const [inv2] = await db.insert(invoices).values({
    invoiceNumber: "INV-40",
    clientName: "ART FASHION LLC",
    clientAddress: "Abu Dhabi, UAE",
    currency: "AED",
    totalAmount: 5830,
    status: "draft",
  }).returning();

  await db.insert(invoiceItems).values([
    { invoiceId: inv2.id, description: "MX-9001 MOD.no", quantity: 30, rate: 85, amount: 2550, isUncertain: 0 },
    { invoiceId: inv2.id, description: "MX-5520 MOD.no", quantity: 40, rate: 32, amount: 1280, isUncertain: 0 },
    { invoiceId: inv2.id, description: "MX-6673 MOD.no", quantity: 20, rate: 100, amount: 2000, isUncertain: 0 },
  ]);

  const [inv3] = await db.insert(invoices).values({
    invoiceNumber: "INV-41",
    clientName: "ART FASHION LLC",
    clientAddress: "Abu Dhabi, UAE",
    currency: "AED",
    totalAmount: 1590,
    status: "draft",
  }).returning();

  await db.insert(invoiceItems).values([
    { invoiceId: inv3.id, description: "MX-2240 MOD.no", quantity: 12, rate: 55, amount: 660, isUncertain: 0 },
    { invoiceId: inv3.id, description: "MX-8815 MOD.no", quantity: 18, rate: 35, amount: 630, isUncertain: 0 },
    { invoiceId: inv3.id, description: "MX-3390 MOD.no", quantity: 6, rate: 50, amount: 300, isUncertain: 0 },
  ]);

  console.log("Database seeded with 3 sample invoices");
}
