# Finance Service - JSON Response Fix

## Masalah yang Diperbaiki
❌ **Error:** "Server returned non-JSON response"
- Frontend mengharapkan JSON tapi server mengirim response yang tidak valid

## Perbaikan yang Dilakukan

### 1. **Middleware Content-Type JSON** ✅
File: `src/utils/app.ts`

Menambahkan middleware untuk memastikan semua response memiliki Content-Type JSON:
```typescript
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});
```

### 2. **Global Error Handler** ✅
Menambahkan error handler yang selalu mengembalikan JSON:
```typescript
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Error:', err);
  
  if (!res.headersSent) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal Server Error",
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});
```

### 3. **404 Handler** ✅
Menambahkan handler untuk route yang tidak ditemukan:
```typescript
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
});
```

## Cara Menjalankan Service

### Opsi 1: Manual
```powershell
cd services\finance-service
npm run dev
```

### Opsi 2: Menggunakan Script
```powershell
cd services\finance-service
.\start-service.ps1
```

Service akan berjalan di: **http://localhost:3001**

## Testing

### Menggunakan HTML Test Page
1. Buka file: `services/finance-service/test-json.html` di browser
2. Klik tombol "Test Tax Rates" untuk test endpoint
3. Pastikan melihat "✅ SUCCESS! Server mengirim JSON yang valid"

### Menggunakan PowerShell
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/tax-rates" -Method GET | ConvertTo-Json
```

### Menggunakan cURL
```bash
curl -X GET http://localhost:3001/api/tax-rates -H "Content-Type: application/json"
```

### Menggunakan JavaScript Fetch
```javascript
fetch('http://localhost:3001/api/tax-rates')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

## Endpoints yang Tersedia

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/` | Status service |
| GET | `/api/tax-rates` | Get all tax rates |
| GET | `/api/tax-rates/:id` | Get tax rate by ID |
| POST | `/api/tax-rates` | Create new tax rate |
| PUT | `/api/tax-rates/:id` | Update tax rate |
| DELETE | `/api/tax-rates/:id` | Delete tax rate |
| GET | `/api/exchange-rates` | Get all exchange rates |
| GET | `/api/chart-of-accounts` | Get all chart of accounts |

## Format Response

### Success Response
```json
{
  "success": true,
  "message": "Daftar Tax Rates berhasil diambil",
  "data": [...]
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error (development only)"
}
```

## Troubleshooting

### Service tidak bisa diakses
1. Pastikan service sudah running: `npm run dev`
2. Cek port 3001 tidak digunakan aplikasi lain
3. Cek DATABASE_URL di `.env` sudah benar

### CORS Error
Service sudah dikonfigurasi untuk menerima request dari:
- http://localhost:3012
- http://localhost:3013
- http://localhost:5173
- http://localhost:3000
- file:// protocol (null origin)

### JSON Parse Error
Dengan perbaikan ini, semua response dijamin dalam format JSON yang valid dengan Content-Type header yang benar.

## Next Steps

✅ Service sekarang selalu mengirim JSON response yang valid
✅ Error handling sudah ditambahkan
✅ CORS sudah dikonfigurasi
✅ Content-Type header selalu di-set ke application/json

Frontend sekarang bisa menggunakan `fetch()` atau `axios.get()` tanpa error!
