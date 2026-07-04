import { useCallback, useState } from "react";
import { ArrowLeft, Download, Plus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Invoice, InvoiceItem } from "@shared/schema";
import logoSrc from "@assets/LogoSafi-Digitizer_1782979058152.png";

interface InvoicePreviewProps {
  invoice: Invoice & { items: InvoiceItem[] };
  onBack: () => void;
  onNewScan: () => void;
}

const CO_NAME  = "Safiullah";
const CO_CITY  = "ISLAMABAD, Pakistan";
const CO_PHONE = "+923490896977";
const CO_EMAIL = "Safi.embdr@gmail.com";

/* Helper: fetch an image URL and return base64 data URL */
async function imgToBase64(src: string): Promise<string> {
  const r = await fetch(src);
  const blob = await r.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

function toDateInputValue(d: string | Date): string {
  const date = new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function InvoicePreview({ invoice, onBack, onNewScan }: InvoicePreviewProps) {
  const total = invoice.items.reduce((sum, item) => sum + (item.amount ?? item.rate), 0);

  // Editable invoice number & date — user can override before printing to PDF
  const [editedInvoiceNumber, setEditedInvoiceNumber] = useState(invoice.invoiceNumber);
  const [editedDate, setEditedDate] = useState(toDateInputValue(invoice.createdAt));

  /* ── PDF GENERATION ── */
  const generatePDF = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable  = (await import("jspdf-autotable")).default;

    const doc  = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const L     = 18;
    const R     = pageW - 18;

    // ── Brand colors from logo: navy, teal, gold ──
    const NAVY   = [21, 40, 82]   as [number,number,number];
    const TEAL   = [0, 128, 115]  as [number,number,number];
    const GOLD   = [183, 138, 0]  as [number,number,number];
    const GRAY   = [100, 110, 125] as [number,number,number];
    const DARK   = [25, 30, 42]   as [number,number,number];
    const LGRAY  = [210, 215, 225] as [number,number,number];

    // ── LOGO IMAGE (top-left) — preserve aspect ratio, don't stretch ──
    const maxLogoW = 22;
    const maxLogoH = 22;
    let logoW = maxLogoW;
    let logoH = maxLogoH;
    try {
      const logoBase64 = await imgToBase64(logoSrc);
      const props = doc.getImageProperties(logoBase64);
      const ratio = props.width / props.height;
      if (ratio >= 1) {
        logoW = maxLogoW;
        logoH = maxLogoW / ratio;
      } else {
        logoH = maxLogoH;
        logoW = maxLogoH * ratio;
      }
      // vertically center the logo within the max box so text baseline aligns consistently
      const logoY = 10 + (maxLogoH - logoH) / 2;
      doc.addImage(logoBase64, "PNG", L, logoY, logoW, logoH);
    } catch {
      // fallback square if image fails
      doc.setFillColor(...NAVY);
      doc.roundedRect(L, 10, maxLogoW, maxLogoH, 2, 2, "F");
      logoW = maxLogoW;
    }

    // Company info (right of logo) — offset based on actual logo width
    const infoX = L + logoW + 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...NAVY);
    doc.text(CO_NAME, infoX, 17);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    doc.text(CO_CITY,  infoX, 22.5);
    doc.text(CO_PHONE, infoX, 27);
    doc.text(CO_EMAIL, infoX, 31.5);

    // ── INVOICE TITLE — top-right, single line "INVOICE #44" ──
    const invNum = editedInvoiceNumber.replace("INV-", "");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...TEAL);
    doc.text("INVOICE", R, 18, { align: "right" });

    doc.setFontSize(26);
    doc.setTextColor(...NAVY);
    doc.text(`#${invNum}`, R, 32, { align: "right" });

    // Separator
    doc.setDrawColor(...LGRAY);
    doc.setLineWidth(0.5);
    doc.line(L, 38, R, 38);

    // ── BILLING SECTION — 2 columns, balanced ──
    const colR = pageW / 2 + 5;
    const secY = 46;

    // LEFT: Billed To
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...TEAL);
    doc.text("BILLED TO", L, secY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...DARK);
    doc.text(invoice.clientName, L, secY + 7);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...GRAY);
    doc.text(invoice.clientAddress, L, secY + 13.5);

    // RIGHT: Invoice Number + Date Issued only (no Due Date)
    let rY = secY;

    // Invoice Number
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...TEAL);
    doc.text("INVOICE NUMBER", colR, rY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    doc.text(editedInvoiceNumber, colR, rY + 6.5);

    rY += 16;

    // Date Issued
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...TEAL);
    doc.text("DATE ISSUED", colR, rY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...GRAY);
    const issuedStr = new Date(editedDate).toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric",
    });
    doc.text(issuedStr, colR, rY + 6.5);

    // Second separator
    doc.setDrawColor(...LGRAY);
    doc.line(L, 82, R, 82);

    // ── ITEMS TABLE ──
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
        fillColor: [235, 240, 248],
        textColor: NAVY,
        fontSize: 7.5,
        fontStyle: "bold",
        cellPadding: { top: 6, bottom: 6, left: 5, right: 5 },
        lineColor: LGRAY,
        lineWidth: { bottom: 0.5, top: 0, left: 0, right: 0 },
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: DARK,
        lineColor: LGRAY,
        lineWidth: { bottom: 0.3, top: 0, left: 0, right: 0 },
        cellPadding: { top: 6, bottom: 6, left: 5, right: 5 },
      },
      alternateRowStyles: { fillColor: [247, 249, 252] },
      columnStyles: {
        0: { halign: "left",  cellWidth: "auto" },
        1: { halign: "right", cellWidth: 30, font: "courier" },
        2: { halign: "right", cellWidth: 34, font: "courier", fontStyle: "bold" },
      },
      margin: { left: L, right: 18 },
    });

    const finalY: number = (doc as any).lastAutoTable?.finalY ?? 160;

    // ── TOTALS BLOCK — big, bold, highlighted (main focal point) ──
    const boxW = 82;
    const bX = R - boxW;
    const tY = finalY + 10;
    const boxH = 26;

    // Filled highlight box behind the total
    doc.setFillColor(245, 237, 214); // soft gold tint
    doc.roundedRect(bX, tY, boxW, boxH, 2, 2, "F");
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.6);
    doc.roundedRect(bX, tY, boxW, boxH, 2, 2, "S");

    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...GRAY);
    doc.text("TOTAL DUE", bX + 6, tY + 10);

    doc.setFont("courier", "bold");
    doc.setFontSize(22);
    doc.setTextColor(...GOLD);
    doc.text(total.toFixed(2), R - 6, tY + 20, { align: "right" });

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...TEAL);
    doc.text("AED", bX + 6, tY + 20);

    // ── FOOTER ──
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(190, 195, 205);
    doc.text(
      `${CO_NAME} · ${CO_CITY} · ${CO_EMAIL}`,
      pageW / 2,
      pageH - 10,
      { align: "center" }
    );

    doc.save(`${editedInvoiceNumber}.pdf`);
  }, [invoice, total, editedInvoiceNumber, editedDate]);

  /* ── ON-SCREEN PREVIEW ── */
  const invoiceNum = editedInvoiceNumber.replace("INV-", "");
  const issuedDate = new Date(editedDate).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap animate-slide-down">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="rounded-lg hover:bg-muted transition-colors"
            data-testid="button-back-to-editor"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2
              className="text-lg font-bold tracking-tight text-foreground"
              data-testid="text-preview-title"
            >
              Invoice Preview
            </h2>
            <p className="text-xs font-label uppercase tracking-wider text-muted-foreground">
              {editedInvoiceNumber} &middot; {invoice.clientName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onNewScan}
            className="gap-2"
            data-testid="button-new-scan-preview"
          >
            <Plus className="w-4 h-4" />
            New Scan
          </Button>
          <Button
            onClick={generatePDF}
            className="gap-2"
            data-testid="button-generate-pdf"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* ── Invoice Sheet ── */}
      <div className="bg-card border border-border rounded-xl shadow-md overflow-hidden animate-slide-up">
        <div className="p-8 md:p-12">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6 pb-8 border-b-2 border-border">
            {/* Left: logo + company */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={logoSrc}
                  alt="SAFI Digitizer"
                  className="w-14 h-14 object-contain rounded-lg"
                />
                <div>
                  <p className="text-base font-bold text-foreground">{CO_NAME}</p>
                  <p className="text-xs text-muted-foreground">{CO_CITY}</p>
                  <p className="text-xs text-muted-foreground">{CO_PHONE}</p>
                  <p className="text-xs text-muted-foreground">{CO_EMAIL}</p>
                </div>
              </div>
            </div>

            {/* Right: invoice title + meta */}
            <div className="text-right">
              <p className="text-[10px] font-label uppercase tracking-widest text-teal-600 dark:text-teal-400 mb-0.5">
                Invoice
              </p>
              <p className="text-4xl md:text-5xl font-extrabold tracking-tighter text-foreground leading-none">
                #{invoiceNum}
              </p>

              <div className="mt-5 flex flex-col gap-3 items-end">
                {/* Billed To — inline */}
                <div className="flex items-start gap-6 justify-end">
                  <span className="text-[10px] font-label uppercase tracking-widest text-muted-foreground pt-0.5">
                    Bill To:
                  </span>
                  <div className="text-right text-sm">
                    <p className="font-bold text-foreground">{invoice.clientName}</p>
                    <p className="text-muted-foreground">{invoice.clientAddress}</p>
                  </div>
                </div>

                {/* Invoice number — editable */}
                <div className="flex items-center gap-6 justify-end">
                  <Label
                    htmlFor="input-invoice-number"
                    className="text-[10px] font-label uppercase tracking-widest text-muted-foreground whitespace-nowrap"
                  >
                    Invoice Number
                  </Label>
                  <Input
                    id="input-invoice-number"
                    value={editedInvoiceNumber}
                    onChange={(e) => setEditedInvoiceNumber(e.target.value)}
                    className="h-7 w-28 text-right text-sm font-mono font-semibold px-2"
                    data-testid="input-invoice-number"
                  />
                </div>

                {/* Date issued — editable */}
                <div className="flex items-center gap-6 justify-end">
                  <Label
                    htmlFor="input-date-issued"
                    className="text-[10px] font-label uppercase tracking-widest text-muted-foreground whitespace-nowrap"
                  >
                    Date Issued
                  </Label>
                  <Input
                    id="input-date-issued"
                    type="date"
                    value={editedDate}
                    onChange={(e) => setEditedDate(e.target.value)}
                    className="h-7 w-36 text-right text-sm px-2"
                    data-testid="input-date-issued"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Items table */}
          <div className="mt-8">
            <table className="w-full text-left border-collapse" data-testid="table-preview-items">
              <thead>
                <tr className="border-b-2 border-border" style={{ backgroundColor: "hsl(217 60% 96%)" }}>
                  <th className="py-3 px-4 text-[10px] font-label uppercase tracking-widest"
                    style={{ color: "hsl(217 60% 35%)" }}>
                    Description
                  </th>
                  <th className="py-3 px-4 text-[10px] font-label uppercase tracking-widest text-right w-32"
                    style={{ color: "hsl(217 60% 35%)" }}>
                    Rate
                  </th>
                  <th className="py-3 px-4 text-[10px] font-label uppercase tracking-widest text-right w-36"
                    style={{ color: "hsl(217 60% 35%)" }}>
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, i) => (
                  <tr
                    key={item.id}
                    className="border-b border-border/50 last:border-b-0 hover:bg-muted/20 transition-colors"
                    data-testid={`row-preview-${i}`}
                  >
                    <td className="py-3.5 px-4 text-sm font-mono text-foreground">
                      {item.description}
                      {item.isUncertain && (
                        <AlertTriangle className="inline w-3 h-3 text-amber-500 ml-2 mb-0.5" />
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-sm text-right font-mono text-muted-foreground tabular-nums">
                      {item.rate.toFixed(2)} AED
                    </td>
                    <td className="py-3.5 px-4 text-sm text-right font-mono font-semibold text-foreground tabular-nums">
                      {(item.amount ?? item.rate).toFixed(2)} AED
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-8 flex justify-end">
            <div className="min-w-[220px] space-y-2">
              <div className="border-t border-border pt-4 space-y-1.5">
                <div className="flex items-center justify-between gap-10">
                  <span className="text-sm text-muted-foreground">SubTotal:</span>
                  <span
                    className="text-sm font-mono font-bold tabular-nums"
                    style={{ color: "hsl(43 85% 35%)" }}
                    data-testid="text-preview-total"
                  >
                    {total.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-end">
                  <span className="text-[10px] font-label uppercase tracking-widest"
                    style={{ color: "hsl(174 60% 35%)" }}>
                    AED
                  </span>
                </div>
              </div>
              <div className="border-t border-border/60 pt-1" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-muted/30 px-8 md:px-12 py-3">
          <p className="text-[10px] text-center font-label tracking-wider text-muted-foreground/60 uppercase">
            {CO_NAME} &middot; {CO_CITY} &middot; {CO_EMAIL}
          </p>
        </div>
      </div>
    </div>
  );
}
