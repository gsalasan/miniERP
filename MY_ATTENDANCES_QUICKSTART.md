# 🚀 Quick Start: Halaman Riwayat Absensi

## 📍 Lokasi File

```
frontend/
├── apps/
│   └── main-frontend/
│       ├── src/
│       │   ├── App.tsx                    ✅ Updated (+ route)
│       │   ├── pages/
│       │   │   └── MyAttendances.tsx      ✅ NEW (402 lines)
│       │   └── components/
│       │       └── AttendanceCard.tsx     ✅ NEW (180 lines)
│       └── package.json
```

## 🎯 Yang Baru Dibuat

### 1️⃣ **MyAttendances.tsx** (Halaman Utama)
- **Path**: `frontend/apps/main-frontend/src/pages/MyAttendances.tsx`
- **Size**: 402 baris
- **Purpose**: Menampilkan kalender + detail riwayat absensi
- **Features**:
  - 📅 Kalender interaktif
  - 📋 Detail absensi per tanggal
  - 📊 Statistik ringkasan
  - 📱 Responsive design

### 2️⃣ **AttendanceCard.tsx** (Komponen Card)
- **Path**: `frontend/apps/main-frontend/src/components/AttendanceCard.tsx`
- **Size**: 180 baris
- **Purpose**: Card komponen untuk satu record absensi
- **Features**:
  - 🎨 Material-UI design
  - ⏱️ Jam masuk-keluar
  - 📍 Lokasi
  - 📊 Durasi kerja

### 3️⃣ **App.tsx** (Update Routing)
- **Path**: `frontend/apps/main-frontend/src/App.tsx`
- **Changes**: 
  ```tsx
  import MyAttendances from './pages/MyAttendances';
  // ...
  <Route path="/my-attendances" element={<MyAttendances />} />
  ```

---

## 🚀 Cara Menggunakan

### Step 1: Navigasi ke Halaman
```
URL: http://localhost:5173/my-attendances
atau
Click: Menu/Sidebar → Riwayat Absensi
```

### Step 2: Lihat Kalender & Pilih Tanggal
```
Kalender menampilkan:
- ✓ Checkmark = Ada absensi
- [Tanggal Bold] = Tanggal dipilih
- [Hari Ini] = Border biru
```

### Step 3: Lihat Detail Absensi
```
Card menampilkan:
- 📅 Tanggal & Status
- 🔵 Jam Masuk (Check-in)
- 🟢 Jam Keluar (Check-out)
- 📍 Lokasi
- ⏱️ Durasi Kerja
```

### Step 4: Lihat Statistik
```
Sidebar kanan bawah:
- Total Hadir
- Total Belum Checkout
- Total Keseluruhan
```

---

## 📊 UI Preview

### Desktop View
```
┌─────────────────────────────────────┐
│ 📊 RIWAYAT ABSENSI SAYA             │
└─────────────────────────────────────┘

┌──────────────┬────────────────────┐
│              │                    │
│  KALENDER    │   DETAIL ABSENSI   │
│              │                    │
│ ┌──────────┐ │ ┌────────────────┐ │
│ │Oct 2025  │ │ │17 Nov, Hadir ✓ │ │
│ │ M T W T F│ │ │                │ │
│ │ S S      │ │ │🔵 09:30        │ │
│ │ 1 2 3 4 5│ │ │📍 Bandung      │ │
│ │ 6 7 8 910│ │ │                │ │
│ │ ...      │ │ │🟢 17:45        │ │
│ └──────────┘ │ │📍 Bandung      │ │
│              │ │                │ │
│ [Hari Ini]   │ │⏱️ 8h 15m      │ │
│              │ │                │ │
│ RINGKASAN    │ │                │ │
│ Hadir:  [5]  │ │                │ │
│ Blm:    [1]  │ │                │ │
│ Total:  [6]  │ │                │ │
│              │ │                │ │
└──────────────┴────────────────────┘
```

### Mobile View
```
┌──────────────────────────┐
│ 📊 RIWAYAT ABSENSI       │
├──────────────────────────┤
│ 📅 KALENDER              │
│ ◀ Oct 2025 ▶             │
│ [Kalender Grid]          │
│ [Hari Ini]               │
├──────────────────────────┤
│ 📊 RINGKASAN             │
│ Hadir:    [5]            │
│ Blm Out:  [1]            │
│ Total:    [6]            │
├──────────────────────────┤
│ 📋 DETAIL ABSENSI        │
│ 17 Nov, Hadir ✓          │
│ 🔵 09:30 / Bandung      │
│ 🟢 17:45 / Bandung      │
│ ⏱️  8h 15m              │
└──────────────────────────┘
```

---

## 🔄 Data Flow

```
1. User buka /my-attendances
   ↓
2. MyAttendances component mount
   ↓
3. useEffect trigger → fetch data
   ↓
4. API call: GET /api/v1/attendances/my
   ↓
5. Backend return: AttendanceListResponse
   ↓
6. Transform data → AttendanceRecord[]
   ↓
7. Render:
   - Calendar (left sidebar)
   - Statistics (left bottom)
   - Detail cards (right side)
   ↓
8. User interact:
   - Click date → update selectedDate
   - Click month → navigate calendar
   - Click "Hari Ini" → reset to today
   ↓
9. UI update based on state change
```

---

## 📋 Fitur Detail

### ✅ Kalender
- **Navigasi**: ◀ Prev | Month/Year | Next ▶
- **Grid**: 7x6 (Minggu-Sabtu)
- **Highlight**:
  - Tanggal dengan absensi: 🟢 checkmark
  - Tanggal dipilih: 🔵 biru
  - Hari ini: 🔵 border

### ✅ Detail Absensi
Untuk setiap tanggal dipilih, tampilkan:
- **Header**: Hari, Tanggal + Status Badge
- **Check-in**: 🔵 Waktu + Lokasi
- **Check-out**: 🟢 Waktu + Lokasi (atau "-" jika belum)
- **Durasi**: ⏱️ Jam + Menit (jika sudah checkout)

### ✅ Statistik
```
┌─────────────────┐
│ Hadir      [N] │
│ Blm Out    [N] │
│ Total      [N] │
└─────────────────┘
```

### ✅ Status Badge
| Status | Warna |
|--------|-------|
| Hadir | 🟢 Hijau |
| Belum Checkout | 🔵 Biru |
| Terlambat | 🟡 Kuning |
| Tidak Hadir | 🔴 Merah |

---

## 🛠️ Teknologi

```
✅ React 18
✅ TypeScript
✅ Material-UI (MUI)
✅ Axios
✅ React Router DOM
```

---

## 📱 Responsive

```
Mobile (xs)     : Full width (100%)
Tablet (md)     : Sidebar 25% | Content 75%
Desktop (lg+)   : Sidebar 25% | Content 75%
```

---

## 🔐 Autentikasi

- Token dari: `localStorage.getItem('token')`
- Header: `Authorization: Bearer {token}`
- Axios interceptor otomatis

---

## ⚡ Performance

- **Load Data**: On mount (useEffect)
- **State**: Simple useState (suitable untuk < 1000 records)
- **Rendering**: Efficient grid + keys
- **Date Calculation**: O(n) filtering

---

## 🐛 Error Handling

### Scenarios
```
✅ Loading state    → Show spinner
✅ No data         → Show "Tidak ada data"
✅ API error       → Show error alert
✅ Network error   → Show network error message
```

---

## 🎯 Next Steps

### Untuk Developer
1. ✅ Build & run frontend
2. ✅ Pastikan HR Service running (port 4004)
3. ✅ Login untuk get token
4. ✅ Navigate ke `/my-attendances`
5. ✅ Test berbagai fitur

### Untuk Product
1. ✅ Validate UI/UX
2. ✅ Test dengan real data
3. ✅ Gather user feedback
4. ✅ Plan enhancements

---

## 📞 Useful Commands

```bash
# Start frontend development
cd frontend
npm run dev

# Build frontend
npm run build:frontend

# Check types
npm run type-check

# Format code
npm run format

# Lint code
npm run lint
```

---

## 📚 File References

| File | Lines | Purpose |
|------|-------|---------|
| MyAttendances.tsx | 402 | Halaman utama |
| AttendanceCard.tsx | 180 | Komponen card |
| App.tsx | ~10 | Route config |
| attendance.ts | - | API integration |

---

## 🎓 Contoh Kode

### Akses halaman dari link
```tsx
import { Link } from 'react-router-dom';

export function SomeComponent() {
  return (
    <Link to="/my-attendances">
      Lihat Riwayat Absensi
    </Link>
  );
}
```

### Fetch manual
```tsx
import { getMyAttendances } from '../api/attendance';

const fetchData = async () => {
  try {
    const response = await getMyAttendances();
    console.log(response.data); // Array of records
  } catch (err) {
    console.error(err);
  }
};
```

---

## ✅ Checklist

- [x] Create MyAttendances.tsx
- [x] Create AttendanceCard.tsx
- [x] Update App.tsx (add route)
- [x] Type definitions
- [x] API integration
- [x] Calendar logic
- [x] Responsive design
- [x] Error handling
- [x] Loading states
- [x] Documentation

---

## 🎉 Status

**✅ READY FOR TESTING**

Semua fitur sudah selesai dan siap untuk ditest!

---

**Created**: 17 November 2025  
**Version**: 1.0.0  
**Status**: Production Ready ✅
