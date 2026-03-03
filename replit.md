# Digitizer - Bazaar Note to Invoice

## Overview
A web app that digitizes handwritten bazaar notes into professional invoices using AI-powered OCR. Built for ART FASHION LLC (Abu Dhabi, UAE) with AED currency.

## Architecture
- **Frontend**: React + Tailwind CSS + shadcn/ui, using wouter for routing
- **Backend**: Express.js (Node.js/TypeScript)
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: OpenAI (via Replit AI Integrations) for image OCR - gpt-5.2 model
- **PDF**: jsPDF + jspdf-autotable for invoice PDF generation

## Key Features
1. **Image Upload/Capture**: Drag-and-drop or camera capture of handwritten bazaar notes
2. **AI Extraction**: Processes images to extract [Quantity] [Model Number] [Rate] pattern
3. **Business Logic**: Model numbers prefixed with "MX-", uncertain values marked as [???] in red
4. **Interactive Editor**: Editable table with auto-calculating Total AED footer
5. **Invoice Generator**: Professional PDF output with INV-XX numbering
6. **Invoice History**: View and manage past invoices

## Data Model
- `invoices`: id, invoiceNumber, clientName, clientAddress, currency, totalAmount, status, imageUrl, createdAt
- `invoiceItems`: id, invoiceId, description, quantity, rate, amount, isUncertain

## File Structure
- `shared/schema.ts` - Drizzle schema and Zod types
- `server/routes.ts` - API endpoints including /api/extract for OCR
- `server/storage.ts` - Database CRUD operations
- `server/seed.ts` - Sample data seeding
- `server/db.ts` - Database connection
- `client/src/pages/home.tsx` - Main page with view state management
- `client/src/components/image-uploader.tsx` - Upload/capture UI
- `client/src/components/invoice-editor.tsx` - Editable table
- `client/src/components/invoice-preview.tsx` - Preview with PDF generation
- `client/src/components/invoice-history.tsx` - Past invoices list
- `client/src/components/theme-toggle.tsx` - Dark/light mode toggle

## Design
- Dark mode by default (togglable)
- Inter font for UI, JetBrains Mono for code/numbers
- Professional blue-themed color scheme
- Mobile-responsive layout
