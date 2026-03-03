import { useQuery, useMutation } from "@tanstack/react-query";
import { Trash2, Eye, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
        <p className="text-sm text-muted-foreground">Loading invoices...</p>
      </div>
    );
  }

  if (!invoices || invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <FileText className="w-7 h-7 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="font-medium" data-testid="text-no-invoices">No invoices yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Upload a bazaar note to create your first invoice.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold" data-testid="text-history-title">Invoice History</h2>
        <p className="text-sm text-muted-foreground">{invoices.length} invoice{invoices.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="grid gap-3">
        {invoices.map((invoice) => (
          <Card
            key={invoice.id}
            className="p-4 hover-elevate cursor-pointer"
            onClick={() => onViewInvoice(invoice)}
            data-testid={`card-invoice-${invoice.id}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex-shrink-0 w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-mono font-medium text-sm" data-testid={`text-invoice-number-${invoice.id}`}>
                      {invoice.invoiceNumber}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {invoice.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-muted-foreground">{invoice.clientName}</p>
                    <span className="text-xs text-muted-foreground">&middot;</span>
                    <p className="text-xs text-muted-foreground">
                      {new Date(invoice.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-mono font-bold text-sm" data-testid={`text-invoice-total-${invoice.id}`}>
                    AED {invoice.totalAmount.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); onViewInvoice(invoice); }}
                    data-testid={`button-view-${invoice.id}`}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(invoice.id); }}
                    className="text-muted-foreground"
                    data-testid={`button-delete-invoice-${invoice.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
