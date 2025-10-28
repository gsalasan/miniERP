# FIN-04: Invoice API Documentation

## 📋 Overview
Backend API untuk manajemen invoices dengan fitur GET list dan GET by ID.

## 🎯 Features Implemented
- ✅ Model database Invoice di Prisma schema
- ✅ Controller untuk GET list invoices (dengan pagination & filter)
- ✅ Controller untuk GET invoice by ID
- ✅ Routes terintegrasi dengan finance service
- ✅ Sample data untuk testing

## 📊 Database Model

### Invoice Table (`invoices`)
```prisma
model Invoice {
  id                String        @id @default(uuid())
  invoice_number    String        @unique
  invoice_date      DateTime      @db.Date
  due_date          DateTime      @db.Date
  customer_id       String?
  customer_name     String
  customer_address  String?
  customer_phone    String?
  customer_email    String?
  subtotal          Decimal       @db.Decimal(15, 2)
  tax_amount        Decimal       @db.Decimal(15, 2) @default(0)
  discount_amount   Decimal       @db.Decimal(15, 2) @default(0)
  total_amount      Decimal       @db.Decimal(15, 2)
  currency          String        @default("IDR") @db.VarChar(3)
  status            InvoiceStatus @default(DRAFT)
  notes             String?
  payment_terms     String?
  created_by        String?
  updated_by        String?
  created_at        DateTime      @default(now())
  updated_at        DateTime      @updatedAt

  @@map("invoices")
}
```

### InvoiceStatus Enum
```prisma
enum InvoiceStatus {
  DRAFT
  SENT
  PAID
  OVERDUE
  CANCELLED
}
```

## 🔌 API Endpoints

### 1. Get All Invoices
**Endpoint:** `GET /api/invoices`

**Query Parameters:**
- `status` (optional): Filter by invoice status (DRAFT, SENT, PAID, OVERDUE, CANCELLED)
- `customer_name` (optional): Filter by customer name (case-insensitive partial match)
- `page` (optional, default: 1): Page number for pagination
- `limit` (optional, default: 10): Number of items per page

**Response:**
```json
{
  "success": true,
  "message": "Daftar Invoice berhasil diambil",
  "data": [
    {
      "id": "uuid-here",
      "invoice_number": "INV-2024-001",
      "invoice_date": "2024-10-01T00:00:00.000Z",
      "due_date": "2024-10-15T00:00:00.000Z",
      "customer_name": "PT. Example Company",
      "customer_address": "Jl. Sudirman No. 123, Jakarta",
      "customer_phone": "021-12345678",
      "customer_email": "finance@example.com",
      "subtotal": "10000000.00",
      "tax_amount": "1100000.00",
      "discount_amount": "0.00",
      "total_amount": "11100000.00",
      "currency": "IDR",
      "status": "SENT",
      "notes": "Invoice untuk project A",
      "payment_terms": "Net 30",
      "created_at": "2024-10-24T...",
      "updated_at": "2024-10-24T..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "totalPages": 1
  }
}
```

**Example Requests:**
```bash
# Get all invoices
curl http://localhost:3001/api/invoices

# Get invoices with pagination
curl http://localhost:3001/api/invoices?page=1&limit=5

# Filter by status
curl http://localhost:3001/api/invoices?status=SENT

# Filter by customer name
curl http://localhost:3001/api/invoices?customer_name=PT

# Combined filters
curl http://localhost:3001/api/invoices?status=PAID&page=1&limit=10
```

### 2. Get Invoice by ID
**Endpoint:** `GET /api/invoices/:id`

**Path Parameters:**
- `id` (required): Invoice UUID

**Response (Success):**
```json
{
  "success": true,
  "message": "Invoice berhasil diambil",
  "data": {
    "id": "uuid-here",
    "invoice_number": "INV-2024-001",
    "invoice_date": "2024-10-01T00:00:00.000Z",
    "due_date": "2024-10-15T00:00:00.000Z",
    "customer_name": "PT. Example Company",
    "customer_address": "Jl. Sudirman No. 123, Jakarta",
    "customer_phone": "021-12345678",
    "customer_email": "finance@example.com",
    "subtotal": "10000000.00",
    "tax_amount": "1100000.00",
    "discount_amount": "0.00",
    "total_amount": "11100000.00",
    "currency": "IDR",
    "status": "SENT",
    "notes": "Invoice untuk project A",
    "payment_terms": "Net 30",
    "created_at": "2024-10-24T...",
    "updated_at": "2024-10-24T..."
  }
}
```

**Response (Not Found):**
```json
{
  "success": false,
  "message": "Invoice tidak ditemukan"
}
```

**Example Request:**
```bash
curl http://localhost:3001/api/invoices/550e8400-e29b-41d4-a716-446655440000
```

## 📁 Files Created/Modified

### Created Files:
1. `services/finance-service/src/controllers/invoices.controllers.ts` - Invoice controllers
2. `services/finance-service/src/routes/invoices.route.ts` - Invoice routes
3. `prisma/migrations/add_invoice_model.sql` - SQL migration file
4. `run-invoice-migration-pg.mjs` - Migration runner script
5. `seed-invoices.mjs` - Sample data seeder
6. `test-invoice-api.html` - API testing interface

### Modified Files:
1. `prisma/schema.prisma` - Added Invoice model and InvoiceStatus enum
2. `services/finance-service/src/utils/app.ts` - Added invoice routes

## 🧪 Testing

### Using HTML Test Interface
1. Open `test-invoice-api.html` in browser
2. Test various endpoints with provided buttons
3. View formatted responses

### Using curl
```bash
# Test Get All
curl http://localhost:3001/api/invoices

# Test Get by ID (replace with actual ID)
curl http://localhost:3001/api/invoices/YOUR-UUID-HERE

# Test with filters
curl http://localhost:3001/api/invoices?status=SENT&limit=5
```

### Using Browser
```
http://localhost:3001/api/invoices
http://localhost:3001/api/invoices?status=PAID
```

## 🚀 Running the Service

```bash
# From project root
cd services/finance-service
npm run dev

# Service will run on http://localhost:3001
```

## 📝 Sample Data

The database has been seeded with 3 sample invoices:

1. **INV-2024-001** - PT. Example Company (Status: SENT)
   - Amount: Rp 11,100,000
   
2. **INV-2024-002** - PT. Sample Indonesia (Status: DRAFT)
   - Amount: Rp 5,450,000
   
3. **INV-2024-003** - CV. Tech Solutions (Status: PAID)
   - Amount: Rp 16,150,000

## 🔮 Future Enhancements (Not in FIN-04)
- POST /api/invoices - Create new invoice
- PUT /api/invoices/:id - Update invoice
- DELETE /api/invoices/:id - Delete invoice
- PATCH /api/invoices/:id/status - Update invoice status
- GET /api/invoices/:id/pdf - Generate PDF invoice
- Invoice items/line items table
- Payment tracking
- Invoice templates

## 📊 Status Codes

- `200` - Success
- `404` - Invoice not found
- `500` - Server error

## ✅ Completion Checklist

- [x] Database model created (Invoice, InvoiceStatus)
- [x] Prisma client generated
- [x] Migration executed successfully
- [x] Sample data seeded
- [x] GET /api/invoices endpoint working
- [x] GET /api/invoices/:id endpoint working
- [x] Pagination implemented
- [x] Filtering by status implemented
- [x] Filtering by customer name implemented
- [x] Routes integrated with app
- [x] Error handling implemented
- [x] Testing interface created
- [x] Documentation complete

## 🎉 FIN-04 Status: COMPLETED ✅

All requirements for FIN-04 have been successfully implemented:
- ✅ Model database Invoice
- ✅ API GET list invoices
- ✅ API GET invoice by ID
- ✅ Pagination support
- ✅ Filter capabilities
- ✅ Sample data for testing
