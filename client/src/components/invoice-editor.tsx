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
  const [hasManuallyEdited, setHasManuallyEdited] = useState(false);

  useEffect(() => { 
    setItems(initialItems.map(item => ({
      ...item,
      quantity: item.quantity && item.quantity > 0 ? item.quantity : 1,
      amount: item.amount !== undefined && item.amount !== null 
        ? item.amount 
        : Math.round((item.rate || 0) * (item.quantity || 1) * 100) / 100,
    }))); 
  }, [initialItems]);

  const computedTotal = items.reduce((sum, item) => {
    const amt = item.amount !== undefined && item.amount !== null && !isNaN(item.amount)
      ? Number(item.amount)
      : (Number(item.rate) || 0) * (Number(item.quantity) || 1);
    return sum + amt;
  }, 0);

  const displayTotal = hasManuallyEdited || !initialGrandTotal || initialGrandTotal <= 0
    ? computedTotal
    : initialGrandTotal;

  const updateItem = useCallback((index: number, field: keyof ExtractedItem, value: string | number | boolean) => {
    setHasManuallyEdited(true);
    setItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index] };

      if (field === "rate") {
        const rate = typeof value === "number" ? value : parseFloat(String(value)) || 0;
        item.rate = rate;
        const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
        item.amount = Math.round(rate * qty * 100) / 100;
        item.isUncertain = false;
      } else if (field === "quantity") {
        const qty = typeof value === "number" ? value : parseInt(String(value), 10) || 1;
        item.quantity = qty;
        item.amount = Math.round((item.rate || 0) * qty * 100) / 100;
      } else if (field === "amount") {
        const amt = typeof value === "number" ? value : parseFloat(String(value)) || 0;
        item.amount = amt;
        item.isUncertain = false;
      } else if (field === "description") {
        item.description = String(value);
        item.isUncertain = false;
      } else {
        (item as any)[field] = value;
      }

      updated[index] = item;
      return updated;
    });
  }, []);

  const removeItem = useCallback((index: number) => {
    setHasManuallyEdited(true);
    setItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const addItem = useCallback(() => {
    setHasManuallyEdited(true);
    setItems(prev => [...prev, { description: "", quantity: 1, rate: 0, amount: 0, isUncertain: false }]);
  }, []);

  const uncertainCount = items.filter(i => i.isUncertain).length;
  const saveTotal = computedTotal;

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
                <th className="text-center text-[10px] font-label uppercase tracking-widest text-muted-foreground px-3 py-3 w-20">
                  Qty
                </th>
                <th className="text-right text-[10px] font-label uppercase tracking-widest text-muted-foreground px-5 py-3 w-32">
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
                  <td className="px-3 py-3 text-center">
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity || 1}
                      onChange={(e) => updateItem(index, "quantity", e.target.value === "" ? 1 : Math.max(1, parseInt(e.target.value, 10)))}
                      className="h-8 text-sm text-center font-mono border-transparent bg-transparent focus:bg-card focus:border-border transition-all w-16 mx-auto"
                      data-testid={`input-quantity-${index}`}
                    />
                  </td>
                  <td className="px-5 py-3">
                    <Input
                      type="number"
                      step="any"
                      value={item.rate !== undefined && item.rate !== null && item.rate !== 0 ? item.rate : ""}
                      placeholder="0.00"
                      onChange={(e) => updateItem(index, "rate", e.target.value === "" ? 0 : parseFloat(e.target.value))}
                      className="h-8 text-sm text-right font-mono border-transparent bg-transparent focus:bg-card focus:border-border transition-all"
                      data-testid={`input-rate-${index}`}
                    />
                  </td>
                  <td className="px-5 py-3">
                    <Input
                      type="number"
                      step="any"
                      value={item.amount !== undefined && item.amount !== null && item.amount !== 0 ? item.amount : (item.rate ? item.rate * (item.quantity || 1) : "")}
                      placeholder="0.00"
                      onChange={(e) => updateItem(index, "amount", e.target.value === "" ? 0 : parseFloat(e.target.value))}
                      className="h-8 text-sm text-right font-mono font-medium border-transparent bg-transparent focus:bg-card focus:border-border transition-all"
                      data-testid={`input-amount-${index}`}
                    />
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
                  <td colSpan={6} className="px-5 py-14 text-center text-sm text-muted-foreground">
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
