# Invoice API - Postman Testing Guide

## Base URL
```
http://localhost:3001/api/invoices
```

## Endpoints Overview

### 1. GET All Invoices
**URL:** `GET http://localhost:3001/api/invoices`

**Query Parameters:**
- `page` (optional) - Page number, default: 1
- `limit` (optional) - Items per page, default: 10
- `status` (optional) - Filter by status: DRAFT, SENT, PAID, CANCELLED, OVERDUE
- `customer_name` (optional) - Search by customer name (case-insensitive contains)

**Example URLs:**
```
GET http://localhost:3001/api/invoices
GET http://localhost:3001/api/invoices?page=1&limit=10
GET http://localhost:3001/api/invoices?status=DRAFT
GET http://localhost:3001/api/invoices?customer_name=PT
GET http://localhost:3001/api/invoices?status=PAID&customer_name=Example
```

**Response:**
```json
{
  "success": true,
  "message": "Daftar Invoice berhasil diambil",
  "data": [
    {
      "id": "f8a71abb-0d70-4e22-86d4-4c106bab2492",
      "invoice_number": "INV-2024-001",
      "invoice_date": "2024-10-01T00:00:00.000Z",
      "due_date": "2024-10-15T00:00:00.000Z",
      "customer_id": null,
      "customer_name": "PT. Example Company",
      "customer_address": "Jl. Sudirman No. 123, Jakarta",
      "customer_phone": "021-12345678",
      "customer_email": "finance@example.com",
      "subtotal": "10000000",
      "tax_amount": "1100000",
      "discount_amount": "0",
      "total_amount": "11100000",
      "currency": "IDR",
      "status": "SENT",
      "notes": "Invoice untuk project A",
      "payment_terms": "Net 30",
      "created_by": null,
      "updated_by": null,
      "created_at": "2025-10-24T18:30:12.834Z",
      "updated_at": "2025-10-24T18:30:12.834Z"
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

---

### 2. GET Invoice by ID
**URL:** `GET http://localhost:3001/api/invoices/:id`

**Example:**
```
GET http://localhost:3001/api/invoices/f8a71abb-0d70-4e22-86d4-4c106bab2492
```

**Response:**
```json
{
  "success": true,
  "message": "Invoice berhasil diambil",
  "data": {
    "id": "f8a71abb-0d70-4e22-86d4-4c106bab2492",
    "invoice_number": "INV-2024-001",
    "invoice_date": "2024-10-01T00:00:00.000Z",
    "due_date": "2024-10-15T00:00:00.000Z",
    "customer_name": "PT. Example Company",
    "total_amount": "11100000",
    "status": "SENT",
    ...
  }
}
```

---

### 3. POST Create Invoice
**URL:** `POST http://localhost:3001/api/invoices`

**Headers:**
```
Content-Type: application/json
```

**Required Fields:**
- `invoice_number` (string) - Unique invoice number
- `invoice_date` (date string) - YYYY-MM-DD format
- `due_date` (date string) - YYYY-MM-DD format
- `customer_name` (string) - Customer name
- `subtotal` (number) - Subtotal amount
- `total_amount` (number) - Total amount after tax and discount

**Optional Fields:**
- `customer_id` (string) - Customer ID reference
- `customer_address` (string)
- `customer_phone` (string)
- `customer_email` (string)
- `tax_amount` (number) - Default: 0
- `discount_amount` (number) - Default: 0
- `currency` (string) - Default: "IDR"
- `status` (string) - Default: "DRAFT" (Options: DRAFT, SENT, PAID, CANCELLED, OVERDUE)
- `notes` (string)
- `payment_terms` (string) - e.g., "Net 30"
- `created_by` (string) - User who created

**Request Body Example:**
```json
{
  "invoice_number": "INV-2024-NEW-001",
  "invoice_date": "2024-10-25",
  "due_date": "2024-11-08",
  "customer_name": "PT. New Customer",
  "customer_address": "Jl. New Street No. 456, Jakarta",
  "customer_phone": "021-11223344",
  "customer_email": "contact@newcustomer.com",
  "subtotal": 8000000,
  "tax_amount": 880000,
  "discount_amount": 200000,
  "total_amount": 8680000,
  "currency": "IDR",
  "status": "DRAFT",
  "notes": "New invoice for project B",
  "payment_terms": "Net 14",
  "created_by": "admin_user"
}
```

**PowerShell Example:**
```powershell
$body = @{
    invoice_number = "INV-2024-NEW-001"
    invoice_date = "2024-10-25"
    due_date = "2024-11-08"
    customer_name = "PT. New Customer"
    customer_address = "Jl. New Street No. 456"
    subtotal = 8000000
    tax_amount = 880000
    discount_amount = 200000
    total_amount = 8680000
    currency = "IDR"
    status = "DRAFT"
    notes = "New invoice"
    payment_terms = "Net 14"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/invoices" -Method POST -Body $body -ContentType "application/json"
```

**Response:**
```json
{
  "success": true,
  "message": "Invoice berhasil dibuat",
  "data": {
    "id": "43b9bc06-0bc3-4b4a-bec4-1ff169d6f148",
    "invoice_number": "INV-2024-NEW-001",
    "invoice_date": "2024-10-25T00:00:00.000Z",
    "due_date": "2024-11-08T00:00:00.000Z",
    "customer_name": "PT. New Customer",
    "subtotal": "8000000",
    "total_amount": "8680000",
    "status": "DRAFT",
    ...
  }
}
```

---

### 4. PUT Update Invoice
**URL:** `PUT http://localhost:3001/api/invoices/:id`

**Headers:**
```
Content-Type: application/json
```

**Note:** All fields are optional. Only send fields you want to update.

**Available Update Fields:**
- `invoice_date` (date string)
- `due_date` (date string)
- `customer_id` (string)
- `customer_name` (string)
- `customer_address` (string)
- `customer_phone` (string)
- `customer_email` (string)
- `subtotal` (number)
- `tax_amount` (number)
- `discount_amount` (number)
- `total_amount` (number)
- `currency` (string)
- `status` (string) - DRAFT, SENT, PAID, CANCELLED, OVERDUE
- `notes` (string)
- `payment_terms` (string)
- `updated_by` (string)

**Request Body Example (Minimal Update):**
```json
{
  "status": "SENT",
  "notes": "Invoice has been sent to customer",
  "updated_by": "finance_admin"
}
```

**Request Body Example (Full Update):**
```json
{
  "invoice_date": "2024-10-26",
  "due_date": "2024-11-09",
  "customer_name": "PT. Updated Customer Name",
  "customer_email": "newemail@customer.com",
  "subtotal": 9000000,
  "tax_amount": 990000,
  "total_amount": 9990000,
  "status": "PAID",
  "notes": "Payment received",
  "updated_by": "finance_admin"
}
```

**PowerShell Example:**
```powershell
$invoiceId = "43b9bc06-0bc3-4b4a-bec4-1ff169d6f148"
$body = @{
    status = "PAID"
    notes = "Payment received on 2024-10-25"
    updated_by = "finance_user"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/invoices/$invoiceId" -Method PUT -Body $body -ContentType "application/json"
```

**Response:**
```json
{
  "success": true,
  "message": "Invoice berhasil diupdate",
  "data": {
    "id": "43b9bc06-0bc3-4b4a-bec4-1ff169d6f148",
    "invoice_number": "INV-2024-NEW-001",
    "status": "PAID",
    "notes": "Payment received on 2024-10-25",
    "updated_by": "finance_user",
    "updated_at": "2025-10-25T11:58:50.502Z",
    ...
  }
}
```

---

### 5. DELETE Invoice
**URL:** `DELETE http://localhost:3001/api/invoices/:id`

**Example:**
```
DELETE http://localhost:3001/api/invoices/43b9bc06-0bc3-4b4a-bec4-1ff169d6f148
```

**PowerShell Example:**
```powershell
$invoiceId = "43b9bc06-0bc3-4b4a-bec4-1ff169d6f148"
Invoke-RestMethod -Uri "http://localhost:3001/api/invoices/$invoiceId" -Method DELETE
```

**Response:**
```json
{
  "success": true,
  "message": "Invoice berhasil dihapus"
}
```

---

## Status Values

Invoice status can be one of:
- **DRAFT** - Invoice sedang dalam draft
- **SENT** - Invoice sudah dikirim ke customer
- **PAID** - Invoice sudah dibayar
- **CANCELLED** - Invoice dibatalkan
- **OVERDUE** - Invoice sudah jatuh tempo

---

## Error Responses

### 404 - Not Found
```json
{
  "success": false,
  "message": "Invoice tidak ditemukan"
}
```

### 409 - Conflict (Duplicate Invoice Number)
```json
{
  "success": false,
  "message": "Invoice number sudah digunakan"
}
```

### 400 - Bad Request (Missing Required Fields)
```json
{
  "success": false,
  "message": "Field wajib: invoice_number, invoice_date, due_date, customer_name, subtotal, total_amount"
}
```

### 500 - Server Error
```json
{
  "success": false,
  "message": "Terjadi kesalahan server saat mengambil data Invoices",
  "error": "Error details..."
}
```

---

## Import to Postman

1. File `POSTMAN_INVOICE_COLLECTION.json` sudah tersedia di root project
2. Buka Postman
3. Click **Import** button
4. Select file `POSTMAN_INVOICE_COLLECTION.json`
5. Collection "Finance Service - Invoice API" akan muncul di sidebar
6. Semua 8 request sudah siap digunakan:
   - Get All Invoices
   - Get Invoice by ID
   - Create Invoice
   - Update Invoice
   - Delete Invoice
   - Filter by Status - DRAFT
   - Filter by Status - PAID
   - Search by Customer Name

---

## Testing Workflow

### Test Complete CRUD Flow:

1. **CREATE** - Buat invoice baru:
```
POST http://localhost:3001/api/invoices
Body: { invoice_number, invoice_date, due_date, customer_name, subtotal, total_amount }
```

2. **READ ALL** - List semua invoices:
```
GET http://localhost:3001/api/invoices
```

3. **READ ONE** - Get invoice by ID (gunakan ID dari response CREATE):
```
GET http://localhost:3001/api/invoices/{id}
```

4. **UPDATE** - Update status invoice:
```
PUT http://localhost:3001/api/invoices/{id}
Body: { status: "SENT" }
```

5. **DELETE** - Hapus invoice:
```
DELETE http://localhost:3001/api/invoices/{id}
```

---

## Current Data Available

Saat ini backend sudah ada 3 invoices:
1. **INV-2024-001** - PT. Example Company (SENT) - Total: 11,100,000
2. **INV-2024-002** - PT. Sample Indonesia (DRAFT) - Total: 5,450,000
3. **INV-2024-003** - CV. Tech Solutions (PAID) - Total: 16,150,000

Gunakan ID dari invoices ini untuk testing GET/UPDATE/DELETE.
