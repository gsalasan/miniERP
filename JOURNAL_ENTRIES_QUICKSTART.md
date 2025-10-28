# Journal Entries - Quick Start Guide

## 🚀 Setup (5 menit)

### 1. Jalankan Migration Database
```bash
node run-journal-entries-migration.mjs
```

### 2. Generate Prisma Client
```bash
cd services/finance-service
npx prisma generate
```

### 3. Restart Finance Service
```bash
cd services/finance-service
npm run dev
```

### 4. Akses Frontend
Buka browser: `http://localhost:5173/coa` → Tab "Journal Entries"

## ✅ Apa yang Sudah Ditambahkan?

### Backend (Finance Service)
- ✅ Model `JournalEntry` di Prisma schema
- ✅ Migration SQL untuk tabel `journal_entries`
- ✅ Service layer (`journalentries.service.ts`)
- ✅ Controller (`journalentries.controllers.ts`)
- ✅ Routes (`journalentries.route.ts`)
- ✅ Integrasi ke `app.ts`

### Frontend (Finance Frontend)
- ✅ API types & client di `api/index.ts`
- ✅ Komponen `JournalEntriesTab.tsx`
- ✅ Tab navigation di halaman COA
- ✅ Utility formatters (`formatters.ts`)
- ✅ CRUD operations lengkap
- ✅ Filter & search functionality
- ✅ Expandable row details

## 📊 Relasi dengan COA

```
ChartOfAccounts (COA)
    ↓ (One-to-Many)
JournalEntry
```

Setiap journal entry **HARUS** terkait dengan satu akun di COA melalui `account_id`.

## 🎯 Fitur Utama

### 1. Tampilan Tab di COA
- Tab "Chart of Accounts" - Kelola COA
- Tab "Journal Entries" - Kelola transaksi

### 2. Journal Entries Features
- **Create** - Tambah entry baru (debit atau credit)
- **Read** - Lihat semua entries dengan filter
- **Update** - Edit entry existing
- **Delete** - Hapus entry
- **Filter by Account** - Filter berdasarkan akun
- **Filter by Date Range** - Filter berdasarkan tanggal
- **Search** - Cari berdasarkan deskripsi/referensi
- **Expandable Details** - Klik chevron untuk lihat detail lengkap
- **Balance Summary** - Total debit/credit otomatis

## 📝 Cara Pakai

### Membuat Journal Entry

1. Klik tab "Journal Entries"
2. Klik tombol "Tambah Journal Entry"
3. Isi form:
   - **Tanggal Transaksi** (required)
   - **Akun** (required) - pilih dari dropdown
   - **Debit ATAU Credit** (required) - isi salah satu saja
   - **Deskripsi** (optional)
   - **Reference ID & Type** (optional)
4. Klik "Simpan"

### Filter & Search

- **Cari**: Ketik di search box (cari deskripsi/referensi)
- **Filter Akun**: Pilih akun dari dropdown
- **Filter Tanggal**: Pilih dari/sampai tanggal
- **Lihat Detail**: Klik ikon chevron di sebelah kiri row

## 🔧 API Endpoints

```
GET    /api/journal-entries              - Get all entries
GET    /api/journal-entries/:id          - Get entry by ID
GET    /api/journal-entries/account/:id  - Get entries by account
POST   /api/journal-entries              - Create entry
PUT    /api/journal-entries/:id          - Update entry
DELETE /api/journal-entries/:id          - Delete entry
GET    /api/journal-entries/account/:id/balance - Get account balance
```

## ⚠️ Aturan Penting

1. **Debit OR Credit** - Isi salah satu saja, tidak boleh keduanya
2. **Account Required** - Harus pilih akun yang ada di COA
3. **Date Required** - Tanggal transaksi wajib diisi
4. **Foreign Key** - Tidak bisa hapus akun COA yang punya journal entries

## 🎨 Double-Entry Bookkeeping

| Tipe Akun | Naik (Increase) | Turun (Decrease) |
|-----------|----------------|------------------|
| Asset     | Debit          | Credit           |
| Liability | Credit         | Debit            |
| Equity    | Credit         | Debit            |
| Revenue   | Credit         | Debit            |
| Expense   | Debit          | Credit           |

### Contoh: Penjualan Tunai Rp 1.000.000

Entry 1 (Cash masuk):
- Account: 1100 - Cash (Asset)
- **Debit**: 1.000.000
- Description: "Penjualan tunai - Invoice #001"

Entry 2 (Sales Revenue):
- Account: 4000 - Sales Revenue (Revenue)
- **Credit**: 1.000.000
- Description: "Penjualan tunai - Invoice #001"

## 🐛 Troubleshooting

### Backend tidak jalan?
```bash
cd services/finance-service
npm install
npm run dev
```

### Error "Module not found"?
```bash
cd services/finance-service
npx prisma generate
```

### Frontend tidak connect?
- Cek backend running di `http://localhost:3012`
- Cek CORS di browser console
- Cek `API_ENDPOINTS` di frontend config

### Data tidak muncul?
- Cek browser console (F12)
- Cek network tab untuk API calls
- Cek backend logs di terminal

## 📚 Dokumentasi Lengkap

Lihat: `JOURNAL_ENTRIES_GUIDE.md` untuk dokumentasi detail.

## 🎉 Selesai!

Journal Entries sudah terintegrasi dengan COA. Sekarang Anda bisa:
- ✅ Mencatat semua transaksi keuangan
- ✅ Melacak debit/credit per akun
- ✅ Melihat history transaksi
- ✅ Filter dan search entries
- ✅ Generate balance per akun

Happy Accounting! 🎯
