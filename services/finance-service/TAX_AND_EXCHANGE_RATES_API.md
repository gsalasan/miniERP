# API CRUD untuk Tax Rates dan Exchange Rates

## Penjelasan FIN-03

Task **FIN-03** adalah membuat API CRUD (Create, Read, Update, Delete) untuk dua fitur penting di Finance Service:

### 1. **Tax Rates** (Tarif Pajak)
API untuk mengelola berbagai jenis tarif pajak seperti:
- PPN (Pajak Pertambahan Nilai)
- PPh (Pajak Penghasilan) 
- Pajak lainnya yang digunakan dalam transaksi keuangan

### 2. **Exchange Rates** (Kurs Mata Uang)
API untuk mengelola nilai tukar mata uang asing seperti:
- USD ke IDR
- EUR ke IDR
- Dan pasangan mata uang lainnya

---

## Setup Database

### Cara 1: Jalankan SQL Manual
Jalankan file SQL migration di `prisma/migrations/add_tax_and_exchange_rates.sql`:

```bash
psql -h 192.168.1.72 -U your_username -d minierp_unais -f prisma/migrations/add_tax_and_exchange_rates.sql
```

### Cara 2: Generate Prisma Client
Setelah tabel dibuat, generate Prisma Client:

```bash
cd services/finance-service
npx prisma generate
```

---

## Endpoint API

### Base URL
```
http://localhost:3012/api
```

---

## 📊 Tax Rates API

### 1. Get All Tax Rates
**GET** `/api/tax-rates`

**Response:**
```json
{
  "success": true,
  "message": "Daftar Tax Rates berhasil diambil",
  "data": [
    {
      "id": 1,
      "tax_name": "PPN",
      "tax_code": "PPN-11",
      "rate": "11.00",
      "description": "Pajak Pertambahan Nilai 11%",
      "is_active": true,
      "created_at": "2025-10-24T10:00:00.000Z",
      "updated_at": "2025-10-24T10:00:00.000Z"
    }
  ]
}
```

### 2. Get Tax Rate by ID
**GET** `/api/tax-rates/:id`

**Response:**
```json
{
  "success": true,
  "message": "Tax Rate berhasil diambil",
  "data": {
    "id": 1,
    "tax_name": "PPN",
    "tax_code": "PPN-11",
    "rate": "11.00",
    "description": "Pajak Pertambahan Nilai 11%",
    "is_active": true,
    "created_at": "2025-10-24T10:00:00.000Z",
    "updated_at": "2025-10-24T10:00:00.000Z"
  }
}
```

### 3. Create Tax Rate
**POST** `/api/tax-rates`

**Request Body:**
```json
{
  "tax_name": "PPN",
  "tax_code": "PPN-11",
  "rate": 11.00,
  "description": "Pajak Pertambahan Nilai 11%",
  "is_active": true
}
```

**Validasi:**
- `tax_name` (required): Nama pajak
- `tax_code` (required): Kode pajak (harus unique)
- `rate` (required): Persentase pajak (0-100)
- `description` (optional): Deskripsi
- `is_active` (optional, default: true): Status aktif

**Response:**
```json
{
  "success": true,
  "message": "Tax Rate berhasil dibuat",
  "data": {
    "id": 1,
    "tax_name": "PPN",
    "tax_code": "PPN-11",
    "rate": "11.00",
    "description": "Pajak Pertambahan Nilai 11%",
    "is_active": true,
    "created_at": "2025-10-24T10:00:00.000Z",
    "updated_at": "2025-10-24T10:00:00.000Z"
  }
}
```

### 4. Update Tax Rate
**PUT** `/api/tax-rates/:id`

**Request Body:**
```json
{
  "rate": 12.00,
  "description": "PPN naik menjadi 12%"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tax Rate berhasil diupdate",
  "data": {
    "id": 1,
    "tax_name": "PPN",
    "tax_code": "PPN-11",
    "rate": "12.00",
    "description": "PPN naik menjadi 12%",
    "is_active": true,
    "created_at": "2025-10-24T10:00:00.000Z",
    "updated_at": "2025-10-24T10:15:00.000Z"
  }
}
```

### 5. Delete Tax Rate
**DELETE** `/api/tax-rates/:id`

**Response:**
```json
{
  "success": true,
  "message": "Tax Rate berhasil dihapus"
}
```

---

## 💱 Exchange Rates API

### 1. Get All Exchange Rates
**GET** `/api/exchange-rates`

**Query Parameters:**
- `currency_from` (optional): Filter by currency from (e.g., USD)
- `currency_to` (optional): Filter by currency to (e.g., IDR)
- `is_active` (optional): Filter by active status (true/false)

**Example:**
```
GET /api/exchange-rates?currency_from=USD&currency_to=IDR
```

**Response:**
```json
{
  "success": true,
  "message": "Daftar Exchange Rates berhasil diambil",
  "data": [
    {
      "id": 1,
      "currency_from": "USD",
      "currency_to": "IDR",
      "rate": "15750.500000",
      "effective_date": "2025-10-24",
      "is_active": true,
      "created_at": "2025-10-24T10:00:00.000Z",
      "updated_at": "2025-10-24T10:00:00.000Z"
    }
  ]
}
```

### 2. Get Latest Exchange Rate
**GET** `/api/exchange-rates/latest?currency_from=USD&currency_to=IDR`

**Query Parameters:**
- `currency_from` (required): Mata uang asal (e.g., USD)
- `currency_to` (required): Mata uang tujuan (e.g., IDR)

**Response:**
```json
{
  "success": true,
  "message": "Latest Exchange Rate berhasil diambil",
  "data": {
    "id": 1,
    "currency_from": "USD",
    "currency_to": "IDR",
    "rate": "15750.500000",
    "effective_date": "2025-10-24",
    "is_active": true,
    "created_at": "2025-10-24T10:00:00.000Z",
    "updated_at": "2025-10-24T10:00:00.000Z"
  }
}
```

### 3. Get Exchange Rate by ID
**GET** `/api/exchange-rates/:id`

**Response:**
```json
{
  "success": true,
  "message": "Exchange Rate berhasil diambil",
  "data": {
    "id": 1,
    "currency_from": "USD",
    "currency_to": "IDR",
    "rate": "15750.500000",
    "effective_date": "2025-10-24",
    "is_active": true,
    "created_at": "2025-10-24T10:00:00.000Z",
    "updated_at": "2025-10-24T10:00:00.000Z"
  }
}
```

### 4. Create Exchange Rate
**POST** `/api/exchange-rates`

**Request Body:**
```json
{
  "currency_from": "USD",
  "currency_to": "IDR",
  "rate": 15750.50,
  "effective_date": "2025-10-24",
  "is_active": true
}
```

**Validasi:**
- `currency_from` (required): Kode mata uang asal (3 karakter, e.g., USD)
- `currency_to` (required): Kode mata uang tujuan (3 karakter, e.g., IDR)
- `rate` (required): Nilai kurs (harus > 0)
- `effective_date` (required): Tanggal berlaku
- `is_active` (optional, default: true): Status aktif
- Currency from dan to tidak boleh sama
- Kombinasi currency_from + currency_to + effective_date harus unique

**Response:**
```json
{
  "success": true,
  "message": "Exchange Rate berhasil dibuat",
  "data": {
    "id": 1,
    "currency_from": "USD",
    "currency_to": "IDR",
    "rate": "15750.500000",
    "effective_date": "2025-10-24",
    "is_active": true,
    "created_at": "2025-10-24T10:00:00.000Z",
    "updated_at": "2025-10-24T10:00:00.000Z"
  }
}
```

### 5. Update Exchange Rate
**PUT** `/api/exchange-rates/:id`

**Request Body:**
```json
{
  "rate": 15800.00,
  "is_active": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Exchange Rate berhasil diupdate",
  "data": {
    "id": 1,
    "currency_from": "USD",
    "currency_to": "IDR",
    "rate": "15800.000000",
    "effective_date": "2025-10-24",
    "is_active": true,
    "created_at": "2025-10-24T10:00:00.000Z",
    "updated_at": "2025-10-24T10:15:00.000Z"
  }
}
```

### 6. Delete Exchange Rate
**DELETE** `/api/exchange-rates/:id`

**Response:**
```json
{
  "success": true,
  "message": "Exchange Rate berhasil dihapus"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "tax_name, tax_code, dan rate wajib diisi"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Tax Rate tidak ditemukan"
}
```

### 409 Conflict
```json
{
  "success": false,
  "message": "Tax name atau tax code sudah digunakan"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Terjadi kesalahan server",
  "error": "Error details..."
}
```

---

## Testing dengan cURL

### Test Tax Rates

**Create Tax Rate:**
```bash
curl -X POST http://localhost:3012/api/tax-rates \
  -H "Content-Type: application/json" \
  -d '{
    "tax_name": "PPN",
    "tax_code": "PPN-11",
    "rate": 11.00,
    "description": "Pajak Pertambahan Nilai 11%"
  }'
```

**Get All Tax Rates:**
```bash
curl http://localhost:3012/api/tax-rates
```

**Update Tax Rate:**
```bash
curl -X PUT http://localhost:3012/api/tax-rates/1 \
  -H "Content-Type: application/json" \
  -d '{
    "rate": 12.00
  }'
```

### Test Exchange Rates

**Create Exchange Rate:**
```bash
curl -X POST http://localhost:3012/api/exchange-rates \
  -H "Content-Type: application/json" \
  -d '{
    "currency_from": "USD",
    "currency_to": "IDR",
    "rate": 15750.50,
    "effective_date": "2025-10-24"
  }'
```

**Get Latest Rate:**
```bash
curl "http://localhost:3012/api/exchange-rates/latest?currency_from=USD&currency_to=IDR"
```

**Get All Exchange Rates:**
```bash
curl http://localhost:3012/api/exchange-rates
```

---

## File Structure

```
services/finance-service/
├── src/
│   ├── controllers/
│   │   ├── taxrates.controllers.ts          # CRUD logic untuk Tax Rates
│   │   └── exchangerates.controllers.ts     # CRUD logic untuk Exchange Rates
│   ├── routes/
│   │   ├── taxrates.route.ts                # Routes untuk Tax Rates
│   │   └── exchangerates.route.ts           # Routes untuk Exchange Rates
│   └── utils/
│       └── app.ts                           # Main app (sudah ditambahkan routes)
```

---

## Kesimpulan

API CRUD untuk Tax Rates dan Exchange Rates sudah berhasil dibuat dengan fitur:

### Tax Rates:
✅ Create, Read, Update, Delete tax rates  
✅ Validasi rate antara 0-100%  
✅ Unique constraint untuk tax_name dan tax_code  
✅ Status aktif/non-aktif  

### Exchange Rates:
✅ Create, Read, Update, Delete exchange rates  
✅ Filter by currency dan status  
✅ Get latest rate untuk pasangan mata uang  
✅ Validasi kode mata uang 3 karakter  
✅ Unique constraint untuk kombinasi currency + tanggal  
✅ Rate harus positif  

**Tinggal jalankan migration SQL dan test API-nya!** 🚀
