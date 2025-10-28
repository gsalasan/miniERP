# Cara Menjalankan FIN-03: Tax Rates & Exchange Rates API

## ⚠️ PENTING: Langkah Instalasi

Ikuti langkah-langkah ini **secara berurutan**:

### 1. Buat Tabel di Database

Jalankan SQL migration untuk membuat tabel `tax_rates` dan `exchange_rates`:

```bash
# Jalankan dari root folder miniERP
psql -h 192.168.1.72 -U your_username -d minierp_unais -f prisma/migrations/add_tax_and_exchange_rates.sql
```

Atau copy-paste isi file `prisma/migrations/add_tax_and_exchange_rates.sql` ke pgAdmin atau DBeaver.

### 2. (Optional) Insert Data Sample

Untuk testing, insert data sample:

```bash
psql -h 192.168.1.72 -U your_username -d minierp_unais -f prisma/migrations/seed_tax_and_exchange_rates.sql
```

### 3. Generate Prisma Client

Generate Prisma Client agar TypeScript mengenali model baru:

```bash
cd services/finance-service
npx prisma generate
```

### 4. Restart Finance Service

Restart server agar perubahan diterapkan:

```bash
# Dari folder services/finance-service
npm run dev
```

### 5. Test API

Test endpoint dengan curl atau Postman:

```bash
# Test Tax Rates
curl http://localhost:3012/api/tax-rates

# Test Exchange Rates
curl http://localhost:3012/api/exchange-rates
```

---

## 📝 Penjelasan Singkat

**FIN-03** adalah task untuk membuat API CRUD (Create, Read, Update, Delete) untuk:

### Tax Rates (Tarif Pajak)
- Mengelola berbagai jenis pajak: PPN, PPh 21, PPh 23, dll
- Rate dalam persentase (0-100%)
- Bisa di-aktifkan/non-aktifkan

### Exchange Rates (Kurs Mata Uang)  
- Mengelola nilai tukar mata uang asing
- Support berbagai pasangan currency (USD-IDR, EUR-IDR, dll)
- Tracking berdasarkan tanggal efektif
- Bisa query kurs terbaru

---

## 🔗 Dokumentasi Lengkap

Lihat dokumentasi lengkap API di:
- **TAX_AND_EXCHANGE_RATES_API.md**

Dokumentasi mencakup:
- Semua endpoint yang tersedia
- Request & response format
- Validasi & error handling
- Contoh testing dengan cURL
- File structure

---

## ✅ Checklist

- [ ] Jalankan migration SQL
- [ ] Insert sample data (optional)
- [ ] Generate Prisma Client
- [ ] Restart server
- [ ] Test API endpoints
- [ ] Baca dokumentasi lengkap

---

## 🆘 Troubleshooting

### Error: Property 'taxRates' does not exist
**Solusi:** Jalankan `npx prisma generate` di folder `services/finance-service`

### Error: Table doesn't exist
**Solusi:** Pastikan SQL migration sudah dijalankan di database

### Cannot connect to database
**Solusi:** Cek DATABASE_URL di file `.env` sesuai dengan database PostgreSQL yang digunakan

---

**Happy Coding! 🚀**
