import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ImageUploader } from "@/components/image-uploader";
import { InvoiceEditor } from "@/components/invoice-editor";
import { InvoiceHistory } from "@/components/invoice-history";
import { InvoicePreview } from "@/components/invoice-preview";
import { ThemeToggle } from "@/components/theme-toggle";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ExtractedItem, Invoice, InvoiceItem } from "@shared/schema";
import { FileText, Zap, History } from "lucide-react";
import { Button } from "@/components/ui/button";

type AppView = "upload" | "editor" | "preview" | "history";

export default function Home() {
  const [view, setView] = useState<AppView>("upload");
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([]);
  const [currentInvoice, setCurrentInvoice] = useState<(Invoice & { items: InvoiceItem[] }) | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState("INV-39");
  const { toast } = useToast();

  const invoiceNumberQuery = useQuery<{ invoiceNumber: string }>({
    queryKey: ["/api/invoice-number"],
  });

  const currentInvNum = invoiceNumberQuery.data?.invoiceNumber || invoiceNumber;

  const extractMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to extract data");
      return res.json();
    },
    onSuccess: (data) => {
      setExtractedItems(data.items || []);
      setView("editor");
      toast({
        title: "Extraction complete",
        description: `Found ${data.items?.length || 0} items in the image.`,
      });
    },
    onError: () => {
      toast({
        title: "Extraction failed",
        description: "Could not extract data from the image. Please try again.",
        variant: "destructive",
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { items: ExtractedItem[]; totalAmount: number }) => {
      const res = await apiRequest("POST", "/api/invoices", {
        invoiceNumber: currentInvNum,
        clientName: "ART FASHION LLC",
        clientAddress: "Abu Dhabi, UAE",
        currency: "AED",
        totalAmount: data.totalAmount,
        items: data.items,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setCurrentInvoice(data);
      setView("preview");
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoice-number"] });
      toast({
        title: "Invoice saved",
        description: `Invoice ${data.invoiceNumber} has been created.`,
      });
    },
    onError: () => {
      toast({
        title: "Save failed",
        description: "Could not save the invoice. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (formData: FormData) => {
    extractMutation.mutate(formData);
  };

  const handleSaveInvoice = (items: ExtractedItem[]) => {
    const total = items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
    saveMutation.mutate({ items, totalAmount: total });
  };

  const handleViewInvoice = async (invoice: Invoice) => {
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setCurrentInvoice(data);
      setView("preview");
    } catch {
      toast({ title: "Error", description: "Could not load invoice.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl flex items-center justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight" data-testid="text-app-title">Digitizer</h1>
              <p className="text-xs text-muted-foreground leading-tight">Bazaar Note to Invoice</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant={view === "upload" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => { setView("upload"); setExtractedItems([]); setCurrentInvoice(null); }}
              data-testid="button-new-scan"
            >
              <Zap className="w-4 h-4 mr-1" />
              New Scan
            </Button>
            <Button
              variant={view === "history" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("history")}
              data-testid="button-history"
            >
              <History className="w-4 h-4 mr-1" />
              History
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {view === "upload" && (
          <ImageUploader
            onUpload={handleImageUpload}
            isLoading={extractMutation.isPending}
          />
        )}

        {view === "editor" && (
          <InvoiceEditor
            items={extractedItems}
            invoiceNumber={currentInvNum}
            onSave={handleSaveInvoice}
            onBack={() => setView("upload")}
            isSaving={saveMutation.isPending}
          />
        )}

        {view === "preview" && currentInvoice && (
          <InvoicePreview
            invoice={currentInvoice}
            onBack={() => setView("editor")}
            onNewScan={() => { setView("upload"); setExtractedItems([]); setCurrentInvoice(null); }}
          />
        )}

        {view === "history" && (
          <InvoiceHistory
            onViewInvoice={handleViewInvoice}
          />
        )}
      </main>
    </div>
  );
}
