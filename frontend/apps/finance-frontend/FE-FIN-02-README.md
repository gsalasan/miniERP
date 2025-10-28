# FE-FIN-02: Financial Cockpit - Frontend

## 📋 Deskripsi

Halaman **Kokpit Finansial** untuk mengelola **Tarif Pajak** dan **Kurs Mata Uang** dengan fitur CRUD lengkap.

## ✅ Fitur yang Dibuat

### 1. **Tarif Pajak (Tax Rates)**
- ✅ Tampilkan daftar tarif pajak
- ✅ Tambah tarif pajak baru (nama, kode, tarif %, deskripsi, status aktif)
- ✅ Edit tarif pajak
- ✅ Hapus tarif pajak
- ✅ Pencarian berdasarkan nama/kode pajak
- ✅ Status aktif/tidak aktif
- ✅ Validasi form (tarif 0-100%)

### 2. **Kurs Mata Uang (Exchange Rates)**
- ✅ Tampilkan daftar kurs mata uang
- ✅ Tambah kurs baru (dari mata uang, ke mata uang, nilai kurs, tanggal efektif)
- ✅ Edit kurs
- ✅ Hapus kurs
- ✅ Filter berdasarkan status aktif
- ✅ Pencarian mata uang
- ✅ Dropdown pilihan mata uang populer (USD, EUR, GBP, JPY, SGD, etc)
- ✅ Format tanggal dan angka Indonesia
- ✅ Validasi (kode 3 karakter, tidak boleh sama, nilai > 0)

## 📂 File yang Dibuat

```
frontend/apps/finance-frontend/src/
├── api/
│   └── index.ts (✅ Updated - tambah TaxRatesAPI & ExchangeRatesAPI)
├── pages/
│   ├── FinancialCockpit.tsx (✅ New - Main page dengan tabs)
│   └── FinancialCockpit/
│       ├── TaxRatesTab.tsx (✅ New - Tab Tarif Pajak)
│       └── ExchangeRatesTab.tsx (✅ New - Tab Kurs)
├── components/
│   └── Sidebar.tsx (✅ Updated - tambah menu Kokpit Finansial)
└── App.tsx (✅ Updated - tambah routes)
```

## 🌐 Routes

- `/financial-cockpit` - Halaman Kokpit Finansial
- `/admin/policies/finance` - Alias untuk halaman yang sama

## 🎨 UI Components

### Tab Navigation
- **Tarif Pajak** - Kelola berbagai jenis pajak (PPN, PPh, dll)
- **Kurs Mata Uang** - Kelola nilai tukar mata uang asing

### Features per Tab
- Search & Filter
- Add/Edit/Delete dengan Modal
- Confirm Dialog untuk delete
- Toast Notifications
- Responsive Table
- Loading States
- Form Validation
- Status Badge (Aktif/Tidak Aktif)

## 🔌 API Integration

### Tax Rates Endpoints
```typescript
GET    /api/tax-rates           // Get all tax rates
GET    /api/tax-rates/:id       // Get by ID
POST   /api/tax-rates           // Create new
PUT    /api/tax-rates/:id       // Update
DELETE /api/tax-rates/:id       // Delete
```

### Exchange Rates Endpoints
```typescript
GET    /api/exchange-rates              // Get all (dengan filter)
GET    /api/exchange-rates/latest       // Get latest rate
GET    /api/exchange-rates/:id          // Get by ID
POST   /api/exchange-rates              // Create new
PUT    /api/exchange-rates/:id          // Update
DELETE /api/exchange-rates/:id          // Delete
```

## 🚀 Cara Menjalankan

### 1. Pastikan Backend Running
```bash
cd services/finance-service
npm run dev
# Server akan jalan di http://localhost:3001
```

### 2. Jalankan Frontend
```bash
cd frontend/apps/finance-frontend
npm run dev
# Frontend akan jalan di http://localhost:5173
```

### 3. Akses Aplikasi
- Buka browser: `http://localhost:5173`
- Login (jika ada auth)
- Klik menu **Finance** → **Kokpit Finansial**

## 📸 Screenshots Preview

### Tarif Pajak Tab
- Tabel dengan kolom: Nama Pajak, Kode, Tarif (%), Deskripsi, Status, Aksi
- Button: Tambah, Edit, Hapus
- Search bar untuk pencarian

### Kurs Mata Uang Tab
- Tabel dengan kolom: Pasangan Mata Uang, Nilai Kurs, Tanggal Efektif, Status, Aksi
- Filter status: Semua/Aktif/Tidak Aktif
- Dropdown mata uang populer
- Format angka Indonesia (15.750,50)

## 🧪 Testing

### Test Tax Rates
1. Klik tab "Tarif Pajak"
2. Klik "Tambah Tarif Pajak"
3. Isi form:
   - Nama: PPN
   - Kode: PPN-11
   - Tarif: 11
   - Deskripsi: Pajak Pertambahan Nilai 11%
   - Status: Aktif
4. Klik Simpan
5. Data muncul di tabel

### Test Exchange Rates
1. Klik tab "Kurs Mata Uang"
2. Klik "Tambah Kurs"
3. Isi form:
   - Dari: USD
   - Ke: IDR
   - Nilai: 15750.50
   - Tanggal: (pilih tanggal)
   - Status: Aktif
4. Klik Simpan
5. Data muncul di tabel dengan format yang benar

## 🔧 Validasi Form

### Tax Rates
- Nama Pajak: Required
- Kode Pajak: Required, Unique
- Tarif: Required, 0-100%
- Deskripsi: Optional
- Status: Default Aktif

### Exchange Rates
- Mata Uang Asal: Required, 3 karakter
- Mata Uang Tujuan: Required, 3 karakter, tidak boleh sama dengan asal
- Nilai Kurs: Required, > 0
- Tanggal Efektif: Required
- Status: Default Aktif

## 🎯 State Management

Menggunakan React Hooks:
- `useState` untuk local state
- `useEffect` untuk fetch data
- `useMemo` untuk filtering & search
- `useToast` custom hook untuk notifications

## 🎨 Styling

- Tailwind CSS
- Heroicons untuk icons
- Responsive design (mobile & desktop)
- Color scheme: Blue (primary), Green (success), Red (danger)

## 📝 Type Safety

Semua komponen menggunakan TypeScript dengan types:
- `TaxRate`, `CreateTaxRateDto`, `UpdateTaxRateDto`
- `ExchangeRate`, `CreateExchangeRateDto`, `UpdateExchangeRateDto`
- `ApiResponse<T>`

## ✨ User Experience

- Toast notifications untuk feedback
- Loading states saat fetch/submit
- Confirm dialog sebelum delete
- Form validation dengan error messages
- Search & filter real-time
- Responsive design

## 🔒 Security Notes

- Input sanitization di backend
- CORS configuration di backend sudah benar
- Auth token placeholder (untuk development)

## 🐛 Troubleshooting

### Data tidak muncul?
1. Cek backend sudah running: `http://localhost:3001`
2. Cek console browser untuk error
3. Verify API endpoints di Network tab

### Form submit gagal?
1. Cek validasi form
2. Lihat error message di toast
3. Cek Network tab untuk response error

### TypeScript errors?
1. Restart TypeScript server: Ctrl+Shift+P → "TypeScript: Restart TS Server"
2. Atau reload VS Code window

## 🎉 Selesai!

**FE-FIN-02** sudah selesai dengan fitur CRUD lengkap untuk Tarif Pajak dan Kurs Mata Uang!

**Terima kasih! Semoga bermanfaat! 🚀**
