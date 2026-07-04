import mongoose, { Schema } from "mongoose";

const { model, models } = mongoose;

function withIdTransform(schema: Schema) {
  schema.set("toJSON", {
    virtuals: true,
    transform: (_doc: any, ret: any) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  });
}

const invoiceSchema = new Schema({
  invoiceNumber: { type: String, required: true },
  clientName: { type: String, required: true, default: "ART FASHION LLC" },
  clientAddress: { type: String, required: true, default: "Abu Dhabi, UAE" },
  currency: { type: String, required: true, default: "AED" },
  totalAmount: { type: Number, required: true, default: 0 },
  status: { type: String, required: true, default: "draft" },
  imageUrl: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});
withIdTransform(invoiceSchema);

const invoiceItemSchema = new Schema({
  invoiceId: { type: String, required: true, index: true },
  description: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  rate: { type: Number, required: true },
  amount: { type: Number, required: true },
  isUncertain: { type: Number, required: true, default: 0 },
});
withIdTransform(invoiceItemSchema);

export const InvoiceModel = models.Invoice || model("Invoice", invoiceSchema);
export const InvoiceItemModel =
  models.InvoiceItem || model("InvoiceItem", invoiceItemSchema);
