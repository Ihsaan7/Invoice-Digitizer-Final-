import { z } from "zod";

export * from "./models/chat";

export const insertInvoiceSchema = z.object({
  invoiceNumber: z.string(),
  clientName: z.string().default("ART FASHION LLC"),
  clientAddress: z.string().default("Abu Dhabi, UAE"),
  currency: z.string().default("AED"),
  totalAmount: z.number().default(0),
  status: z.string().default("draft"),
  imageUrl: z.string().nullable().optional(),
});

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type Invoice = {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientAddress: string;
  currency: string;
  totalAmount: number;
  status: string;
  imageUrl: string | null;
  createdAt: string;
};

export const insertInvoiceItemSchema = z.object({
  invoiceId: z.string(),
  description: z.string(),
  quantity: z.number(),
  rate: z.number(),
  amount: z.number(),
  isUncertain: z.number().default(0),
});

export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;

export type InvoiceItem = {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  isUncertain: number;
};

export const extractedItemSchema = z.object({
  description: z.string(),
  quantity: z.number(),
  rate: z.number(),
  amount: z.number(),
  isUncertain: z.boolean().default(false),
});

export type ExtractedItem = z.infer<typeof extractedItemSchema>;
