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
import { History, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";

type AppView = "upload" | "editor" | "preview" | "history";

export default function Home() {
  const [view, setView] = useState<AppView>("upload");
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([]);
  const [extractedGrandTotal, setExtractedGrandTotal] = useState<number>(0);
  const [currentInvoice, setCurrentInvoice] = useState<(Invoice & { items: InvoiceItem[] }) | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState("INV-39");
  const { toast } = useToast();

  const invoiceNumberQuery = useQuery<{ invoiceNumber: string }>({
    queryKey: ["/api/invoice-number"],
  });

  const currentInvNum = invoiceNumberQuery.data?.invoiceNumber || invoiceNumber;

  const extractMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/extract", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Failed to extract data");
      return res.json();
    },
    onSuccess: (data) => {
      setExtractedItems(data.items || []);
      setExtractedGrandTotal(data.grandTotal || 0);
      setView("editor");
      if (data.isDemoMode) {
        toast({
          title: "Demo Extraction Mode",
          description: "No OPENAI_API_KEY set in .env file. Extracted demo items. Add OPENAI_API_KEY to .env for live AI OCR.",
        });
      } else {
        toast({
          title: "Extraction complete",
          description: `Found ${data.items?.length || 0} items in the image.`,
        });
      }
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
      toast({ title: "Invoice saved", description: `${data.invoiceNumber} created.` });
    },
    onError: () => {
      toast({ title: "Save failed", description: "Could not save the invoice.", variant: "destructive" });
    },
  });

  const handleImageUpload = (formData: FormData) => extractMutation.mutate(formData);

  const handleSaveInvoice = (items: ExtractedItem[], grandTotal: number) => {
    saveMutation.mutate({ items, totalAmount: grandTotal });
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

  const goToUpload = () => { setView("upload"); setExtractedItems([]); setCurrentInvoice(null); };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur-md animate-slide-down">
        <div className="mx-auto max-w-5xl flex items-center justify-between gap-2 px-5 py-0 h-14">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="3.5" width="12" height="2" rx="0.75" fill="white"/>
                <rect x="2" y="7" width="12" height="2" rx="0.75" fill="white"/>
                <rect x="2" y="10.5" width="7.5" height="1.8" rx="0.75" fill="white"/>
              </svg>
            </div>
            <div>
              <h1
                className="text-[15px] font-bold leading-tight tracking-tight text-foreground"
                data-testid="text-app-title"
              >
                DigiBill
              </h1>
              <p className="text-[10px] font-label uppercase tracking-widest text-muted-foreground leading-tight">
                Digital Invoice Solutions
              </p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            <Button
              variant={view === "upload" || view === "editor" || view === "preview" ? "ghost" : "ghost"}
              size="sm"
              onClick={goToUpload}
              className={`text-xs font-label uppercase tracking-wider transition-all ${
                view !== "history"
                  ? "text-primary border-b-2 border-primary rounded-none pb-[2px]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid="button-new-scan"
            >
              <ScanLine className="w-3.5 h-3.5 mr-1.5" />
              New Scan
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView("history")}
              className={`text-xs font-label uppercase tracking-wider transition-all ${
                view === "history"
                  ? "text-primary border-b-2 border-primary rounded-none pb-[2px]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid="button-history"
            >
              <History className="w-3.5 h-3.5 mr-1.5" />
              History
            </Button>
            <div className="ml-2 pl-2 border-l border-border">
              <ThemeToggle />
            </div>
          </nav>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="mx-auto max-w-5xl px-5 py-8">
        {view === "upload" && (
          <div className="animate-slide-up">
            <ImageUploader onUpload={handleImageUpload} isLoading={extractMutation.isPending} />
          </div>
        )}

        {view === "editor" && (
          <div className="animate-slide-in-right">
            <InvoiceEditor
              items={extractedItems}
              invoiceNumber={currentInvNum}
              grandTotal={extractedGrandTotal}
              onSave={handleSaveInvoice}
              onBack={() => setView("upload")}
              isSaving={saveMutation.isPending}
            />
          </div>
        )}

        {view === "preview" && currentInvoice && (
          <div className="animate-slide-in-right">
            <InvoicePreview
              invoice={currentInvoice}
              onBack={() => setView("editor")}
              onNewScan={goToUpload}
            />
          </div>
        )}

        {view === "history" && (
          <div className="animate-slide-up">
            <InvoiceHistory onViewInvoice={handleViewInvoice} />
          </div>
        )}
      </main>
    </div>
  );
}
