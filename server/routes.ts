import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";
import { z } from "zod";
import multer from "multer";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

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
      const id = parseInt(req.params.id);
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
            quantity: item.quantity,
            rate: item.rate,
            amount: item.quantity * item.rate,
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
      const id = parseInt(req.params.id);
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
            quantity: item.quantity,
            rate: item.rate,
            amount: item.quantity * item.rate,
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
      const id = parseInt(req.params.id);
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

      const base64Image = req.file.buffer.toString("base64");
      const mimeType = req.file.mimetype || "image/jpeg";

      const response = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          {
            role: "system",
            content: `You are an OCR specialist that extracts data from handwritten bazaar notes. 
The notes follow this pattern: [Quantity on far left] [Model Number in middle] [Rate/Amount on far right].

Rules:
- All model numbers must be prefixed with "MX-". For example, if the note says "4495", convert it to "MX-4495 MOD.no".
- The description should be in the format "MX-XXXX MOD.no" where XXXX is the model number.
- Quantity is always on the far left.
- Rate is always on the far right.
- Amount = Quantity x Rate.
- If you are uncertain about any value (hard to read), mark that item with isUncertain: true.
- Return a JSON array of items.

Example: A note saying "10 4495 20" should become:
{ "description": "MX-4495 MOD.no", "quantity": 10, "rate": 20, "amount": 200, "isUncertain": false }

Return ONLY valid JSON in this format:
{
  "items": [
    { "description": "MX-XXXX MOD.no", "quantity": number, "rate": number, "amount": number, "isUncertain": boolean }
  ]
}`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract all items from this handwritten bazaar note. Return the data as JSON."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 8192,
      });

      const content = response.choices[0]?.message?.content || "{}";
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch {
        parsed = { items: [] };
      }

      const items = (parsed.items || []).map((item: any) => ({
        description: String(item.description || "[???]"),
        quantity: Number(item.quantity) || 0,
        rate: Number(item.rate) || 0,
        amount: Number(item.amount) || (Number(item.quantity) || 0) * (Number(item.rate) || 0),
        isUncertain: Boolean(item.isUncertain),
      }));

      res.json({ items });
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
