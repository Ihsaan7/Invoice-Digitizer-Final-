import {
  type Invoice,
  type InsertInvoice,
  type InvoiceItem,
  type InsertInvoiceItem,
} from "@shared/schema";
import { connectMongo } from "./mongodb";
import { InvoiceModel, InvoiceItemModel } from "./models";

export interface IStorage {
  getInvoices(): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(
    id: string,
    invoice: Partial<InsertInvoice>
  ): Promise<Invoice | undefined>;
  deleteInvoice(id: string): Promise<void>;
  getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]>;
  createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem>;
  updateInvoiceItem(
    id: string,
    item: Partial<InsertInvoiceItem>
  ): Promise<InvoiceItem | undefined>;
  deleteInvoiceItem(id: string): Promise<void>;
  deleteInvoiceItems(invoiceId: string): Promise<void>;
  getNextInvoiceNumber(): Promise<string>;
}

export class MongoStorage implements IStorage {
  async getInvoices(): Promise<Invoice[]> {
    await connectMongo();
    const docs = await InvoiceModel.find().sort({ createdAt: -1 });
    return docs.map((d) => d.toJSON() as unknown as Invoice);
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    await connectMongo();
    try {
      const doc = await InvoiceModel.findById(id);
      return doc ? (doc.toJSON() as unknown as Invoice) : undefined;
    } catch {
      return undefined;
    }
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    await connectMongo();
    const doc = await InvoiceModel.create(invoice);
    return doc.toJSON() as unknown as Invoice;
  }

  async updateInvoice(
    id: string,
    invoice: Partial<InsertInvoice>
  ): Promise<Invoice | undefined> {
    await connectMongo();
    const doc = await InvoiceModel.findByIdAndUpdate(id, invoice, {
      new: true,
    });
    return doc ? (doc.toJSON() as unknown as Invoice) : undefined;
  }

  async deleteInvoice(id: string): Promise<void> {
    await connectMongo();
    await InvoiceItemModel.deleteMany({ invoiceId: id });
    await InvoiceModel.findByIdAndDelete(id);
  }

  async getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
    await connectMongo();
    const docs = await InvoiceItemModel.find({ invoiceId });
    return docs.map((d) => d.toJSON() as unknown as InvoiceItem);
  }

  async createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem> {
    await connectMongo();
    const doc = await InvoiceItemModel.create(item);
    return doc.toJSON() as unknown as InvoiceItem;
  }

  async updateInvoiceItem(
    id: string,
    item: Partial<InsertInvoiceItem>
  ): Promise<InvoiceItem | undefined> {
    await connectMongo();
    const doc = await InvoiceItemModel.findByIdAndUpdate(id, item, {
      new: true,
    });
    return doc ? (doc.toJSON() as unknown as InvoiceItem) : undefined;
  }

  async deleteInvoiceItem(id: string): Promise<void> {
    await connectMongo();
    await InvoiceItemModel.findByIdAndDelete(id);
  }

  async deleteInvoiceItems(invoiceId: string): Promise<void> {
    await connectMongo();
    await InvoiceItemModel.deleteMany({ invoiceId });
  }

  async getNextInvoiceNumber(): Promise<string> {
    await connectMongo();
    const last = await InvoiceModel.findOne().sort({ createdAt: -1 });
    if (!last) return "INV-39";
    const match = last.invoiceNumber.match(/(\d+)/);
    const lastNum = match ? parseInt(match[1], 10) : 38;
    return `INV-${lastNum + 1}`;
  }
}

export class MemStorage implements IStorage {
  private invoices: Map<string, Invoice> = new Map();
  private invoiceItems: Map<string, InvoiceItem> = new Map();

  constructor() {
    this.seed();
  }

  private seed() {
    const inv1: Invoice = {
      id: "inv-1",
      invoiceNumber: "INV-39",
      clientName: "ART FASHION LLC",
      clientAddress: "Abu Dhabi, UAE",
      currency: "AED",
      totalAmount: 3200,
      status: "draft",
      imageUrl: null,
      createdAt: new Date(),
    };
    this.invoices.set(inv1.id, inv1);
    const items1: InvoiceItem[] = [
      { id: "item-1", invoiceId: "inv-1", description: "MX-4495 MOD.no", quantity: 10, rate: 20, amount: 200, isUncertain: 0 },
      { id: "item-2", invoiceId: "inv-1", description: "MX-3220 MOD.no", quantity: 25, rate: 45, amount: 1125, isUncertain: 0 },
      { id: "item-3", invoiceId: "inv-1", description: "MX-7810 MOD.no", quantity: 15, rate: 75, amount: 1125, isUncertain: 0 },
      { id: "item-4", invoiceId: "inv-1", description: "MX-1150 MOD.no", quantity: 50, rate: 15, amount: 750, isUncertain: 0 },
    ];
    items1.forEach((i) => this.invoiceItems.set(i.id, i));

    const inv2: Invoice = {
      id: "inv-2",
      invoiceNumber: "INV-40",
      clientName: "ART FASHION LLC",
      clientAddress: "Abu Dhabi, UAE",
      currency: "AED",
      totalAmount: 5830,
      status: "draft",
      imageUrl: null,
      createdAt: new Date(),
    };
    this.invoices.set(inv2.id, inv2);
    const items2: InvoiceItem[] = [
      { id: "item-5", invoiceId: "inv-2", description: "MX-9001 MOD.no", quantity: 30, rate: 85, amount: 2550, isUncertain: 0 },
      { id: "item-6", invoiceId: "inv-2", description: "MX-5520 MOD.no", quantity: 40, rate: 32, amount: 1280, isUncertain: 0 },
      { id: "item-7", invoiceId: "inv-2", description: "MX-6673 MOD.no", quantity: 20, rate: 100, amount: 2000, isUncertain: 0 },
    ];
    items2.forEach((i) => this.invoiceItems.set(i.id, i));

    const inv3: Invoice = {
      id: "inv-3",
      invoiceNumber: "INV-41",
      clientName: "ART FASHION LLC",
      clientAddress: "Abu Dhabi, UAE",
      currency: "AED",
      totalAmount: 1590,
      status: "draft",
      imageUrl: null,
      createdAt: new Date(),
    };
    this.invoices.set(inv3.id, inv3);
    const items3: InvoiceItem[] = [
      { id: "item-8", invoiceId: "inv-3", description: "MX-2240 MOD.no", quantity: 12, rate: 55, amount: 660, isUncertain: 0 },
      { id: "item-9", invoiceId: "inv-3", description: "MX-8815 MOD.no", quantity: 18, rate: 35, amount: 630, isUncertain: 0 },
      { id: "item-10", invoiceId: "inv-3", description: "MX-3390 MOD.no", quantity: 6, rate: 50, amount: 300, isUncertain: 0 },
    ];
    items3.forEach((i) => this.invoiceItems.set(i.id, i));
  }

  async getInvoices(): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const id = `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newInv: Invoice = {
      id,
      invoiceNumber: invoice.invoiceNumber,
      clientName: invoice.clientName,
      clientAddress: invoice.clientAddress,
      currency: invoice.currency,
      totalAmount: invoice.totalAmount,
      status: invoice.status || "draft",
      imageUrl: invoice.imageUrl || null,
      createdAt: new Date(),
    };
    this.invoices.set(id, newInv);
    return newInv;
  }

  async updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const existing = this.invoices.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...invoice };
    this.invoices.set(id, updated);
    return updated;
  }

  async deleteInvoice(id: string): Promise<void> {
    this.invoices.delete(id);
    await this.deleteInvoiceItems(id);
  }

  async getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
    return Array.from(this.invoiceItems.values()).filter((i) => i.invoiceId === invoiceId);
  }

  async createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem> {
    const id = `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newItem: InvoiceItem = {
      id,
      invoiceId: item.invoiceId,
      description: item.description,
      quantity: item.quantity,
      rate: item.rate,
      amount: item.amount,
      isUncertain: item.isUncertain || 0,
    };
    this.invoiceItems.set(id, newItem);
    return newItem;
  }

  async updateInvoiceItem(id: string, item: Partial<InsertInvoiceItem>): Promise<InvoiceItem | undefined> {
    const existing = this.invoiceItems.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...item };
    this.invoiceItems.set(id, updated);
    return updated;
  }

  async deleteInvoiceItem(id: string): Promise<void> {
    this.invoiceItems.delete(id);
  }

  async deleteInvoiceItems(invoiceId: string): Promise<void> {
    for (const [id, item] of Array.from(this.invoiceItems.entries())) {
      if (item.invoiceId === invoiceId) {
        this.invoiceItems.delete(id);
      }
    }
  }

  async getNextInvoiceNumber(): Promise<string> {
    const invs = await this.getInvoices();
    if (invs.length === 0) return "INV-39";
    const last = invs[0];
    const match = last.invoiceNumber.match(/(\d+)/);
    const lastNum = match ? parseInt(match[1], 10) : 38;
    return `INV-${lastNum + 1}`;
  }
}

export const storage: IStorage = process.env.MONGODB_URI
  ? new MongoStorage()
  : new MemStorage();
