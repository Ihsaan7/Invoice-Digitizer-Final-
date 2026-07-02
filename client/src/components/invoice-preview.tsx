import { useCallback } from "react";
import { ArrowLeft, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Invoice, InvoiceItem } from "@shared/schema";

interface InvoicePreviewProps {
  invoice: Invoice & { items: InvoiceItem[] };
  onBack: () => void;
  onNewScan: () => void;
}

const COMPANY_NAME = "DigiBill";
const COMPANY_CITY = "ISLAMABAD, Pakistan";
const COMPANY_PHONE = "+923490896977";

export function InvoicePreview({ invoice, onBack, onNewScan }: InvoicePreviewProps) {
  const total = invoice.items.reduce((sum, item) => sum + (item.amount ?? item.rate), 0);

  const generatePDF = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 18;

    // ── HEADER BLOCK ───────────────────────────────────────────────
    // Left: logo mark + company name
    doc.setFillColor(29, 78, 216);          // blue square logo
    doc.roundedRect(margin, 14, 10, 10, 1.5, 1.5, "F");
    doc.setFillColor(255, 255, 255);
    doc.rect(margin + 2.5, 16.5, 5, 1.5, "F");
    doc.rect(margin + 2.5, 19.5, 5, 1.5, "F");
    doc.rect(margin + 2.5, 22, 3, 1.2, "F");

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(COMPANY_NAME, margin + 13, 21);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 90, 110);
    doc.text(COMPANY_CITY, margin + 13, 27);
    doc.text(COMPANY_PHONE, margin + 13, 32);

    // Right: INVOICE + number
    const invoiceNumStr = invoice.invoiceNumber.replace("INV-", "");
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(`INVOICE ${invoiceNumStr}`, pageW - margin, 21, { align: "right" });

    // Separator line
    doc.setDrawColor(200, 210, 225);
    doc.setLineWidth(0.4);
    doc.line(margin, 38, pageW - margin, 38);

    // ── BILLING INFO ───────────────────────────────────────────────
    const col2X = pageW / 2 + 10;

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 115, 135);
    doc.text("Billed To", margin, 46);
    doc.text("Invoice Number", col2X, 46);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(invoice.clientName, margin, 53);
    doc.text(invoice.invoiceNumber, col2X, 53);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 90, 110);
    doc.text(invoice.clientAddress, margin, 59);

    // Date Issued
    doc.setFontSize(7.5);
    doc.setTextColor(100, 115, 135);
    doc.text("Date Issued", col2X, 60);
    doc.setFontSize(8.5);
    doc.setTextColor(80, 90, 110);
    const issuedDate = new Date(invoice.createdAt).toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric",
    });
    doc.text(issuedDate, col2X, 66);

    // Due Date
    doc.setFontSize(7.5);
    doc.setTextColor(100, 115, 135);
    doc.text("Due Date", col2X, 73);
    doc.setFontSize(8.5);
    doc.setTextColor(80, 90, 110);
    const dueDate = new Date(invoice.createdAt);
    dueDate.setDate(dueDate.getDate() + 30);
    doc.text(dueDate.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }), col2X, 79);

    // ── ITEMS TABLE ────────────────────────────────────────────────
    const tableData = invoice.items.map((item) => [
      item.description,
      item.rate.toFixed(2),
      (item.amount ?? item.rate).toFixed(2),
    ]);

    autoTable(doc, {
      startY: 88,
      head: [["Description", "Rate", "Amount"]],
      body: tableData,
      theme: "plain",
      headStyles: {
        fillColor: [248, 250, 252],
        textColor: [80, 90, 110],
        fontSize: 8,
        fontStyle: "bold",
        lineColor: [200, 210, 225],
        lineWidth: { bottom: 0.4, top: 0.4, left: 0, right: 0 },
        cellPadding: { top: 5, bottom: 5, left: 4, right: 4 },
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [30, 40, 55],
        lineColor: [225, 232, 240],
        lineWidth: { bottom: 0.3, top: 0, left: 0, right: 0 },
        cellPadding: { top: 5, bottom: 5, left: 4, right: 4 },
      },
      columnStyles: {
        0: { cellWidth: "auto", halign: "left" },
        1: { cellWidth: 32, halign: "right" },
        2: { cellWidth: 36, halign: "right" },
      },
      margin: { left: margin, right: margin },
    });

    const finalY: number = (doc as any).lastAutoTable?.finalY ?? 160;

    // ── SUBTOTAL BLOCK ─────────────────────────────────────────────
    const blockX = pageW - margin - 80;
    const blockY = finalY + 8;

    doc.setDrawColor(200, 210, 225);
    doc.setLineWidth(0.3);
    doc.line(blockX, blockY, pageW - margin, blockY);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 90, 110);
    doc.text("SubTotal:", blockX, blockY + 8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(`${total.toFixed(2)}`, pageW - margin, blockY + 8, { align: "right" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 115, 135);
    doc.text("AED", pageW - margin, blockY + 14, { align: "right" });

    doc.setDrawColor(200, 210, 225);
    doc.line(blockX, blockY + 18, pageW - margin, blockY + 18);

    // ── FOOTER ─────────────────────────────────────────────────────
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(160, 170, 185);
    doc.text(`Made with ${COMPANY_NAME} · Digital Invoice Solutions`, pageW / 2, pageH - 10, { align: "center" });

    doc.save(`${invoice.invoiceNumber}.pdf`);
  }, [invoice, total]);

  // ── ON-SCREEN PREVIEW ──────────────────────────────────────────
  const invoiceDate = new Date(invoice.createdAt).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });
  const dueDate = new Date(invoice.createdAt);
  dueDate.setDate(dueDate.getDate() + 30);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back-to-editor">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-xl font-semibold" data-testid="text-preview-title">Invoice Preview</h2>
            <p className="text-sm text-muted-foreground">
              <span className="font-mono font-medium">{invoice.invoiceNumber}</span>
              {" "}&middot; {invoice.clientName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={onNewScan} data-testid="button-new-scan-preview">
            <Plus className="w-4 h-4 mr-2" />
            New Scan
          </Button>
          <Button onClick={generatePDF} data-testid="button-generate-pdf">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Paper-style invoice card */}
      <Card className="p-8 max-w-2xl mx-auto shadow-md bg-white dark:bg-card">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          {/* Left: company */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded bg-primary flex items-center justify-center flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="2" y="3" width="10" height="1.8" rx="0.5" fill="white"/>
                  <rect x="2" y="6.2" width="10" height="1.8" rx="0.5" fill="white"/>
                  <rect x="2" y="9.2" width="6" height="1.5" rx="0.5" fill="white"/>
                </svg>
              </div>
              <span className="text-base font-bold text-foreground">{COMPANY_NAME}</span>
            </div>
            <p className="text-xs text-muted-foreground">{COMPANY_CITY}</p>
            <p className="text-xs text-muted-foreground">{COMPANY_PHONE}</p>
          </div>
          {/* Right: invoice title */}
          <div className="text-right">
            <p className="text-2xl font-bold text-foreground tracking-tight">
              INVOICE {invoice.invoiceNumber.replace("INV-", "")}
            </p>
          </div>
        </div>

        <hr className="border-border mb-5" />

        {/* Billing + invoice meta */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Billed To</p>
            <p className="text-sm font-bold text-foreground">{invoice.clientName}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{invoice.clientAddress}</p>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Invoice Number</p>
              <p className="text-sm font-semibold text-foreground font-mono">{invoice.invoiceNumber}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Date Issued</p>
              <p className="text-xs text-muted-foreground">{invoiceDate}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Due Date</p>
              <p className="text-xs text-muted-foreground">
                {dueDate.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
        </div>

        {/* Items table */}
        <div className="border border-border rounded-sm overflow-hidden mb-5">
          <table className="w-full" data-testid="table-preview-items">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-2.5">
                  Description
                </th>
                <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-2.5 w-24">
                  Rate
                </th>
                <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-2.5 w-28">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => (
                <tr
                  key={item.id}
                  className="border-b border-border/60 last:border-b-0"
                  data-testid={`row-preview-${i}`}
                >
                  <td className="px-4 py-2.5 text-sm font-mono font-medium text-foreground">
                    {item.description}
                  </td>
                  <td className="px-4 py-2.5 text-sm text-right font-mono text-muted-foreground">
                    {item.rate.toFixed(2)}
                  </td>
                  <td className="px-4 py-2.5 text-sm text-right font-mono font-semibold text-foreground">
                    {(item.amount ?? item.rate).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Subtotal block */}
        <div className="flex justify-end">
          <div className="min-w-[200px] border-t border-border pt-3 space-y-1">
            <div className="flex items-center justify-between gap-8">
              <span className="text-sm text-muted-foreground">SubTotal:</span>
              <span className="text-sm font-semibold font-mono" data-testid="text-preview-total">
                {total.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-end">
              <span className="text-xs text-muted-foreground">AED</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-border/50">
          <p className="text-[10px] text-center text-muted-foreground/60">
            Made with {COMPANY_NAME} &middot; Digital Invoice Solutions
          </p>
        </div>
      </Card>
    </div>
  );
}
