import { useState, useEffect, useCallback } from "react";
import { Trash2, Plus, ArrowLeft, Save, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { ExtractedItem } from "@shared/schema";

interface InvoiceEditorProps {
  items: ExtractedItem[];
  invoiceNumber: string;
  onSave: (items: ExtractedItem[]) => void;
  onBack: () => void;
  isSaving: boolean;
}

export function InvoiceEditor({ items: initialItems, invoiceNumber, onSave, onBack, isSaving }: InvoiceEditorProps) {
  const [items, setItems] = useState<ExtractedItem[]>(initialItems);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const total = items.reduce((sum, item) => sum + item.quantity * item.rate, 0);

  const updateItem = useCallback((index: number, field: keyof ExtractedItem, value: string | number | boolean) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === "quantity" || field === "rate") {
        updated[index].amount = Number(updated[index].quantity) * Number(updated[index].rate);
      }
      if (field === "description" || field === "quantity" || field === "rate") {
        updated[index].isUncertain = false;
      }
      return updated;
    });
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const addItem = useCallback(() => {
    setItems(prev => [...prev, {
      description: "MX- MOD.no",
      quantity: 0,
      rate: 0,
      amount: 0,
      isUncertain: false,
    }]);
  }, []);

  const uncertainCount = items.filter(i => i.isUncertain).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back-to-upload">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-xl font-semibold" data-testid="text-editor-title">Edit Extracted Data</h2>
            <p className="text-sm text-muted-foreground">
              Invoice <span className="font-mono font-medium">{invoiceNumber}</span>
              {" "} &middot; ART FASHION LLC
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {uncertainCount > 0 && (
            <Badge variant="destructive" data-testid="badge-uncertain-count">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {uncertainCount} uncertain
            </Badge>
          )}
          <Button onClick={() => onSave(items)} disabled={isSaving || items.length === 0} data-testid="button-save-invoice">
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save & Preview"}
          </Button>
        </div>
      </div>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="table-invoice-items">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 w-8">#</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Description</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3 w-24">Qty</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3 w-28">Rate (AED)</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3 w-28">Amount (AED)</th>
                <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr
                  key={index}
                  className={`border-b last:border-b-0 transition-colors ${
                    item.isUncertain ? "bg-destructive/5" : ""
                  }`}
                  data-testid={`row-item-${index}`}
                >
                  <td className="px-4 py-2 text-sm text-muted-foreground">{index + 1}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={item.description.includes("[???]") ? "" : item.description}
                        placeholder={item.isUncertain ? "[???] Uncertain value" : "MX-XXXX MOD.no"}
                        onChange={(e) => updateItem(index, "description", e.target.value)}
                        className={`h-8 text-sm font-mono ${
                          item.isUncertain ? "border-destructive/50 text-destructive placeholder:text-destructive/60" : ""
                        }`}
                        data-testid={`input-description-${index}`}
                      />
                      {item.isUncertain && (
                        <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      type="number"
                      value={item.quantity || ""}
                      placeholder="0"
                      onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                      className={`h-8 text-sm text-right ${
                        item.isUncertain ? "border-destructive/50" : ""
                      }`}
                      data-testid={`input-quantity-${index}`}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      type="number"
                      value={item.rate || ""}
                      placeholder="0"
                      onChange={(e) => updateItem(index, "rate", Number(e.target.value))}
                      className={`h-8 text-sm text-right ${
                        item.isUncertain ? "border-destructive/50" : ""
                      }`}
                      data-testid={`input-rate-${index}`}
                    />
                  </td>
                  <td className="px-4 py-2 text-right">
                    <span className="text-sm font-medium font-mono" data-testid={`text-amount-${index}`}>
                      {(item.quantity * item.rate).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      className="h-7 w-7 text-muted-foreground"
                      data-testid={`button-delete-${index}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No items extracted. Add items manually or try uploading again.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t px-4 py-3 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={addItem} data-testid="button-add-item">
            <Plus className="w-4 h-4 mr-1" />
            Add Item
          </Button>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Total AED</span>
            <span className="text-xl font-bold font-mono" data-testid="text-total-amount">
              {total.toFixed(2)}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
