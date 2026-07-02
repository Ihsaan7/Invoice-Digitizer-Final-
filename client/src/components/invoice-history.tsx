import { useQuery, useMutation } from "@tanstack/react-query";
import { Trash2, Eye, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Invoice } from "@shared/schema";

interface InvoiceHistoryProps {
  onViewInvoice: (invoice: Invoice) => void;
}

export function InvoiceHistory({ onViewInvoice }: InvoiceHistoryProps) {
  const { toast } = useToast();

  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/invoices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoice-number"] });
      toast({ title: "Invoice deleted" });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col items-center justify-center py-24 gap-4 animate-fade-in">
          <Loader2 className="w-7 h-7 text-muted-foreground animate-spin" />
          <p className="text-sm text-muted-foreground">Loading invoices…</p>
        </div>
      </div>
    );
  }

  if (!invoices || invoices.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col items-center justify-center py-24 gap-4 animate-scale-in">
          <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center">
            <FileText className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-foreground" data-testid="text-no-invoices">
              No invoices yet
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Upload a handwritten note to create your first invoice.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Heading */}
      <div className="animate-slide-down">
        <h2 className="text-xl font-bold tracking-tight text-foreground" data-testid="text-history-title">
          Invoice History
        </h2>
        <p className="text-xs font-label uppercase tracking-widest text-muted-foreground mt-0.5">
          {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Table card */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden animate-slide-up">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-border bg-muted/40">
              <th className="text-left text-[10px] font-label uppercase tracking-widest text-muted-foreground px-5 py-3">
                Invoice
              </th>
              <th className="text-left text-[10px] font-label uppercase tracking-widest text-muted-foreground px-5 py-3 hidden sm:table-cell">
                Client
              </th>
              <th className="text-left text-[10px] font-label uppercase tracking-widest text-muted-foreground px-5 py-3 hidden md:table-cell">
                Date
              </th>
              <th className="text-left text-[10px] font-label uppercase tracking-widest text-muted-foreground px-5 py-3">
                Status
              </th>
              <th className="text-right text-[10px] font-label uppercase tracking-widest text-muted-foreground px-5 py-3">
                Amount
              </th>
              <th className="w-20 px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice, idx) => (
              <tr
                key={invoice.id}
                className="border-b border-border/50 last:border-b-0 hover:bg-muted/20 transition-colors cursor-pointer group"
                style={{ animationDelay: `${idx * 40}ms` }}
                onClick={() => onViewInvoice(invoice)}
                data-testid={`card-invoice-${invoice.id}`}
              >
                {/* Invoice number */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <span
                      className="text-sm font-mono font-semibold text-foreground"
                      data-testid={`text-invoice-number-${invoice.id}`}
                    >
                      {invoice.invoiceNumber}
                    </span>
                  </div>
                </td>

                {/* Client */}
                <td className="px-5 py-4 text-sm text-muted-foreground hidden sm:table-cell">
                  {invoice.clientName}
                </td>

                {/* Date */}
                <td className="px-5 py-4 text-sm text-muted-foreground hidden md:table-cell tabular-nums">
                  {new Date(invoice.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit", month: "short", year: "numeric",
                  })}
                </td>

                {/* Status */}
                <td className="px-5 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-label uppercase tracking-wider font-semibold bg-accent text-accent-foreground">
                    {invoice.status}
                  </span>
                </td>

                {/* Amount */}
                <td className="px-5 py-4 text-right">
                  <span
                    className="text-sm font-mono font-bold text-foreground tabular-nums"
                    data-testid={`text-invoice-total-${invoice.id}`}
                  >
                    {invoice.totalAmount.toFixed(2)}
                    <span className="text-[10px] font-label ml-1 text-muted-foreground">AED</span>
                  </span>
                </td>

                {/* Actions */}
                <td className="px-3 py-4">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); onViewInvoice(invoice); }}
                      className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                      data-testid={`button-view-${invoice.id}`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(invoice.id); }}
                      className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-all"
                      data-testid={`button-delete-invoice-${invoice.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
