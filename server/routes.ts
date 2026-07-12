import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { GoogleGenerativeAI } from "@google/generative-ai";
import multer from "multer";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/invoices", async (_req, res) => {
    try {
      const invoiceList = await storage.getInvoices();
      res.json(invoiceList);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ error: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const invoice = await storage.getInvoice(id);
      if (!invoice) return res.status(404).json({ error: "Invoice not found" });
      const items = await storage.getInvoiceItems(id);
      res.json({ ...invoice, items });
    } catch (error) {
      console.error("Error fetching invoice:", error);
      res.status(500).json({ error: "Failed to fetch invoice" });
    }
  });

  app.post("/api/invoices", async (req, res) => {
    try {
      const invoiceNumber = await storage.getNextInvoiceNumber();
      const invoice = await storage.createInvoice({
        invoiceNumber,
        clientName: req.body.clientName || "ART FASHION LLC",
        clientAddress: req.body.clientAddress || "Abu Dhabi, UAE",
        currency: req.body.currency || "AED",
        totalAmount: req.body.totalAmount || 0,
        status: "draft",
        imageUrl: req.body.imageUrl || null,
      });

      if (req.body.items && Array.isArray(req.body.items)) {
        for (const item of req.body.items) {
          await storage.createInvoiceItem({
            invoiceId: invoice.id,
            description: item.description,
            quantity: 1,
            rate: item.rate,
            amount: item.amount ?? item.rate,
            isUncertain: item.isUncertain ? 1 : 0,
          });
        }
      }

      const items = await storage.getInvoiceItems(invoice.id);
      res.status(201).json({ ...invoice, items });
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(500).json({ error: "Failed to create invoice" });
    }
  });

  app.put("/api/invoices/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const updated = await storage.updateInvoice(id, {
        clientName: req.body.clientName,
        clientAddress: req.body.clientAddress,
        totalAmount: req.body.totalAmount,
        status: req.body.status,
      });
      if (!updated) return res.status(404).json({ error: "Invoice not found" });

      if (req.body.items && Array.isArray(req.body.items)) {
        await storage.deleteInvoiceItems(id);
        for (const item of req.body.items) {
          await storage.createInvoiceItem({
            invoiceId: id,
            description: item.description,
            quantity: 1,
            rate: item.rate,
            amount: item.amount ?? item.rate,
            isUncertain: item.isUncertain ? 1 : 0,
          });
        }
      }

      const items = await storage.getInvoiceItems(id);
      res.json({ ...updated, items });
    } catch (error) {
      console.error("Error updating invoice:", error);
      res.status(500).json({ error: "Failed to update invoice" });
    }
  });

  app.delete("/api/invoices/:id", async (req, res) => {
    try {
      const id = req.params.id;
      await storage.deleteInvoice(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting invoice:", error);
      res.status(500).json({ error: "Failed to delete invoice" });
    }
  });

  app.post("/api/extract", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image uploaded" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not set. Add it in the Secrets panel." });
      }

      const base64Image = req.file.buffer.toString("base64");
      const mimeType = req.file.mimetype || "image/jpeg";

      const model = genai.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

      const prompt = `You are an OCR specialist that extracts data from handwritten invoice/bazaar notes.

CRITICAL RULES — follow these exactly:

1. TOTAL LINE: The VERY LAST number/amount written in the note is the GRAND TOTAL for the whole invoice. Do NOT include it as a line item — it belongs only in the "grandTotal" field. Even if the last line looks like an item, it is the total.

2. NO QUANTITY: There is no separate quantity column. Every item has quantity = 1. Do NOT extract or invent quantities. The "amount" for each item equals its "rate".

3. DESCRIPTIONS: Preserve the description exactly as written. If a model number appears (like 4495, 45042, MX-44921 etc.), keep it as-is. Do not add or change prefixes unless already present.

4. UNCERTAIN VALUES: If any description or rate is hard to read or ambiguous, set isUncertain: true for that item.

5. LAST NUMBER IS TOTAL: Re-emphasize — if the note has 9 items followed by a number like "540.00" or "540", that final number is the SubTotal/Grand Total. Do not list it as item 10.

Return ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "items": [
    { "description": "string", "rate": number, "amount": number, "isUncertain": boolean }
  ],
  "grandTotal": number
}

Example: A note with lines "MX-4495 40.00", "SIT 25.00", "45042 60.00", and then "125.00" at the end should produce:
{
  "items": [
    { "description": "MX-4495", "rate": 40.00, "amount": 40.00, "isUncertain": false },
    { "description": "SIT", "rate": 25.00, "amount": 25.00, "isUncertain": false },
    { "description": "45042", "rate": 60.00, "amount": 60.00, "isUncertain": false }
  ],
  "grandTotal": 125.00
}

Now extract all items from the attached handwritten invoice note. Remember: the LAST number is the grand total, not a line item. Return ONLY the JSON object.`;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: mimeType as any,
            data: base64Image,
          },
        },
      ]);

      const content = result.response.text().trim();
      // Strip markdown code fences if model wraps output
      const cleaned = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

      let parsed: any;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        parsed = { items: [], grandTotal: 0 };
      }

      const items = (parsed.items || []).map((item: any) => ({
        description: String(item.description || "[???]"),
        quantity: 1,
        rate: Number(item.rate) || 0,
        amount: Number(item.amount) || Number(item.rate) || 0,
        isUncertain: Boolean(item.isUncertain),
      }));

      const grandTotal = Number(parsed.grandTotal) || items.reduce((s: number, i: any) => s + i.amount, 0);

      res.json({ items, grandTotal });
    } catch (error) {
      console.error("Error extracting data:", error);
      res.status(500).json({ error: "Failed to extract data from image" });
    }
  });

  app.get("/api/invoice-number", async (_req, res) => {
    try {
      const number = await storage.getNextInvoiceNumber();
      res.json({ invoiceNumber: number });
    } catch (error) {
      res.status(500).json({ error: "Failed to get invoice number" });
    }
  });

  return httpServer;
}
