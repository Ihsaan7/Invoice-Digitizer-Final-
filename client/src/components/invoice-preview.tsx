import { useCallback } from "react";
import { ArrowLeft, Download, Plus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Invoice, InvoiceItem } from "@shared/schema";

interface InvoicePreviewProps {
  invoice: Invoice & { items: InvoiceItem[] };
  onBack: () => void;
  onNewScan: () => void;
}

const CO_NAME  = "DigiBill";
const CO_CITY  = "ISLAMABAD, Pakistan";
const CO_PHONE = "+923490896977";
const CO_EMAIL = "info@digibill.io";

export function InvoicePreview({ invoice, onBack, onNewScan }: InvoicePreviewProps) {
  const total = invoice.items.reduce((sum, item) => sum + (item.amount ?? item.rate), 0);

  /* ── PDF generation – matches INV-43 layout ── */
  const generatePDF = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc   = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const L     = 18;
    const R     = pageW - 18;

    // ── HEADER: logo square ──
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(L, 12, 11, 11, 1.5, 1.5, "F");
    // lines in logo
    [[L+2.5,15.5,8.5],[L+2.5,18.2,8.5],[L+2.5,20.8,5.5]].forEach(([x,y,w])=>{
      doc.setFillColor(255,255,255);
      doc.rect(x,y,w,1.5,"F");
    });

    // Company name
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(CO_NAME, L + 14, 19.5);

    // Company details
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 110, 125);
    doc.text(CO_CITY,  L + 14, 25);
    doc.text(CO_PHONE, L + 14, 30);
    doc.text(CO_EMAIL, L + 14, 35);

    // Invoice title – top right
    const invNum = invoice.invoiceNumber.replace("INV-", "");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42);
    doc.text(`INVOICE`, R, 22, { align: "right" });
    doc.setFontSize(28);
    doc.setTextColor(15, 23, 42);
    doc.text(`#${invNum}`, R, 34, { align: "right" });

    // separator
    doc.setDrawColor(210, 215, 225);
    doc.setLineWidth(0.5);
    doc.line(L, 42, R, 42);

    // ── BILLING SECTION ──
    const colR = pageW / 2 + 8;
    const y0   = 50;

    // Left: Billed To
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 130, 145);
    doc.text("BILLED TO", L, y0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(invoice.clientName, L, y0 + 6.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(90, 100, 115);
    doc.text(invoice.clientAddress, L, y0 + 13);

    // Right: Invoice meta
    const metaRows: [string, string][] = [
      ["INVOICE NUMBER", invoice.invoiceNumber],
      ["DATE ISSUED",    new Date(invoice.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })],
      ["DUE DATE",       (() => { const d = new Date(invoice.createdAt); d.setDate(d.getDate()+30); return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }); })()],
    ];
    let mY = y0;
    metaRows.forEach(([label, val], i) => {
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120, 130, 145);
      doc.text(label, colR, mY + (i === 0 ? 0 : 0));
      doc.setFontSize(9);
      doc.setFont(i === 0 ? "helvetica" : "helvetica", i === 0 ? "bold" : "normal");
      doc.setTextColor(15, 23, 42);
      doc.text(val, colR, mY + 5.5);
      mY += 14;
    });

    // separator
    doc.setDrawColor(210, 215, 225);
    doc.setLineWidth(0.4);
    doc.line(L, 90, R, 90);

    // ── ITEMS TABLE ──
    const tableData = invoice.items.map(item => [
      item.description,
      item.rate.toFixed(2),
      (item.amount ?? item.rate).toFixed(2),
    ]);

    autoTable(doc, {
      startY: 96,
      head: [["Description", "Rate", "Amount"]],
      body: tableData,
      theme: "plain",
      headStyles: {
        fillColor: [243, 244, 246],
        textColor: [100, 110, 125],
        fontSize: 7.5,
        fontStyle: "bold",
        cellPadding: { top: 6, bottom: 6, left: 5, right: 5 },
        lineColor: [210, 215, 225],
        lineWidth: { bottom: 0.5, top: 0.5, left: 0, right: 0 },
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [30, 38, 50],
        lineColor: [225, 230, 238],
        lineWidth: { bottom: 0.3, top: 0, left: 0, right: 0 },
        cellPadding: { top: 6, bottom: 6, left: 5, right: 5 },
      },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      columnStyles: {
        0: { halign: "left",  cellWidth: "auto" },
        1: { halign: "right", cellWidth: 30, font: "courier" },
        2: { halign: "right", cellWidth: 34, font: "courier", fontStyle: "bold" },
      },
      margin: { left: L, right: 18 },
    });

    const finalY: number = (doc as any).lastAutoTable?.finalY ?? 160;

    // ── TOTALS BLOCK ──
    const bX  = R - 72;
    const tY  = finalY + 10;

    doc.setDrawColor(210, 215, 225);
    doc.setLineWidth(0.4);
    doc.line(bX, tY, R, tY);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(90, 100, 115);
    doc.text("SubTotal:", bX, tY + 8);

    doc.setFont("courier", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(total.toFixed(2), R, tY + 8, { align: "right" });

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 130, 145);
    doc.text("AED", R, tY + 15, { align: "right" });

    doc.setDrawColor(210, 215, 225);
    doc.line(bX, tY + 20, R, tY + 20);

    // ── FOOTER ──
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(170, 178, 190);
    doc.text(`Made with ${CO_NAME} · Digital Invoice Solutions`, pageW / 2, pageH - 10, { align: "center" });

    doc.save(`${invoice.invoiceNumber}.pdf`);
  }, [invoice, total]);

  /* ── ON-SCREEN PREVIEW ── */
  const invoiceNum = invoice.invoiceNumber.replace("INV-", "");
  const issuedDate = new Date(invoice.createdAt).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });
  const dueDate = new Date(invoice.createdAt);
  dueDate.setDate(dueDate.getDate() + 30);
  const dueDateStr = dueDate.toLocaleDateString("en-GB", {
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
              {invoice.invoiceNumber} &middot; {invoice.clientName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onNewScan}
            className="gap-2 transition-all hover:shadow-sm"
            data-testid="button-new-scan-preview"
          >
            <Plus className="w-4 h-4" />
            New Scan
          </Button>
          <Button
            onClick={generatePDF}
            className="gap-2 transition-all hover:shadow-md"
            data-testid="button-generate-pdf"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* ── Invoice "Sheet" – matches ProInvoice reference design ── */}
      <div className="bg-card border border-border rounded-xl shadow-md overflow-hidden animate-slide-up">
        {/* Sheet inner padding */}
        <div className="p-8 md:p-12">

          {/* ── Header section ── */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6 pb-8 border-b-2 border-border">
            {/* Left: company */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-foreground flex items-center justify-center flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="2.5" y="3.5" width="11" height="2" rx="0.6" fill="white"/>
                    <rect x="2.5" y="7" width="11" height="2" rx="0.6" fill="white"/>
                    <rect x="2.5" y="10.5" width="7" height="1.8" rx="0.6" fill="white"/>
                  </svg>
                </div>
                <span className="text-lg font-bold tracking-tight text-foreground">{CO_NAME}</span>
              </div>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-0.5">
                <p>{CO_CITY}</p>
                <p>{CO_PHONE}</p>
                <p>{CO_EMAIL}</p>
              </div>
            </div>

            {/* Right: invoice title + meta */}
            <div className="text-right">
              <p className="text-4xl md:text-5xl font-extrabold tracking-tighter text-foreground leading-none">
                Invoice-{invoiceNum}
              </p>

              <div className="mt-6 flex flex-col gap-3 items-end">
                {/* Billed To */}
                <div className="flex items-start gap-6 justify-end">
                  <span className="text-[10px] font-label uppercase tracking-widest text-muted-foreground pt-0.5">
                    Bill To:
                  </span>
                  <div className="text-right text-sm">
                    <p className="font-bold text-foreground">{invoice.clientName}</p>
                    <p className="text-muted-foreground">{invoice.clientAddress}</p>
                  </div>
                </div>

                {/* Invoice number */}
                <div className="flex items-center gap-6 justify-end">
                  <span className="text-[10px] font-label uppercase tracking-widest text-muted-foreground">
                    Invoice Number
                  </span>
                  <span className="text-sm font-mono font-semibold text-foreground">
                    {invoice.invoiceNumber}
                  </span>
                </div>

                {/* Date */}
                <div className="flex items-center gap-6 justify-end">
                  <span className="text-[10px] font-label uppercase tracking-widest text-muted-foreground">
                    Date Issued
                  </span>
                  <span className="text-sm text-muted-foreground">{issuedDate}</span>
                </div>

                {/* Due */}
                <div className="flex items-center gap-6 justify-end">
                  <span className="text-[10px] font-label uppercase tracking-widest text-muted-foreground">
                    Due Date
                  </span>
                  <span className="text-sm text-muted-foreground">{dueDateStr}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Items table ── */}
          <div className="mt-8">
            <table className="w-full text-left border-collapse" data-testid="table-preview-items">
              <thead>
                <tr className="border-b-2 border-border bg-muted/40">
                  <th className="py-3 px-4 text-[10px] font-label uppercase tracking-widest text-muted-foreground">
                    Description
                  </th>
                  <th className="py-3 px-4 text-[10px] font-label uppercase tracking-widest text-muted-foreground text-right w-32">
                    Rate
                  </th>
                  <th className="py-3 px-4 text-[10px] font-label uppercase tracking-widest text-muted-foreground text-right w-36">
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
                    <td className="py-3.5 px-4 text-sm text-foreground font-mono">
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

          {/* ── Totals block – bottom right ── */}
          <div className="mt-8 flex justify-end">
            <div className="min-w-[220px] space-y-2">
              <div className="border-t border-border pt-4 space-y-1.5">
                <div className="flex items-center justify-between gap-10">
                  <span className="text-sm text-muted-foreground">SubTotal:</span>
                  <span
                    className="text-sm font-mono font-semibold tabular-nums text-foreground"
                    data-testid="text-preview-total"
                  >
                    {total.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-end">
                  <span className="text-[10px] font-label uppercase tracking-widest text-muted-foreground">
                    AED
                  </span>
                </div>
              </div>
              <div className="border-t border-border/60 pt-1" />
            </div>
          </div>

        </div>

        {/* Sheet footer band */}
        <div className="border-t border-border bg-muted/30 px-8 md:px-12 py-3">
          <p className="text-[10px] text-center font-label tracking-wider text-muted-foreground/60 uppercase">
            Made with {CO_NAME} &middot; Digital Invoice Solutions
          </p>
        </div>
      </div>
    </div>
  );
}
