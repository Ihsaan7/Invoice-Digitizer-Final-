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

export const storage = new MongoStorage();
