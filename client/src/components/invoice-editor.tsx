import { useState, useEffect, useCallback } from "react";
import { Trash2, Plus, ArrowLeft, Save, AlertTriangle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { ExtractedItem } from "@shared/schema";

interface InvoiceEditorProps {
  items: ExtractedItem[];
  invoiceNumber: string;
  grandTotal?: number;
  onSave: (items: ExtractedItem[], grandTotal: number) => void;
  onBack: () => void;
  isSaving: boolean;
}

export function InvoiceEditor({
  items: initialItems,
  invoiceNumber,
  grandTotal: initialGrandTotal,
  onSave,
  onBack,
  isSaving,
}: InvoiceEditorProps) {
  const [items, setItems] = useState<ExtractedItem[]>(initialItems);

  useEffect(() => { setItems(initialItems); }, [initialItems]);

  const computedTotal = items.reduce((sum, item) => sum + (item.amount ?? item.rate), 0);
  const displayTotal = (initialGrandTotal && initialGrandTotal > 0) ? initialGrandTotal : computedTotal;

  const updateItem = useCallback((index: number, field: keyof ExtractedItem, value: string | number | boolean) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === "rate") {
        updated[index].amount = Number(value);
        updated[index].quantity = 1;
      }
      if (field === "description" || field === "rate") {
        updated[index].isUncertain = false;
      }
      return updated;
    });
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const addItem = useCallback(() => {
    setItems(prev => [...prev, { description: "", quantity: 1, rate: 0, amount: 0, isUncertain: false }]);
  }, []);

  const uncertainCount = items.filter(i => i.isUncertain).length;
  const saveTotal = items.reduce((sum, item) => sum + (item.amount ?? item.rate), 0);

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
            data-testid="button-back-to-upload"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground" data-testid="text-editor-title">
              Edit Extracted Items
            </h2>
            <p className="text-xs font-label uppercase tracking-wider text-muted-foreground">
              {invoiceNumber} &middot; ART FASHION LLC
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {uncertainCount > 0 && (
            <Badge
              variant="destructive"
              className="gap-1.5 animate-fade-in"
              data-testid="badge-uncertain-count"
            >
              <AlertTriangle className="w-3 h-3" />
              {uncertainCount} uncertain
            </Badge>
          )}
          <Button
            onClick={() => onSave(items, saveTotal)}
            disabled={isSaving || items.length === 0}
            className="gap-2 transition-all hover:shadow-sm"
            data-testid="button-save-invoice"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save &amp; Preview
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Table card */}
      <Card className="overflow-hidden animate-slide-up border-border shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="table-invoice-items">
            <thead>
              <tr className="bg-muted/50 border-b-2 border-border">
                <th className="text-left text-[10px] font-label uppercase tracking-widest text-muted-foreground px-5 py-3 w-8">
                  #
                </th>
                <th className="text-left text-[10px] font-label uppercase tracking-widest text-muted-foreground px-5 py-3">
                  Description
                </th>
                <th className="text-right text-[10px] font-label uppercase tracking-widest text-muted-foreground px-5 py-3 w-36">
                  Rate (AED)
                </th>
                <th className="text-right text-[10px] font-label uppercase tracking-widest text-muted-foreground px-5 py-3 w-36">
                  Amount (AED)
                </th>
                <th className="w-10 px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr
                  key={index}
                  className={`
                    border-b border-border/60 last:border-b-0
                    transition-colors duration-150
                    ${item.isUncertain ? "bg-destructive/4 hover:bg-destructive/6" : "hover:bg-muted/30"}
                  `}
                  style={{ animationDelay: `${index * 30}ms` }}
                  data-testid={`row-item-${index}`}
                >
                  <td className="px-5 py-3 text-sm text-muted-foreground tabular-nums">
                    {index + 1}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Input
                        value={item.description.includes("[???]") ? "" : item.description}
                        placeholder={item.isUncertain ? "[???] — verify this item" : "Item description"}
                        onChange={(e) => updateItem(index, "description", e.target.value)}
                        className={`h-8 text-sm font-mono border-transparent bg-transparent focus:bg-card focus:border-border transition-all ${
                          item.isUncertain
                            ? "placeholder:text-destructive/60 text-destructive"
                            : ""
                        }`}
                        data-testid={`input-description-${index}`}
                      />
                      {item.isUncertain && (
                        <AlertTriangle className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <Input
                      type="number"
                      value={item.rate || ""}
                      placeholder="0.00"
                      onChange={(e) => updateItem(index, "rate", Number(e.target.value))}
                      className="h-8 text-sm text-right font-mono border-transparent bg-transparent focus:bg-card focus:border-border transition-all"
                      data-testid={`input-rate-${index}`}
                    />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span
                      className="text-sm font-mono font-medium text-foreground tabular-nums"
                      data-testid={`text-amount-${index}`}
                    >
                      {(item.amount ?? item.rate).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <button
                      onClick={() => removeItem(index)}
                      className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground/50 hover:text-destructive hover:bg-destructive/8 transition-all"
                      data-testid={`button-delete-${index}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-14 text-center text-sm text-muted-foreground">
                    No items yet. Add items manually or go back and upload an image.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer row */}
        <div className="border-t border-border bg-muted/20 px-5 py-3 flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={addItem}
            className="gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-add-item"
          >
            <Plus className="w-3.5 h-3.5" />
            Add item
          </Button>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">SubTotal</span>
              <span className="font-mono tabular-nums text-foreground">{computedTotal.toFixed(2)}</span>
            </div>
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-label uppercase tracking-widest text-muted-foreground">
                Total AED
              </span>
              <span
                className="text-xl font-bold font-mono tabular-nums text-foreground"
                data-testid="text-total-amount"
              >
                {displayTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
