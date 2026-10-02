import { useCallback, useState } from "react";
import { ArrowLeft, Download, Plus, AlertTriangle, Printer } from "lucide-react";
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
  const generatePDF = useCallback(async (action: "download" | "preview" | "print" = "download") => {
    try {
      const { jsPDF } = await import("jspdf");
      const autoTableModule = await import("jspdf-autotable");
      const autoTable = autoTableModule.default || (autoTableModule as any);

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const L     = 16;
      const R     = pageW - 16;

      // ── Brand colors from logo: navy, teal, gold ──
      const NAVY   = [21, 40, 82]   as [number,number,number];
      const TEAL   = [0, 128, 115]  as [number,number,number];
      const GOLD   = [183, 138, 0]  as [number,number,number];
      const GRAY   = [100, 110, 125] as [number,number,number];
      const DARK   = [25, 30, 42]   as [number,number,number];
      const LGRAY  = [215, 220, 228] as [number,number,number];

      // ── LOGO IMAGE (top-left) ──
      const maxLogoW = 18;
      const maxLogoH = 18;
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
        const logoY = 9 + (maxLogoH - logoH) / 2;
        doc.addImage(logoBase64, "PNG", L, logoY, logoW, logoH);
      } catch {
        doc.setFillColor(...NAVY);
        doc.roundedRect(L, 9, maxLogoW, maxLogoH, 2, 2, "F");
        logoW = maxLogoW;
      }

      // Company info (right of logo)
      const infoX = L + logoW + 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(...NAVY);
      doc.text(CO_NAME, infoX, 13.5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...GRAY);
      doc.text(CO_CITY,  infoX, 17.5);
      doc.text(CO_PHONE, infoX, 21.5);
      doc.text(CO_EMAIL, infoX, 25.5);

      // ── INVOICE TITLE — top-right ──
      const invNum = editedInvoiceNumber.replace("INV-", "");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...TEAL);
      doc.text("INVOICE", R, 13.5, { align: "right" });

      doc.setFontSize(22);
      doc.setTextColor(...NAVY);
      doc.text(`#${invNum}`, R, 24.5, { align: "right" });

      // First Separator line
      doc.setDrawColor(...LGRAY);
      doc.setLineWidth(0.4);
      doc.line(L, 29, R, 29);

      // ── BILLING & METADATA SECTION — balanced single-row 3 columns ──
      const secY = 34.5;
      const colMid = 100;
      const colRight = 155;

      // Col 1: Billed To
      doc.setFontSize(6.8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...TEAL);
      doc.text("BILLED TO", L, secY);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...DARK);
      doc.text(invoice.clientName, L, secY + 4.5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...GRAY);
      doc.text(invoice.clientAddress, L, secY + 8.5);

      // Col 2: Invoice Number
      doc.setFontSize(6.8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...TEAL);
      doc.text("INVOICE NUMBER", colMid, secY);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...DARK);
      doc.text(editedInvoiceNumber, colMid, secY + 4.5);

      // Col 3: Date Issued
      doc.setFontSize(6.8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...TEAL);
      doc.text("DATE ISSUED", colRight, secY);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...DARK);
      const issuedStr = new Date(editedDate).toLocaleDateString("en-GB", {
        day: "numeric", month: "long", year: "numeric",
      });
      doc.text(issuedStr, colRight, secY + 4.5);

      // Second separator line
      doc.setDrawColor(...LGRAY);
      doc.line(L, 46.5, R, 46.5);

      // ── ITEMS TABLE ──
      const tableData = invoice.items.map((item) => {
        const qtySuffix = item.quantity && item.quantity > 1 ? ` (x${item.quantity})` : "";
        const desc = `${item.description}${qtySuffix}`;
        const rate = (item.rate ?? 0).toFixed(2);
        const amount = (item.amount !== undefined && item.amount !== null
          ? item.amount
          : (item.rate ?? 0) * (item.quantity || 1)
        ).toFixed(2);
        return [desc, rate, amount];
      });

      autoTable(doc, {
        startY: 49.5,
        head: [["Description", "Rate (AED)", "Amount (AED)"]],
        body: tableData,
        theme: "plain",
        headStyles: {
          fillColor: [238, 242, 249],
          textColor: NAVY,
          fontSize: 7.5,
          fontStyle: "bold",
          cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
          lineColor: LGRAY,
          lineWidth: { bottom: 0.4, top: 0, left: 0, right: 0 },
        },
        bodyStyles: {
          fontSize: 8,
          textColor: DARK,
          lineColor: LGRAY,
          lineWidth: { bottom: 0.25, top: 0, left: 0, right: 0 },
          cellPadding: { top: 2.6, bottom: 2.6, left: 4, right: 4 },
        },
        alternateRowStyles: { fillColor: [248, 250, 253] },
        columnStyles: {
          0: { halign: "left",  cellWidth: "auto" },
          1: { halign: "right", cellWidth: 32, font: "courier" },
          2: { halign: "right", cellWidth: 36, font: "courier", fontStyle: "bold" },
        },
        margin: { left: L, right: 16 },
      });

      const finalY: number = (doc as any).lastAutoTable?.finalY ?? 95;

      // ── TOTALS BLOCK ──
      const boxW = 76;
      const bX = R - boxW;
      const boxH = 19;
      const needed = boxH + 14;
      const tY = (finalY + needed > pageH - 14)
        ? (doc.addPage(), 14)
        : finalY + 5;

      // Filled highlight box behind the total
      doc.setFillColor(245, 237, 214); // soft gold tint
      doc.roundedRect(bX, tY, boxW, boxH, 2, 2, "F");
      doc.setDrawColor(...GOLD);
      doc.setLineWidth(0.5);
      doc.roundedRect(bX, tY, boxW, boxH, 2, 2, "S");

      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...GRAY);
      doc.text("TOTAL DUE", bX + 5, tY + 6.5);

      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...TEAL);
      doc.text("AED", bX + 5, tY + 14);

      doc.setFont("courier", "bold");
      doc.setFontSize(17);
      doc.setTextColor(...GOLD);
      doc.text(total.toFixed(2), R - 5, tY + 14, { align: "right" });

      // ── FOOTER ──
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(180, 185, 195);
        doc.text(
          `${CO_NAME} · ${CO_CITY} · ${CO_EMAIL}`,
          pageW / 2,
          pageH - 7,
          { align: "center" }
        );
      }

      // Convert PDF to Blob and Blob URL for reliable browser rendering & printing
      const pdfBlob = doc.output("blob");
      const blobUrl = URL.createObjectURL(pdfBlob);

      if (action === "download") {
        doc.save(`${editedInvoiceNumber}.pdf`);
      } else {
        // "preview" or "print": Open Blob URL in new tab for native PDF viewer & printing
        const pdfWindow = window.open(blobUrl, "_blank");
        if (!pdfWindow) {
          // Fallback if popup blocked
          doc.save(`${editedInvoiceNumber}.pdf`);
        }
      }
    } catch (err) {
      console.error("[PDF] generation error:", err);
      alert("PDF generation failed: " + (err instanceof Error ? err.message : String(err)));
    }
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
            variant="outline"
            onClick={() => generatePDF("print")}
            className="gap-2"
            data-testid="button-print-pdf"
          >
            <Printer className="w-4 h-4" />
            Print PDF
          </Button>
          <Button
            onClick={() => generatePDF("download")}
            className="gap-2"
            data-testid="button-generate-pdf"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* ── Invoice Sheet ── */}
      <div className="bg-card border border-border rounded-xl shadow-md overflow-hidden animate-slide-up print:border-none print:shadow-none">
        <div className="p-6 md:p-8">

          {/* Top Header: Logo & Company on Left, Invoice Title & # on Right */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
            {/* Left: logo + company */}
            <div className="flex items-center gap-3.5">
              <img
                src={logoSrc}
                alt="SAFI Digitizer"
                className="w-12 h-12 object-contain rounded-lg shrink-0"
              />
              <div>
                <p className="text-base font-bold text-foreground leading-tight">{CO_NAME}</p>
                <p className="text-xs text-muted-foreground leading-tight mt-0.5">{CO_CITY}</p>
                <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                  {CO_PHONE} &middot; {CO_EMAIL}
                </p>
              </div>
            </div>

            {/* Right: invoice title + number */}
            <div className="sm:text-right">
              <p className="text-[10px] font-label uppercase tracking-widest text-teal-600 dark:text-teal-400 font-bold mb-0.5">
                INVOICE
              </p>
              <p className="text-3xl sm:text-4xl font-extrabold tracking-tighter text-foreground leading-none">
                #{invoiceNum}
              </p>
            </div>
          </div>

          {/* Under-header Section: Billed To, Invoice Number, Date Issued in a balanced horizontal row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-3.5 border-b border-border/80">
            {/* Billed To */}
            <div className="space-y-0.5">
              <span className="text-[10px] font-label uppercase tracking-widest text-teal-600 dark:text-teal-400 font-bold block">
                BILLED TO
              </span>
              <p className="text-sm font-bold text-foreground leading-tight">{invoice.clientName}</p>
              <p className="text-xs text-muted-foreground">{invoice.clientAddress}</p>
            </div>

            {/* Invoice number — editable */}
            <div className="space-y-1">
              <Label
                htmlFor="input-invoice-number"
                className="text-[10px] font-label uppercase tracking-widest text-teal-600 dark:text-teal-400 font-bold block"
              >
                INVOICE NUMBER
              </Label>
              <Input
                id="input-invoice-number"
                value={editedInvoiceNumber}
                onChange={(e) => setEditedInvoiceNumber(e.target.value)}
                className="h-8 w-full max-w-[170px] text-xs font-mono font-semibold px-2.5 bg-muted/20 border-border/60"
                data-testid="input-invoice-number"
              />
            </div>

            {/* Date issued — editable */}
            <div className="space-y-1 sm:text-right sm:flex sm:flex-col sm:items-end">
              <Label
                htmlFor="input-date-issued"
                className="text-[10px] font-label uppercase tracking-widest text-teal-600 dark:text-teal-400 font-bold block"
              >
                DATE ISSUED
              </Label>
              <Input
                id="input-date-issued"
                type="date"
                value={editedDate}
                onChange={(e) => setEditedDate(e.target.value)}
                className="h-8 w-full max-w-[170px] sm:text-right text-xs px-2.5 bg-muted/20 border-border/60"
                data-testid="input-date-issued"
              />
            </div>
          </div>

          {/* Items table */}
          <div className="mt-5">
            <table className="w-full text-left border-collapse" data-testid="table-preview-items">
              <thead>
                <tr className="border-b-2 border-border" style={{ backgroundColor: "hsl(217 60% 96%)" }}>
                  <th className="py-2.5 px-4 text-[10px] font-label uppercase tracking-widest"
                    style={{ color: "hsl(217 60% 35%)" }}>
                    Description
                  </th>
                  <th className="py-2.5 px-4 text-[10px] font-label uppercase tracking-widest text-right w-32"
                    style={{ color: "hsl(217 60% 35%)" }}>
                    Rate
                  </th>
                  <th className="py-2.5 px-4 text-[10px] font-label uppercase tracking-widest text-right w-36"
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
                    <td className="py-2.5 px-4 text-sm font-mono text-foreground">
                      {item.description}
                      {item.quantity && item.quantity > 1 && (
                        <span className="text-xs font-sans text-muted-foreground ml-2">(x{item.quantity})</span>
                      )}
                      {item.isUncertain && (
                        <AlertTriangle className="inline w-3 h-3 text-amber-500 ml-2 mb-0.5" />
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-sm text-right font-mono text-muted-foreground tabular-nums">
                      {(item.rate ?? 0).toFixed(2)} AED
                    </td>
                    <td className="py-2.5 px-4 text-sm text-right font-mono font-semibold text-foreground tabular-nums">
                      {(item.amount !== undefined && item.amount !== null
                        ? item.amount
                        : (item.rate ?? 0) * (item.quantity || 1)
                      ).toFixed(2)} AED
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="pt-2 pb-0 px-4">
                    <div className="flex justify-end">
                      <div
                        className="flex items-center justify-between gap-6 px-4 py-2.5 rounded-lg mt-2 mb-1"
                        style={{ background: "hsl(43 80% 93%)", border: "1.5px solid hsl(43 70% 65%)", minWidth: 200 }}
                        data-testid="text-preview-total"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-label uppercase tracking-widest font-bold" style={{ color: "hsl(174 60% 35%)" }}>
                            AED
                          </span>
                          <span className="text-[10px] font-label uppercase tracking-widest text-muted-foreground">
                            Total Due
                          </span>
                        </div>
                        <span
                          className="text-xl font-mono font-extrabold tabular-nums"
                          style={{ color: "hsl(43 85% 35%)" }}
                        >
                          {total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-muted/30 px-6 md:px-8 py-2.5">
          <p className="text-[10px] text-center font-label tracking-wider text-muted-foreground/60 uppercase">
            {CO_NAME} &middot; {CO_CITY} &middot; {CO_EMAIL}
          </p>
        </div>
      </div>
    </div>
  );
}
