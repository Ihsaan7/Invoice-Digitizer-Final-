# Digitizer - Bazaar Note to Invoice

## Overview
A web app that digitizes handwritten bazaar notes into professional invoices using AI-powered OCR. Built for ART FASHION LLC (Abu Dhabi, UAE) with AED currency.

## Architecture
- **Frontend**: React + Tailwind CSS + shadcn/ui, using wouter for routing
- **Backend**: Express.js (Node.js/TypeScript)
- **Database**: MongoDB with Mongoose (migrated from PostgreSQL/Drizzle). Requires `MONGODB_URI` secret.
- **AI**: OpenAI via standard `OPENAI_API_KEY` - gpt-4o model (vision-capable, used for OCR)
- **PDF**: jsPDF + jspdf-autotable for invoice PDF generation
- **Deployment**: Configured for Vercel via `vercel.json` + `api/[...path].ts` serverless entry (see below)

## Key Features
1. **Image Upload/Capture**: Drag-and-drop or camera capture of handwritten bazaar notes
2. **AI Extraction**: Processes images to extract [Quantity] [Model Number] [Rate] pattern
3. **Business Logic**: Model numbers prefixed with "MX-", uncertain values marked as [???] in red
4. **Interactive Editor**: Editable table with auto-calculating Total AED footer
5. **Invoice Generator**: Professional PDF output with INV-XX numbering
6. **Invoice History**: View and manage past invoices

## Data Model
- `invoices`: id (Mongo ObjectId string), invoiceNumber, clientName, clientAddress, currency, totalAmount, status, imageUrl, createdAt
- `invoiceItems`: id (Mongo ObjectId string), invoiceId, description, quantity, rate, amount, isUncertain

## File Structure
- `shared/schema.ts` - Zod types shared between client/server (Mongo-backed, string ids)
- `server/mongodb.ts` - MongoDB/Mongoose connection (lazy-connects using `MONGODB_URI`)
- `server/models.ts` - Mongoose schemas for Invoice and InvoiceItem
- `server/routes.ts` - API endpoints including /api/extract for OCR
- `server/storage.ts` - Database CRUD operations (Mongoose-backed `MongoStorage`)
- `server/seed.ts` - Sample data seeding (Mongoose)
- `server/db.ts` - Legacy Postgres connection, no longer used by the invoice app (kept only for an unused chat integration module)
- `api/[...path].ts` - Vercel serverless function entry wrapping the Express app
- `vercel.json` - Vercel build/deploy configuration
- `client/src/pages/home.tsx` - Main page with view state management
- `client/src/components/image-uploader.tsx` - Upload/capture UI
- `client/src/components/invoice-editor.tsx` - Editable table
- `client/src/components/invoice-preview.tsx` - Preview with PDF generation
- `client/src/components/invoice-history.tsx` - Past invoices list
- `client/src/components/theme-toggle.tsx` - Dark/light mode toggle

## Deploying to Vercel
1. Push this repo to GitHub (or connect it directly) and import it into Vercel.
2. In Vercel Project Settings → Environment Variables, add `MONGODB_URI` and `OPENAI_API_KEY`.
3. Vercel will use `vercel.json` automatically: it runs `vite build` (outputs to `dist/public`) and deploys `api/[...path].ts` as a serverless function handling all `/api/*` requests, with all other routes falling back to `index.html` (single-page app).
4. No further configuration is needed — deploy and the same Express routes used in development will run as a Vercel serverless function.

## Design
- Dark mode by default (togglable)
- Inter font for UI, JetBrains Mono for code/numbers
- Professional blue-themed color scheme
- Mobile-responsive layout
